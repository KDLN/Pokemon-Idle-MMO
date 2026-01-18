// Chat types for frontend
// Re-exports shared types + frontend-only adapters

// Re-export shared chat types
export type { ChatChannel, WhisperMessage, BlockedPlayer } from '@pokemon-idle/shared'

// Frontend-only types with camelCase (adapter layer)
export interface ChatMessageData {
  id: string
  playerId: string
  playerName: string
  channel: import('@pokemon-idle/shared').ChatChannel
  content: string
  createdAt: Date
  isSystem?: boolean
}

// Whisper message data (camelCase adapter)
export interface WhisperMessageData {
  id: string
  fromPlayerId: string
  fromUsername: string
  toPlayerId: string
  toUsername: string
  content: string
  createdAt: Date
}

// Blocked player data (camelCase adapter)
export interface BlockedPlayerData {
  id: string
  blockedId: string
  blockedUsername: string
  createdAt: Date
}
