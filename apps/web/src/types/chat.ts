export type ChatChannel = 'global' | 'trade' | 'guild' | 'system' | 'whisper'

export interface ChatMessageData {
  id: string
  playerId: string
  playerName: string
  channel: ChatChannel
  content: string
  createdAt: Date
  isSystem?: boolean
}

// Whisper message data (Issue #45)
export interface WhisperMessageData {
  id: string
  fromPlayerId: string
  fromUsername: string
  toPlayerId: string
  toUsername: string
  content: string
  createdAt: Date
}

// Blocked player data (Issue #47)
export interface BlockedPlayerData {
  id: string
  blockedId: string
  blockedUsername: string
  createdAt: Date
}
