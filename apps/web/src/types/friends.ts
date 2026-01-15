// Friend system types for frontend

export type FriendStatus = 'pending' | 'accepted' | 'blocked'

export interface Friend {
  friend_id: string
  player_id: string
  friend_player_id: string
  status: FriendStatus
  created_at: string
  // Joined data for display
  friend_username?: string
  friend_last_online?: string
  // Zone visibility (Issue #14)
  zone_id?: number
  zone_name?: string
}

export interface FriendRequest {
  friend_id: string
  from_player_id: string
  from_username: string
  created_at: string
}

export interface OutgoingFriendRequest {
  friend_id: string
  to_player_id: string
  to_username: string
  created_at: string
}

export interface FriendsData {
  friends: Friend[]
  incoming: FriendRequest[]
  outgoing: OutgoingFriendRequest[]
}
