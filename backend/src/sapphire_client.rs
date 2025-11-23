use anyhow::Result;
use std::collections::HashMap;
use std::sync::RwLock;

/// Sapphire client for managing friendships on-chain
/// This interacts with the FriendManager contract on Sapphire
/// For MVP: Using in-memory storage instead of blockchain
pub struct SapphireClient {
    // In-memory friendships for MVP testing
    friendships: RwLock<HashMap<String, Vec<String>>>,
}

impl SapphireClient {
    pub async fn new() -> Result<Self> {
        Ok(Self {
            friendships: RwLock::new(HashMap::new()),
        })
    }

    /// Get user's friends
    pub async fn get_friends(&self, user_id: &str) -> Result<Vec<String>> {
        let friendships = self.friendships.read().unwrap();
        Ok(friendships
            .get(user_id)
            .cloned()
            .unwrap_or_else(Vec::new))
    }

    /// Add friend (bidirectional)
    pub async fn add_friend(&self, user_id: &str, friend_id: &str) -> Result<()> {
        let mut friendships = self.friendships.write().unwrap();

        // Add friend_id to user's friends
        friendships
            .entry(user_id.to_string())
            .or_insert_with(Vec::new)
            .push(friend_id.to_string());

        // Add user_id to friend's friends (bidirectional)
        friendships
            .entry(friend_id.to_string())
            .or_insert_with(Vec::new)
            .push(user_id.to_string());

        tracing::info!("✅ Added friendship: {} <-> {}", user_id, friend_id);
        Ok(())
    }

    /// Remove friend (bidirectional)
    pub async fn remove_friend(&self, user_id: &str, friend_id: &str) -> Result<()> {
        let mut friendships = self.friendships.write().unwrap();

        // Remove friend_id from user's friends
        if let Some(friends) = friendships.get_mut(user_id) {
            friends.retain(|f| f != friend_id);
        }

        // Remove user_id from friend's friends (bidirectional)
        if let Some(friends) = friendships.get_mut(friend_id) {
            friends.retain(|f| f != user_id);
        }

        tracing::info!("✅ Removed friendship: {} <-> {}", user_id, friend_id);
        Ok(())
    }
}
