---
phase: 04-guild-bank
plan: 03
subsystem: guild-bank
tags: [websocket, game-server, handlers, rpc]
dependency-graph:
  requires: ["04-01", "04-02"]
  provides: ["guild-bank-server-api"]
  affects: ["04-04"]
tech-stack:
  added: []
  patterns:
    - fire-and-forget-async-handlers
    - rpc-wrapper-functions
    - broadcastToGuild-for-state-changes
key-files:
  created: []
  modified:
    - apps/game-server/src/db.ts
    - apps/game-server/src/types.ts
    - apps/game-server/src/hub.ts
decisions: []
metrics:
  duration: 5m
  completed: 2026-01-19
---

# Phase 4 Plan 3: Game Server Handlers Summary

**One-liner:** 18 database RPC wrappers and 17 WebSocket handlers for complete guild bank server API

## What Was Built

### Database Functions (db.ts)

Added 18 new database functions wrapping Supabase RPC calls:

**Bank State Functions (2):**
- `getGuildBank()` - Fetches full bank state including currency, items, pokemon, slots, permissions, limits
- `getBankDailyLimits()` - Returns player's remaining daily withdrawal limits

**Currency Operations (2):**
- `depositCurrencyToBank()` - Deposits player currency to guild bank
- `withdrawCurrencyFromBank()` - Withdraws currency with limit tracking

**Item Operations (2):**
- `depositItemToBank()` - Deposits items from player inventory
- `withdrawItemFromBank()` - Withdraws items with limit tracking

**Pokemon Operations (3):**
- `depositPokemonToBank()` - Deposits Pokemon with slot assignment
- `withdrawPokemonFromBank()` - Withdraws with point limit tracking
- `expandBankPokemonSlots()` - Leader purchases additional slots

**Request Operations (4):**
- `createBankRequest()` - Creates withdrawal request for members without direct access
- `fulfillBankRequest()` - Officer/leader fulfills pending request
- `cancelBankRequest()` - Player cancels own pending request
- `getBankRequests()` - Lists pending requests (with optional expired filter)

**Log Operations (1):**
- `getBankLogs()` - Paginated log retrieval with filters (player, action, category)

**Permission Configuration (4):**
- `setBankPermission()` - Sets deposit/withdraw permissions per role/category
- `setBankLimit()` - Sets daily limits per role/category
- `setPlayerBankOverride()` - Sets player-specific limit override
- `removePlayerBankOverride()` - Removes player-specific override

### Type Re-exports (types.ts)

Added 46 type re-exports from @pokemon-idle/shared:
- 3 type aliases: BankCategory, BankAction, BankRequestStatus
- 13 data model interfaces
- 17 client->server payload types
- 13 server->client payload types

### WebSocket Handlers (hub.ts)

Added 17 message type handlers following fire-and-forget async pattern:

| Message Type | Handler | Broadcasts |
|--------------|---------|------------|
| get_guild_bank | handleGetGuildBank | guild_bank_data |
| deposit_currency | handleDepositCurrency | guild_bank_currency_updated |
| withdraw_currency | handleWithdrawCurrency | guild_bank_currency_updated + guild_bank_my_limits |
| deposit_item | handleDepositItem | guild_bank_item_updated |
| withdraw_item | handleWithdrawItem | guild_bank_item_updated + guild_bank_my_limits |
| deposit_pokemon | handleDepositPokemon | guild_bank_pokemon_added |
| withdraw_pokemon | handleWithdrawPokemon | guild_bank_pokemon_removed + guild_bank_my_limits |
| expand_pokemon_slots | handleExpandPokemonSlots | guild_bank_slots_expanded |
| create_bank_request | handleCreateBankRequest | guild_bank_request_created |
| fulfill_bank_request | handleFulfillBankRequest | guild_bank_request_fulfilled |
| cancel_bank_request | handleCancelBankRequest | guild_bank_success |
| get_bank_requests | handleGetBankRequests | guild_bank_requests |
| get_bank_logs | handleGetBankLogs | guild_bank_logs |
| set_bank_permission | handleSetBankPermission | guild_bank_success |
| set_bank_limit | handleSetBankLimit | guild_bank_success |
| set_player_override | handleSetPlayerOverride | guild_bank_success |
| remove_player_override | handleRemovePlayerOverride | guild_bank_success |

## Key Implementation Details

**Handler Pattern:**
- All handlers check `client.session?.guild` for guild membership
- Error responses use `guild_bank_error` message type
- State changes broadcast to all guild members via `broadcastToGuild()`
- Withdrawal operations send `guild_bank_my_limits` to requester with remaining limits
- Fire-and-forget pattern (no await in switch cases)

**RPC Wrapper Pattern:**
- All database functions call Supabase RPC with `p_` prefixed parameters
- Error handling returns `{ success: false, error: 'Database error' }` on RPC failure
- Success cases return database function response directly

## Commits

| Hash | Message |
|------|---------|
| 05b84de | feat(04-03): add database functions for guild bank operations |
| 8a0f33a | feat(04-03): add type re-exports for guild bank payloads |
| d406503 | feat(04-03): add WebSocket handlers for guild bank operations |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] `npm run build` passes in apps/game-server
- [x] All 18 db functions exist with proper RPC calls
- [x] All 17 handlers exist with guild membership checks
- [x] All type re-exports present in types.ts
- [x] broadcastToGuild used for all state-changing operations

## Files Changed

| File | Changes |
|------|---------|
| apps/game-server/src/db.ts | +534 lines (18 functions + type imports) |
| apps/game-server/src/types.ts | +50 lines (46 type re-exports) |
| apps/game-server/src/hub.ts | +573 lines (17 handlers + 17 switch cases + imports) |

## Next Phase Readiness

**Ready for 04-04 (Frontend UI):**
- All bank operations available via WebSocket
- Real-time updates broadcast to guild members
- Type-safe payloads for frontend integration
- Error handling consistent with existing patterns

**No blockers identified.**
