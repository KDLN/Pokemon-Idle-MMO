---
status: testing
phase: 02-guild-invites
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md]
started: 2026-01-18T19:10:00Z
updated: 2026-01-18T19:10:00Z
---

## Current Test

number: 2
name: Leader/Officer Can Send Invite
expected: |
  1. Open the game with a guild leader or officer account
  2. Go to Social tab and find a player who is NOT in a guild
  3. Click "Invite to Guild" button on their player card
  4. Button should show "Invite Sent" confirmation
awaiting: user response

## Tests

### 1. Database Migration Applied
expected: Run migration 023_guild_invites.sql in Supabase. Verify guild_invites table and functions exist.
result: pass

### 2. Leader/Officer Can Send Invite
expected: Guild leader or officer clicks "Invite to Guild" on a player not in a guild. Button shows "Invite Sent" confirmation.
result: [pending]

### 3. Target Player Receives Invite Notification
expected: Invited player (not in guild) sees the invite appear in their guild panel under "Guild Invites" section with guild name, tag, member count, and inviter name.
result: [pending]

### 4. Accept Invite Joins Guild
expected: Player clicks "Accept" on an invite. They join the guild as Member, see full guild data with member roster.
result: [pending]

### 5. Decline Invite Removes It
expected: Player clicks "Decline" on an invite. The invite disappears from their pending list.
result: [pending]

### 6. Invite Shows Time Remaining
expected: Pending invite displays time remaining until expiration (e.g., "6d 23h left").
result: [pending]

### 7. Block Integration Works
expected: If guild officer tries to invite a player who has blocked them (or vice versa), invite fails with "Cannot send invite to this player".
result: [pending]

## Summary

total: 7
passed: 1
issues: 0
pending: 6
skipped: 0

## Gaps

[none yet]
