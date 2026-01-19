# Codebase Concerns

**Analysis Date:** 2026-01-19

## Tech Debt

**Massive hub.ts file (4534 lines):**
- Issue: Single file handles all WebSocket message types, game logic orchestration, and client management
- Files: `apps/game-server/src/hub.ts`
- Impact: Difficult to maintain, test, and understand. High cognitive load for modifications.
- Fix approach: Extract message handlers into separate modules by domain (trade, guild, chat, combat). Create a message router pattern.

**Large db.ts file (3599 lines):**
- Issue: All database queries in a single file without organization
- Files: `apps/game-server/src/db.ts`
- Impact: Hard to find relevant queries, no separation of concerns
- Fix approach: Split into domain-specific modules: `db/players.ts`, `db/guilds.ts`, `db/trades.ts`, etc.

**Debug code left in production:**
- Issue: Debug level-up handler exists for testing evolutions
- Files: `apps/game-server/src/hub.ts:2744-2805`
- Impact: Potential security risk if exposed; code clutter
- Fix approach: Remove `handleDebugLevelUp` handler or gate behind environment check

**Type casting workarounds:**
- Issue: Multiple `as unknown as` type assertions to work around TypeScript
- Files:
  - `apps/game-server/src/db.ts:168,838-843,2679`
  - `apps/game-server/src/hub.ts:4478`
- Impact: Loss of type safety, potential runtime errors
- Fix approach: Define proper types for Supabase response shapes; use type guards

**eslint-disable comments:**
- Issue: Multiple explicit `@typescript-eslint/no-explicit-any` disables
- Files: `apps/game-server/src/db.ts:1783,1799,1866`
- Impact: Type safety holes in critical trade/Pokemon data handling
- Fix approach: Define proper TypeScript interfaces for the underlying data

## Known Bugs

**No known bugs documented in code**
- The codebase has TODO comments for features not yet implemented but no FIXME/BUG markers
- Files: `apps/web/src/components/game/GameShell.tsx:72,78`
- Workaround: Mock data is hardcoded for news ticker and buff system

## Security Considerations

**Limited rate limiting:**
- Risk: Only whispers have rate limiting (10 per 30 seconds)
- Files: `apps/game-server/src/hub.ts:188-191,2860-2872`
- Current mitigation: Whisper rate limiting exists
- Recommendations: Add rate limiting to chat messages, trade requests, friend requests, and zone movement

**No input sanitization for chat:**
- Risk: Chat messages not sanitized server-side beyond length truncation
- Files: `apps/game-server/src/hub.ts:820-826`
- Current mitigation: React auto-escapes in render; messages truncated to MAX_CHAT_LENGTH
- Recommendations: Add profanity filter; validate message content server-side

**Service key in game server:**
- Risk: Game server uses SUPABASE_SERVICE_KEY (bypasses RLS)
- Files: `apps/game-server/src/db.ts:7-16`
- Current mitigation: Server validates JWT tokens for all connections
- Recommendations: Consider using Supabase client with user context where possible

**.env files in repository:**
- Risk: Environment files exist but are gitignored
- Files: `apps/game-server/.env`, `apps/web/.env.local`
- Current mitigation: `.gitignore` includes all `.env` patterns
- Recommendations: Verify no secrets committed; add `.env.example` for all required vars

## Performance Bottlenecks

**Tick loop processes all clients sequentially:**
- Problem: Every second, iterates all connected clients and processes encounters
- Files: `apps/game-server/src/hub.ts:241` (tick interval)
- Cause: Single-threaded Node.js; sequential async/await for each client
- Improvement path: Batch database updates; consider worker threads for heavy processing

**No database query caching (except guild buffs):**
- Problem: Most database queries hit Supabase on every request
- Files: `apps/game-server/src/db.ts` (all query functions)
- Cause: No caching layer between server and database
- Improvement path: Add Redis or in-memory cache for frequently accessed data (species, zones, encounter tables)

**Guild buff cache is only mechanism:**
- Problem: Only guild buffs have TTL caching (5 seconds)
- Files: `apps/game-server/src/hub.ts:219-336`
- Cause: Quick implementation; most data is session-scoped
- Improvement path: Cache species data, zone data, encounter tables (these rarely change)

**Heavy RPC usage for guild operations:**
- Problem: 40+ Supabase RPC calls for guild-related operations
- Files: `apps/game-server/src/db.ts:2381-3588`
- Cause: Business logic pushed to PostgreSQL functions
- Improvement path: Consider moving some logic server-side if latency becomes issue

## Fragile Areas

**Evolution system:**
- Files: `apps/game-server/src/hub.ts:2605-2810`, `apps/game-server/src/game.ts:750-826`
- Why fragile: Complex state coordination between client pending evolutions, server session state, and database. Multiple race condition guards needed.
- Safe modification: Always update database BEFORE in-memory state; maintain pending evolution deduplication
- Test coverage: No automated tests

**Trade completion flow:**
- Files: `apps/game-server/src/hub.ts:2182-2476`, `apps/game-server/src/db.ts:1600-1770`
- Why fragile: Complex atomic operation with trade ready states, Pokemon ownership transfer, party slot management
- Safe modification: Uses `tradesBeingCompleted` Set to prevent double-completion; critical section handling
- Test coverage: No automated tests

**WebSocket reconnection:**
- Files: `apps/web/src/lib/ws/gameSocket.ts:280-300`
- Why fragile: Client must resync all state on reconnection; potential for stale data
- Safe modification: Ensure all state requests are made on reconnect (get_state, get_friends, etc.)
- Test coverage: No automated tests

**Zustand store state management:**
- Files: `apps/web/src/stores/gameStore.ts` (1292 lines)
- Why fragile: Single store manages all game state; complex update functions with deduplication logic
- Safe modification: Use immer or split into multiple stores; maintain existing deduplication patterns for evolutions/level-ups
- Test coverage: No automated tests

## Scaling Limits

**In-memory Maps grow with connections:**
- Current capacity: Multiple Map/Set structures per connection
- Limit: Memory bounded by server RAM; no connection limits set
- Scaling path: Add max connection limits; implement connection pooling; consider moving state to Redis

**Single game server instance:**
- Current capacity: One WebSocket server handles all connections
- Limit: Node.js single-thread; vertical scaling only
- Scaling path: Add horizontal scaling with Redis pub/sub for cross-instance communication

**Supabase connection pooling:**
- Current capacity: Default Supabase connection limits
- Limit: Transaction mode connections limited by plan
- Scaling path: Use connection pooler in transaction mode; batch queries where possible

## Dependencies at Risk

**No critical dependencies at risk identified:**
- Core dependencies (ws, jose, @supabase/supabase-js) are stable and maintained
- Framework versions are current (Next.js 16, React 19)

## Missing Critical Features

**No automated testing:**
- Problem: Zero test files in application code (only in node_modules)
- Blocks: Safe refactoring; regression prevention; CI/CD quality gates
- Files: No `*.test.ts` or `*.spec.ts` files in `apps/` directories

**No structured logging:**
- Problem: All logging is console.log/console.error
- Blocks: Production debugging; log aggregation; alerting
- Files: Throughout `apps/game-server/src/*.ts`

**No health checks:**
- Problem: No endpoint for load balancer health checks
- Blocks: Proper orchestration deployment; auto-recovery
- Files: `apps/game-server/src/index.ts` (no health endpoint)

**No graceful shutdown:**
- Problem: Server shutdown just closes WebSocket server
- Blocks: Zero-downtime deployments; proper connection draining
- Files: `apps/game-server/src/index.ts:24-29`

## Test Coverage Gaps

**Complete absence of tests:**
- What's not tested: Everything - no unit, integration, or E2E tests
- Files: Entire `apps/` directory
- Risk: Any change could break existing functionality unnoticed
- Priority: High - critical for maintaining code quality

**Priority areas needing tests:**
1. `apps/game-server/src/game.ts` - Battle logic, catch calculations, evolution checks
2. `apps/game-server/src/db.ts` - Database query functions (mock Supabase client)
3. `apps/web/src/stores/gameStore.ts` - State management logic
4. Trade completion flow - Atomic operations and error handling

---

*Concerns audit: 2026-01-19*
