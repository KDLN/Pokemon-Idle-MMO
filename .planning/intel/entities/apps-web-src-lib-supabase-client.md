---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\web\src\lib\supabase\client.ts
type: util
updated: 2026-01-20
status: active
---

# client.ts (Supabase browser)

## Purpose

Creates and exports a singleton Supabase browser client for client-side authentication and data access. Uses environment variables for URL and anon key configuration.

## Exports

- `createClient(): SupabaseClient` - Returns singleton browser Supabase client

## Dependencies

- @supabase/ssr - Supabase SSR package with browser client factory

## Used By

TBD

## Notes

- Client is cached after first creation to avoid multiple instances
- Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables
