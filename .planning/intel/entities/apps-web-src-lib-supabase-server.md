---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\web\src\lib\supabase\server.ts
type: util
updated: 2026-01-20
status: active
---

# server.ts (Supabase server)

## Purpose

Creates a Supabase server client for use in Next.js Server Components and Server Actions. Integrates with Next.js cookies for session management and authentication state.

## Exports

- `createClient(): Promise<SupabaseClient>` - Creates server-side Supabase client with cookie handling

## Dependencies

- @supabase/ssr - Supabase SSR package with server client factory
- next/headers - Next.js cookies API for session handling

## Used By

TBD

## Notes

- Must be called with await as it accesses cookies() which is async in Next.js 16
- Cookie setAll errors are silently caught to handle Server Component context
- Uses same NEXT_PUBLIC environment variables as browser client
