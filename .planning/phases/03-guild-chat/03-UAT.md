# Phase 3: Guild Chat - User Acceptance Testing

**Date:** 2026-01-18
**Tester:** User Verification Session

## Overview

Phase 3 implements private guild chat with role badges and real-time messaging. A critical bug was found and fixed during implementation: messages were being broadcast to ALL players instead of only guild members.

---

## Test Scenarios

### TC-01: Guild Chat Privacy (CRITICAL)

**Objective:** Verify guild chat messages are ONLY visible to guild members

**Steps:**
1. Have Player A in "TestGuild"
2. Have Player B NOT in any guild (or in a different guild)
3. Player A sends message in guild chat
4. Check if Player B receives the message

**Expected:** Player B should NOT see the message
**Pass Criteria:** Message only appears for TestGuild members

- [ ] PASS / FAIL

**Notes:**
_Prior to fix, this was FAILING - messages broadcast to ALL players_

---

### TC-02: Guild Tab Visibility

**Objective:** Verify guild tab only appears for guild members

**Steps:**
1. Player not in any guild opens chat sidebar
2. Check if "Guild" tab is visible

**Expected:** Guild tab should NOT appear
**Pass Criteria:** Tab list shows: Global, Trade, System, Whisper (no Guild)

- [ ] PASS / FAIL

---

### TC-03: Guild Tab Appears After Joining

**Objective:** Verify guild tab appears when player joins a guild

**Steps:**
1. Player joins a guild
2. Check chat tabs immediately after

**Expected:** Guild tab now appears in the tab list
**Pass Criteria:** Tab list shows: Global, Trade, Guild, System, Whisper

- [ ] PASS / FAIL

---

### TC-04: Role Badge Display - Leader

**Objective:** Verify Leader role badge displays correctly

**Steps:**
1. Guild Leader sends message in guild chat
2. Check message display

**Expected:** Yellow "L" badge before player name
**Pass Criteria:** Badge appears with yellow background (#EAB308)

- [ ] PASS / FAIL

---

### TC-05: Role Badge Display - Officer

**Objective:** Verify Officer role badge displays correctly

**Steps:**
1. Guild Officer sends message in guild chat
2. Check message display

**Expected:** Blue "O" badge before player name
**Pass Criteria:** Badge appears with blue background (#3B82F6)

- [ ] PASS / FAIL

---

### TC-06: Role Badge Display - Member

**Objective:** Verify Member role badge displays correctly

**Steps:**
1. Regular guild Member sends message in guild chat
2. Check message display

**Expected:** Gray "M" badge before player name
**Pass Criteria:** Badge appears with gray background

- [ ] PASS / FAIL

---

### TC-07: Real-time Message Delivery

**Objective:** Verify messages appear instantly for online guild members

**Steps:**
1. Two guild members online (Player A, Player B)
2. Player A sends guild message
3. Check Player B's chat

**Expected:** Message appears immediately without refresh
**Pass Criteria:** Sub-second delivery, no page reload needed

- [ ] PASS / FAIL

---

### TC-08: Message History Loading

**Objective:** Verify chat history loads when joining/switching to guild channel

**Steps:**
1. Player joins guild with existing messages
2. Switch to guild chat tab
3. Check if historical messages appear

**Expected:** Up to 100 previous messages load
**Pass Criteria:** Messages appear in chronological order (oldest first)

- [ ] PASS / FAIL

---

### TC-09: Message Persistence

**Objective:** Verify messages persist in database

**Steps:**
1. Send message in guild chat
2. Close browser / log out
3. Log back in and open guild chat

**Expected:** Previous messages still visible
**Pass Criteria:** Messages survive session restart

- [ ] PASS / FAIL

---

### TC-10: Message Character Limit

**Objective:** Verify 500 character limit is enforced

**Steps:**
1. Attempt to send message longer than 500 characters
2. Check if message is truncated or blocked

**Expected:** Message limited to 500 characters (matches database schema)
**Pass Criteria:** Long messages handled gracefully

- [ ] PASS / FAIL

---

### TC-11: Chat Cleared on Guild Leave

**Objective:** Verify guild chat is cleared when player leaves guild

**Steps:**
1. Player views guild chat messages
2. Player leaves guild
3. Check chat state

**Expected:** Guild messages cleared, guild tab disappears
**Pass Criteria:** No stale guild messages visible

- [ ] PASS / FAIL

---

### TC-12: Timestamp Display

**Objective:** Verify message timestamps are displayed

**Steps:**
1. Send message in guild chat
2. Check message display

**Expected:** Timestamp appears (e.g., "2:30 PM")
**Pass Criteria:** Time shown in consistent format

- [ ] PASS / FAIL

---

## Summary

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC-01 | Guild Chat Privacy | ⬜ |
| TC-02 | Guild Tab Visibility | ⬜ |
| TC-03 | Guild Tab After Join | ⬜ |
| TC-04 | Leader Badge | ⬜ |
| TC-05 | Officer Badge | ⬜ |
| TC-06 | Member Badge | ⬜ |
| TC-07 | Real-time Delivery | ⬜ |
| TC-08 | History Loading | ⬜ |
| TC-09 | Message Persistence | ⬜ |
| TC-10 | Character Limit | ⬜ |
| TC-11 | Chat Clear on Leave | ⬜ |
| TC-12 | Timestamp Display | ⬜ |

**Pass:** _/12
**Fail:** _/12

---

## Implementation Notes

### Critical Fix Applied
The original implementation used `broadcast()` which sent guild messages to ALL connected clients. This was fixed to use `broadcastToGuild()` which correctly targets only guild members.

### Files Modified
- `supabase/migrations/025_guild_messages.sql` - Guild messages table with RLS
- `packages/shared/src/types/guild.ts` - GuildMessageEntry, GuildChatHistoryPayload types
- `apps/game-server/src/db.ts` - getGuildChatHistory, saveGuildMessage functions
- `apps/game-server/src/hub.ts` - handleGuildChatMessage (uses broadcastToGuild)
- `apps/web/src/lib/ws/gameSocket.ts` - guild chat handlers
- `apps/web/src/stores/gameStore.ts` - setGuildChatHistory action
- `apps/web/src/types/chat.ts` - playerRole field added
- `apps/web/src/components/game/social/ChatMessage.tsx` - Role badges
- `apps/web/src/components/game/social/ChatTabs.tsx` - Conditional guild tab

### RLS Policy Fix
Migration required casting enum to text: `guild_members.role::text = guild_messages.player_role`

---

*Created: 2026-01-18*
