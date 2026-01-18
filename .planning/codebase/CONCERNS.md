# Codebase Concerns

**Analysis Date:** 2026-01-18

## Tech Debt

**Large File Complexity:**
- Issue: Several core files exceed 1000+ lines, making them difficult to maintain and test
- Files:
  - `apps/game-server/src/hub.ts` (2696 lines) - WebSocket hub handles too many responsibilities
  - `apps/game-server/src/db.ts` (2296 lines) - All database queries in single file
  - `apps/web/src/components/game/world/AnimatedTrainerSpriteLegacy.tsx` (1566 lines) - Deprecated but still present
  - `apps/game-server/src/game.ts` (1231 lines) - Game logic, battle system, evolutions all mixed
  - `apps/web/src/lib/ws/gameSocket.ts` (1105 lines) - WebSocket client with all message handlers
- Impact: Hard to understand, test, and modify individual features
- Fix approach: Extract into smaller, focused modules (e.g., separate trade handlers, friend handlers, battle logic)

**Legacy Code Not Removed:**
- Issue: `AnimatedTrainerSpriteLegacy.tsx` is marked deprecated but still in codebase
- Files: `apps/web/src/components/game/world/AnimatedTrainerSpriteLegacy.tsx`
- Impact: Maintenance burden, confusion about which component to use
- Fix approach: Remove after confirming `SpriteTrainer.tsx` fully replaces it

**Placeholder Data in Components:**
- Issue: Mock data and TODOs for features not yet implemented
- Files:
  - `apps/web/src/components/game/GameShell.tsx:70-76` - Placeholder news/events and buffs data
- Impact: UI shows data that doesn't come from backend; misleading for users
- Fix approach: Either implement backend support or remove placeholder UI

**Debug Code in Production:**
- Issue: Debug commands and console logging present in production code
- Files:
  - `apps/game-server/src/hub.ts:374-380` - Debug levelup command (gated by NODE_ENV but still in binary)
  - `apps/game-server/src/hub.ts:2347-2407` - handleDebugLevelUp method
  - `apps/web/src/lib/ws/gameSocket.ts:131` - Logs all incoming WebSocket messages
  - `apps/game-server/src/db.ts:1166-1173` - Debug logging for friends queries
- Impact: 108 console.log/error/warn calls in game-server alone; potential performance impact and log noise
- Fix approach: Add proper logging framework with log levels; remove debug-only code paths

**Type Safety Gaps:**
- Issue: Use of `any`, `unknown` casts, and eslint-disable comments
- Files:
  - `apps/game-server/src/db.ts:1719, 1735, 1802` - eslint-disable for any types
  - 96 occurrences of `any`/`unknown` across apps directory
- Impact: Reduced type safety, potential runtime errors
- Fix approach: Add proper type definitions for Supabase query results

## Known Bugs

**No Critical Bugs Identified**

The codebase shows careful handling of race conditions and edge cases. Notable safeguards include:
- Optimistic locking in `db.ts` for inventory operations
- Trade completion double-check with `tradesBeingCompleted` Set
- Evolution chain validation before processing

## Security Considerations

**WebSocket Message Type Validation:**
- Risk: Message payloads are cast directly to expected types without runtime validation
- Files:
  - `apps/game-server/src/hub.ts:345-476` - handleMessage switches on type, casts payloads
- Current mitigation: JWT validation on connection, ownership checks on operations
- Recommendations: Add schema validation (e.g., Zod) for all incoming payloads

**Rate Limiting Coverage:**
- Risk: Rate limiting only implemented for whispers, not for other operations
- Files:
  - `apps/game-server/src/hub.ts:98-101` - Only WHISPER_RATE_LIMIT defined
- Current mitigation: Presence updates every 60 seconds, encounter cooldown
- Recommendations: Add rate limiting for shop purchases, trade requests, friend requests

**Service Key in Game Server:**
- Risk: Game server uses SUPABASE_SERVICE_KEY which bypasses RLS
- Files:
  - `apps/game-server/src/db.ts:9` - Uses service key
- Current mitigation: All queries include explicit player ID checks
- Recommendations: Document which operations bypass RLS; consider using RLS-enabled client where possible

**Debug Endpoint in Production:**
- Risk: Debug levelup command exists in code (gated by NODE_ENV)
- Files:
  - `apps/game-server/src/hub.ts:374-380`
- Current mitigation: Check for NODE_ENV === 'development'
- Recommendations: Remove entirely or move to separate debug server

## Performance Bottlenecks

**Database Queries Per Tick:**
- Problem: Each client tick can trigger multiple DB writes
- Files:
  - `apps/game-server/src/hub.ts:996-1136` - processTicks method
- Cause: Saving pokeballs, pokedex, HP, XP, money after every encounter
- Improvement path: Batch updates, write-behind caching, or periodic flush

**Friends List Query Pattern:**
- Problem: Two separate queries to find friends (sent and received)
- Files:
  - `apps/game-server/src/db.ts:1134-1161` - getFriendsList uses parallel queries
- Cause: Avoiding SQL injection from string interpolation in .or() clause (good security practice)
- Improvement path: Create database view or function to unify query

**Zone Change Broadcasts:**
- Problem: Zone change triggers multiple broadcast operations
- Files:
  - `apps/game-server/src/hub.ts:598-707` - handleMoveZone, notifyFriendsOfZoneChange
- Cause: Iterates through all clients to find affected players
- Improvement path: Maintain zone->clients index for O(1) lookup

**Tick Processing is Sequential:**
- Problem: processTicks iterates through all clients one by one
- Files:
  - `apps/game-server/src/hub.ts:996-1136`
- Cause: Serial processing with await for each DB operation
- Improvement path: Batch processing, parallel client processing with Promise.all

## Fragile Areas

**Evolution System:**
- Files:
  - `apps/game-server/src/hub.ts:2185-2330` - handleConfirmEvolution
  - `apps/game-server/src/game.ts:667-820` - evolution logic
  - `apps/web/src/stores/gameStore.ts:533-593` - evolution state management
- Why fragile: Complex state synchronization between server pending evolutions, client pending evolutions, and active evolution modal
- Safe modification: Extensive logging already in place (console.log in evolution methods); test multi-level-up scenarios
- Test coverage: None detected

**Trade System:**
- Files:
  - `apps/game-server/src/hub.ts:1400-2100` - trade handlers (approx)
  - `apps/game-server/src/db.ts:1287-1753` - trade database operations
  - `apps/web/src/components/game/social/TradeModal.tsx`
- Why fragile: Multiple concurrent operations possible (both players adding/removing offers, ready states)
- Safe modification: Use tradesBeingCompleted Set pattern; test concurrent offer modifications
- Test coverage: None detected

**Party/Box Management:**
- Files:
  - `apps/game-server/src/db.ts:413-447` - swapPartyMember, removeFromParty
  - `apps/game-server/src/hub.ts:709-771` - handleSwapParty, handleRemoveFromParty
- Why fragile: Must maintain party_slot integrity (1-6), at least one Pokemon in party
- Safe modification: Always validate slot numbers server-side
- Test coverage: None detected

## Scaling Limits

**In-Memory State:**
- Current capacity: All active sessions stored in Map structures
- Limit: Single server memory, no horizontal scaling
- Scaling path: Add Redis for session state, enable multiple game-server instances

**WebSocket Connections:**
- Current capacity: Single WebSocket server handles all connections
- Limit: OS connection limits, single process
- Scaling path: WebSocket clustering with sticky sessions or pub/sub (Redis)

**Tick Loop:**
- Current capacity: 1-second tick for all connected clients
- Limit: Processing time grows linearly with player count
- Scaling path: Shard players by zone, batch database operations

## Dependencies at Risk

**No Critical Dependency Risks Identified**

Current dependencies are mainstream and well-maintained:
- `ws` for WebSocket (standard choice)
- `jose` for JWT validation
- Supabase client libraries
- Next.js and React

## Missing Critical Features

**No Tests:**
- Problem: Zero test files found in application code
- Blocks: Confident refactoring, regression prevention
- Files checked: `**/*.test.{ts,tsx}`, `**/*.spec.{ts,tsx}` in non-node_modules

**No Input Validation Schema:**
- Problem: Payload types are asserted, not validated at runtime
- Blocks: Protection against malformed messages
- Files: All `handleX` methods in `apps/game-server/src/hub.ts`

**No Error Monitoring:**
- Problem: Errors logged to console only
- Blocks: Production issue detection, debugging
- Recommendation: Add error tracking service (Sentry, etc.)

## Test Coverage Gaps

**Game Server - 0% Coverage:**
- What's not tested: All game logic, battle system, database operations
- Files:
  - `apps/game-server/src/game.ts` - Battle calculations, XP formulas
  - `apps/game-server/src/db.ts` - All database queries
  - `apps/game-server/src/hub.ts` - WebSocket message handling
- Risk: Changes to battle formulas or database queries could break game balance
- Priority: High - Core gameplay affected

**Frontend Components - 0% Coverage:**
- What's not tested: UI components, state management, WebSocket client
- Files:
  - `apps/web/src/stores/gameStore.ts` - Complex state mutations
  - `apps/web/src/lib/ws/gameSocket.ts` - Message handlers
- Risk: UI bugs, state desync between server and client
- Priority: Medium - Affects user experience

**Evolution/Level-Up System:**
- What's not tested: Multi-level-up edge cases, evolution chains
- Files:
  - `apps/game-server/src/game.ts:631-820`
- Risk: Players could lose Pokemon or get wrong evolutions
- Priority: High - Data integrity affected

---

*Concerns audit: 2026-01-18*
