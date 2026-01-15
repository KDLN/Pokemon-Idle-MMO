import type { Friend } from '@/types/friends'

// Online threshold: 2 minutes in milliseconds
export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000

/**
 * Check if a friend is currently online based on their last_online timestamp.
 * A friend is considered online if their last activity was within the threshold.
 */
export function isFriendOnline(friend: Friend): boolean {
  if (!friend.friend_last_online) return false
  const lastOnline = new Date(friend.friend_last_online)
  const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MS)
  return lastOnline > threshold
}

/**
 * Sort friends list with online friends first, then alphabetically by username.
 */
export function sortFriendsByOnlineStatus(friends: Friend[]): Friend[] {
  return [...friends].sort((a, b) => {
    const aOnline = isFriendOnline(a)
    const bOnline = isFriendOnline(b)
    if (aOnline && !bOnline) return -1
    if (!aOnline && bOnline) return 1
    return (a.friend_username || '').localeCompare(b.friend_username || '')
  })
}

/**
 * Count how many friends are currently online.
 */
export function countOnlineFriends(friends: Friend[]): number {
  return friends.filter(isFriendOnline).length
}
