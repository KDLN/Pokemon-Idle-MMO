// Social system types (chat, friends, whispers, blocks)

// Chat system
export type ChatChannel = 'global' | 'trade' | 'guild' | 'system' | 'whisper'

export interface ChatMessageEntry {
  id: string
  player_id: string
  player_name: string
  channel: ChatChannel
  content: string
  created_at: string
}

// Friend system
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
  // Zone visibility
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

// Whisper system
export interface WhisperMessage {
  id: string
  from_player_id: string
  from_username: string
  to_player_id: string
  to_username: string
  content: string
  created_at: string
}

// Block system
export interface BlockedPlayer {
  id: string
  blocked_id: string
  blocked_username: string
  created_at: string
}
