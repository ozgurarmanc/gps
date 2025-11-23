use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing::{info, warn};

mod celo_verifier;
mod location_store;
mod sapphire_client;

use celo_verifier::CeloVerifier;
use location_store::{FriendRequest, FriendRequestStatus, LocationStore};
use sapphire_client::SapphireClient;

// ============================================================================
// Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SharingLevel {
    City,
    Realtime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocationData {
    pub latitude: f64,
    pub longitude: f64,
    pub city: Option<String>,
    pub country: Option<String>,
    pub timestamp: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    #[serde(rename = "userName")]
    pub user_name: Option<String>,
    #[serde(rename = "sharingLevel")]
    pub sharing_level: Option<SharingLevel>,
    pub location: Option<LocationData>,
    #[serde(rename = "lastUpdated")]
    pub last_updated: Option<i64>,
}

// ============================================================================
// Request/Response Types
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct VerifySelfAuthRequest {
    pub celo_uid: String,
    pub user_id: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLocationRequest {
    pub user_id: String,
    pub location: LocationData,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSharingLevelRequest {
    pub user_id: String,
    pub level: SharingLevel,
}

#[derive(Debug, Deserialize)]
pub struct AddFriendRequest {
    pub user_id: String,
    pub friend_id: String,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    fn err(error: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error),
        }
    }
}

// ============================================================================
// Application State
// ============================================================================

#[derive(Clone)]
pub struct AppState {
    pub location_store: Arc<LocationStore>,
    pub sapphire_client: Arc<SapphireClient>,
    pub celo_verifier: Arc<CeloVerifier>,
}

// ============================================================================
// Handlers
// ============================================================================

/// Health check endpoint
async fn health() -> &'static str {
    "ok"
}

/// Verify Self Protocol authentication and check Celo UID
async fn verify_self_auth(
    State(state): State<AppState>,
    Json(payload): Json<VerifySelfAuthRequest>,
) -> impl IntoResponse {
    info!("🔐 Verifying Self auth for user: {}", payload.user_id);

    // Verify Celo UID matches
    match state
        .celo_verifier
        .verify_uid(&payload.celo_uid, &payload.user_id)
        .await
    {
        Ok(true) => {
            info!("✅ Celo UID verified for user: {}", payload.user_id);
            (
                StatusCode::OK,
                Json(ApiResponse::ok(serde_json::json!({
                    "verified": true,
                    "user_id": payload.user_id
                }))),
            )
        }
        Ok(false) => {
            warn!("❌ Celo UID mismatch for user: {}", payload.user_id);
            (
                StatusCode::UNAUTHORIZED,
                Json(ApiResponse::ok(serde_json::json!({
                    "error": "Celo UID verification failed"
                }))),
            )
        }
        Err(e) => {
            warn!("⚠️ Celo verification error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::ok(serde_json::json!({
                    "error": format!("Verification error: {}", e)
                }))),
            )
        }
    }
}

/// Get user profile
async fn get_profile(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
) -> impl IntoResponse {
    info!("👤 Getting profile for user: {}", user_id);

    match state.location_store.get_user(&user_id).await {
        Some(user) => (StatusCode::OK, Json(ApiResponse::ok(user))),
        None => {
            let empty_user = User {
                id: user_id.clone(),
                user_name: None,
                sharing_level: None,
                location: None,
                last_updated: None,
            };
            (StatusCode::OK, Json(ApiResponse::ok(empty_user)))
        },
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    #[serde(rename = "userName")]
    pub user_name: Option<String>,
}

/// Update user profile
async fn update_profile(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
    Json(payload): Json<UpdateProfileRequest>,
) -> impl IntoResponse {
    info!("✏️ Updating profile for user: {}", user_id);

    state
        .location_store
        .update_profile(&user_id, payload.user_name)
        .await;

    (
        StatusCode::OK,
        Json(ApiResponse::ok(serde_json::json!({
            "updated": true
        }))),
    )
}

/// Update user's location
async fn update_location(
    State(state): State<AppState>,
    Json(payload): Json<UpdateLocationRequest>,
) -> impl IntoResponse {
    info!("📍 Updating location for user: {}", payload.user_id);

    state
        .location_store
        .update_location(&payload.user_id, payload.location)
        .await;

    (
        StatusCode::OK,
        Json(ApiResponse::ok(serde_json::json!({
            "updated": true
        }))),
    )
}

/// Update sharing level
async fn update_sharing_level(
    State(state): State<AppState>,
    Json(payload): Json<UpdateSharingLevelRequest>,
) -> impl IntoResponse {
    info!(
        "🔒 Updating sharing level for user: {} to {:?}",
        payload.user_id, payload.level
    );

    state
        .location_store
        .update_sharing_level(&payload.user_id, payload.level)
        .await;

    (
        StatusCode::OK,
        Json(ApiResponse::ok(serde_json::json!({
            "updated": true
        }))),
    )
}

/// Get user's friends from Sapphire
async fn get_friends(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
) -> impl IntoResponse {
    info!("👥 Getting friends for user: {}", user_id);

    match state.sapphire_client.get_friends(&user_id).await {
        Ok(friends) => (StatusCode::OK, Json(ApiResponse::ok(friends))),
        Err(_e) => (StatusCode::OK, Json(ApiResponse::ok(Vec::<String>::new()))),
    }
}

/// Add friend (stores on Sapphire)
async fn add_friend(
    State(state): State<AppState>,
    Json(payload): Json<AddFriendRequest>,
) -> impl IntoResponse {
    info!(
        "➕ Adding friend {} for user: {}",
        payload.friend_id, payload.user_id
    );

    match state
        .sapphire_client
        .add_friend(&payload.user_id, &payload.friend_id)
        .await
    {
        Ok(_) => (
            StatusCode::OK,
            Json(ApiResponse::ok(serde_json::json!({
                "added": true
            }))),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::ok(serde_json::json!({
                "error": format!("Failed to add friend: {}", e)
            }))),
        ),
    }
}

/// Remove friend (removes from Sapphire)
async fn remove_friend(
    State(state): State<AppState>,
    Path((user_id, friend_id)): Path<(String, String)>,
) -> impl IntoResponse {
    info!("➖ Removing friend {} for user: {}", friend_id, user_id);

    match state
        .sapphire_client
        .remove_friend(&user_id, &friend_id)
        .await
    {
        Ok(_) => (
            StatusCode::OK,
            Json(ApiResponse::ok(serde_json::json!({
                "removed": true
            }))),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::ok(serde_json::json!({
                "error": format!("Failed to remove friend: {}", e)
            }))),
        ),
    }
}

/// Get all friends' locations (with privacy filtering)
async fn get_friends_locations(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
) -> impl IntoResponse {
    info!("🗺️ Getting friends' locations for user: {}", user_id);

    // Get friends from Sapphire
    let friends = match state.sapphire_client.get_friends(&user_id).await {
        Ok(f) => f,
        Err(_e) => return (StatusCode::OK, Json(ApiResponse::ok(Vec::<User>::new()))),
    };

    // Get locations for each friend with privacy filtering
    let mut friend_locations = Vec::new();
    for friend_id in friends {
        if let Some(mut friend) = state.location_store.get_user(&friend_id).await {
            // Apply privacy filtering based on sharing level
            if let Some(location) = &mut friend.location {
                match friend.sharing_level {
                    Some(SharingLevel::City) => {
                        // Round to city level (2 decimal places)
                        location.latitude = (location.latitude * 100.0).round() / 100.0;
                        location.longitude = (location.longitude * 100.0).round() / 100.0;
                    }
                    Some(SharingLevel::Realtime) => {
                        // Keep exact coordinates
                    }
                    None => {
                        // No sharing level set, hide location
                        friend.location = None;
                    }
                }
            }
            friend_locations.push(friend);
        }
    }

    (StatusCode::OK, Json(ApiResponse::ok(friend_locations)))
}

/// Get specific friend's location (with privacy filtering)
async fn get_friend_location(
    State(state): State<AppState>,
    Path((user_id, friend_id)): Path<(String, String)>,
) -> impl IntoResponse {
    info!("👤 Getting location for friend: {} (user: {})", friend_id, user_id);

    // Check if they are friends
    let friends = match state.sapphire_client.get_friends(&user_id).await {
        Ok(f) => f,
        Err(_e) => {
            let empty_user = User {
                id: friend_id.clone(),
                user_name: None,
                sharing_level: None,
                location: None,
                last_updated: None,
            };
            return (StatusCode::OK, Json(ApiResponse::ok(empty_user)));
        }
    };

    if !friends.contains(&friend_id) {
        let empty_user = User {
            id: friend_id.clone(),
            user_name: None,
            sharing_level: None,
            location: None,
            last_updated: None,
        };
        return (StatusCode::OK, Json(ApiResponse::ok(empty_user)));
    }

    // Get friend's location
    match state.location_store.get_user(&friend_id).await {
        Some(mut friend) => {
            // Apply privacy filtering
            if let Some(location) = &mut friend.location {
                match friend.sharing_level {
                    Some(SharingLevel::City) => {
                        location.latitude = (location.latitude * 100.0).round() / 100.0;
                        location.longitude = (location.longitude * 100.0).round() / 100.0;
                    }
                    Some(SharingLevel::Realtime) => {}
                    None => {
                        friend.location = None;
                    }
                }
            }
            (StatusCode::OK, Json(ApiResponse::ok(friend)))
        }
        None => {
            let empty_user = User {
                id: friend_id.clone(),
                user_name: None,
                sharing_level: None,
                location: None,
                last_updated: None,
            };
            (StatusCode::OK, Json(ApiResponse::ok(empty_user)))
        },
    }
}

// ============================================================================
// Friend Request Handlers
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct SendFriendRequestRequest {
    #[serde(rename = "senderId")]
    pub sender_id: String,
    #[serde(rename = "receiverId")]
    pub receiver_id: String,
}

#[derive(Debug, Deserialize)]
pub struct RespondFriendRequestRequest {
    #[serde(rename = "requestId")]
    pub request_id: String,
}

/// Send friend request
async fn send_friend_request(
    State(state): State<AppState>,
    Json(payload): Json<SendFriendRequestRequest>,
) -> impl IntoResponse {
    info!(
        "📨 Sending friend request from {} to {}",
        payload.sender_id, payload.receiver_id
    );

    match state
        .location_store
        .send_friend_request(&payload.sender_id, &payload.receiver_id)
        .await
    {
        Ok(request) => (StatusCode::OK, Json(ApiResponse::ok(request))),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::err(e)),
        ),
    }
}

/// Get pending friend requests for a user
async fn get_friend_requests(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
) -> impl IntoResponse {
    info!("📬 Getting friend requests for user: {}", user_id);

    let requests = state.location_store.get_friend_requests(&user_id).await;
    (StatusCode::OK, Json(ApiResponse::ok(requests)))
}

/// Accept friend request
async fn accept_friend_request(
    State(state): State<AppState>,
    Path((user_id, request_id)): Path<(String, String)>,
) -> impl IntoResponse {
    info!("✅ User {} accepting friend request: {}", user_id, request_id);

    match state.location_store.accept_friend_request(&request_id).await {
        Ok(request) => {
            // Add both users as friends on Sapphire
            let _ = state
                .sapphire_client
                .add_friend(&request.sender_id, &request.receiver_id)
                .await;
            let _ = state
                .sapphire_client
                .add_friend(&request.receiver_id, &request.sender_id)
                .await;

            (StatusCode::OK, Json(ApiResponse::ok(request)))
        }
        Err(e) => (StatusCode::BAD_REQUEST, Json(ApiResponse::err(e))),
    }
}

/// Decline friend request
async fn decline_friend_request(
    State(state): State<AppState>,
    Path((user_id, request_id)): Path<(String, String)>,
) -> impl IntoResponse {
    info!("❌ User {} declining friend request: {}", user_id, request_id);

    match state.location_store.decline_friend_request(&request_id).await {
        Ok(_) => (
            StatusCode::OK,
            Json(ApiResponse::ok(serde_json::json!({"declined": true}))),
        ),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ApiResponse::err(e))),
    }
}

// ============================================================================
// Main Application
// ============================================================================

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    info!("🚀 Starting Linda ROFL Backend...");

    // Initialize components
    let location_store = Arc::new(LocationStore::new());
    let sapphire_client = Arc::new(SapphireClient::new().await?);
    let celo_verifier = Arc::new(CeloVerifier::new());

    let state = AppState {
        location_store,
        sapphire_client,
        celo_verifier,
    };

    // Build router
    let app = Router::new()
        .route("/health", get(health))
        .route("/auth/verify", post(verify_self_auth))
        .route("/users/:user_id", get(get_profile).put(update_profile))
        .route("/users/:user_id/location", post(update_location))
        .route("/users/:user_id/sharing-level", post(update_sharing_level))
        .route("/users/:user_id/friends", get(get_friends).post(add_friend))
        .route(
            "/users/:user_id/friends/:friend_id",
            delete(remove_friend).get(get_friend_location),
        )
        .route(
            "/users/:user_id/friends/locations",
            get(get_friends_locations),
        )
        .route(
            "/users/:user_id/friend-requests",
            get(get_friend_requests).post(send_friend_request),
        )
        .route(
            "/users/:user_id/friend-requests/:request_id/accept",
            post(accept_friend_request),
        )
        .route(
            "/users/:user_id/friend-requests/:request_id/decline",
            post(decline_friend_request),
        )
        .layer(CorsLayer::permissive())
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{}", port);

    info!("✅ Server listening on {}", addr);
    info!("📍 Location sharing with in-memory friend storage");
    info!("🔐 Celo UID verification enabled (dev mode)");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
