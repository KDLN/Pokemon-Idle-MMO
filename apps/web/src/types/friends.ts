// Friend system types for frontend
// Re-exports shared types + frontend-only types

// Re-export shared friend types
export type {
  FriendStatus,
  Friend,
  FriendRequest,
  OutgoingFriendRequest,
} from '@pokemon-idle/shared'

// Frontend-only aggregated friends data
export interface FriendsData {
  friends: import('@pokemon-idle/shared').Friend[]
  incoming: import('@pokemon-idle/shared').FriendRequest[]
  outgoing: import('@pokemon-idle/shared').OutgoingFriendRequest[]
}
