export type ChatChannel = 'global' | 'trade' | 'guild' | 'system'

export interface ChatMessageData {
  id: string
  playerId: string
  playerName: string
  channel: ChatChannel
  content: string
  createdAt: Date
  isSystem?: boolean
}
