---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\web\src\components\game\guild\GuildPanel.tsx
type: component
updated: 2026-01-20
status: active
---

# GuildPanel.tsx

## Purpose

Main guild UI component that displays either guild discovery (when not in a guild) or guild management (when a member). Handles guild creation, joining, leaving, disbanding, and provides access to bank, quests, shop, and leaderboard modals.

## Exports

- `GuildPanel` - Guild management and discovery component

## Dependencies

- [[apps-web-src-stores-gamestore]] - Guild state (guild, myGuildRole, guildError)
- [[apps-web-src-lib-ws-gamesocket]] - Guild API methods (searchGuilds, leaveGuild, disbandGuild)
- CreateGuildModal - Guild creation form
- GuildList - Guild discovery list with join buttons
- GuildMembers - Member list with role management
- GuildInviteList - Pending invites display
- GuildBankModal, GuildQuestsModal, GuildShopModal, GuildLeaderboardModal - Feature modals
- ActiveBuffsDisplay, GuildStatisticsSection - Guild status displays

## Used By

TBD

## Notes

- Guild disband requires typing guild name for confirmation
- Shows different UI based on membership status
- Auto-loads guild list on mount if not in a guild
- Errors auto-clear after 5 seconds
