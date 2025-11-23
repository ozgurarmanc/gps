use crate::{LocationData, SharingLevel, User};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use std::time::{SystemTime, UNIX_EPOCH};

/// Friend request status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum FriendRequestStatus {
    Pending,
    Accepted,
    Declined,
}

/// Friend request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FriendRequest {
    pub id: String,
    #[serde(rename = "senderId")]
    pub sender_id: String,
    #[serde(rename = "receiverId")]
    pub receiver_id: String,
    pub status: FriendRequestStatus,
    pub timestamp: i64,
}

/// In-memory location store (running in TEE)
/// This stores location data securely within the ROFL container
pub struct LocationStore {
    users: RwLock<HashMap<String, User>>,
    friend_requests: RwLock<HashMap<String, FriendRequest>>,
}

impl LocationStore {
    pub fn new() -> Self {
        Self {
            users: RwLock::new(HashMap::new()),
            friend_requests: RwLock::new(HashMap::new()),
        }
    }

    /// Get user by ID
    pub async fn get_user(&self, user_id: &str) -> Option<User> {
        let users = self.users.read().unwrap();
        users.get(user_id).cloned()
    }

    /// Update user's location
    pub async fn update_location(&self, user_id: &str, mut location: LocationData) {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        location.timestamp = Some(timestamp);

        let mut users = self.users.write().unwrap();
        users
            .entry(user_id.to_string())
            .and_modify(|user| {
                user.location = Some(location.clone());
                user.last_updated = Some(timestamp);
            })
            .or_insert_with(|| User {
                id: user_id.to_string(),
                user_name: None,
                sharing_level: None,
                location: Some(location),
                last_updated: Some(timestamp),
            });
    }

    /// Update user's sharing level
    pub async fn update_sharing_level(&self, user_id: &str, level: SharingLevel) {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        let mut users = self.users.write().unwrap();
        users
            .entry(user_id.to_string())
            .and_modify(|user| {
                user.sharing_level = Some(level.clone());
                user.last_updated = Some(timestamp);
            })
            .or_insert_with(|| User {
                id: user_id.to_string(),
                user_name: None,
                sharing_level: Some(level),
                location: None,
                last_updated: Some(timestamp),
            });
    }

    /// Update user profile
    pub async fn update_profile(&self, user_id: &str, user_name: Option<String>) {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        let mut users = self.users.write().unwrap();
        users
            .entry(user_id.to_string())
            .and_modify(|user| {
                user.user_name = user_name.clone();
                user.last_updated = Some(timestamp);
            })
            .or_insert_with(|| User {
                id: user_id.to_string(),
                user_name,
                sharing_level: None,
                location: None,
                last_updated: Some(timestamp),
            });
    }

    /// Send friend request
    pub async fn send_friend_request(&self, sender_id: &str, receiver_id: &str) -> Result<FriendRequest, String> {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        let request_id = format!("{}_{}", sender_id, receiver_id);

        // Check if request already exists
        let requests = self.friend_requests.read().unwrap();
        if requests.contains_key(&request_id) {
            return Err("Friend request already exists".to_string());
        }
        drop(requests);

        let request = FriendRequest {
            id: request_id.clone(),
            sender_id: sender_id.to_string(),
            receiver_id: receiver_id.to_string(),
            status: FriendRequestStatus::Pending,
            timestamp,
        };

        let mut requests = self.friend_requests.write().unwrap();
        requests.insert(request_id, request.clone());

        Ok(request)
    }

    /// Get pending friend requests for a user
    pub async fn get_friend_requests(&self, user_id: &str) -> Vec<FriendRequest> {
        let requests = self.friend_requests.read().unwrap();
        requests
            .values()
            .filter(|req| req.receiver_id == user_id && req.status == FriendRequestStatus::Pending)
            .cloned()
            .collect()
    }

    /// Accept friend request
    pub async fn accept_friend_request(&self, request_id: &str) -> Result<FriendRequest, String> {
        let mut requests = self.friend_requests.write().unwrap();

        if let Some(request) = requests.get_mut(request_id) {
            request.status = FriendRequestStatus::Accepted;
            Ok(request.clone())
        } else {
            Err("Friend request not found".to_string())
        }
    }

    /// Decline friend request
    pub async fn decline_friend_request(&self, request_id: &str) -> Result<(), String> {
        let mut requests = self.friend_requests.write().unwrap();
        requests.remove(request_id);
        Ok(())
    }

    /// Get friend request by ID
    pub async fn get_friend_request(&self, request_id: &str) -> Option<FriendRequest> {
        let requests = self.friend_requests.read().unwrap();
        requests.get(request_id).cloned()
    }
}
