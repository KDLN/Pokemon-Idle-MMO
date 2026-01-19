# Phase 6: Guild Shop & Statistics - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Guilds spend accumulated resources (guild points and currency) on temporary group buffs that benefit all members. Guild statistics display aggregate metrics for the guild. Leaderboards rank guilds and allow players to compare.

</domain>

<decisions>
## Implementation Decisions

### Buff System Design
- All three buff types (XP, catch rate, encounter rate) can be active simultaneously
- Purchasing a buff while it's active adds time to remaining duration
- Maximum stacked duration capped at 24 hours per buff type
- Buffs end immediately when a member leaves or is kicked from guild
- Buff purchases send notification to guild chat + logged in purchase history
- Both payment methods accepted: guild points (cheaper) or currency (more expensive)

### Buff Visibility
- Active buffs shown in both places:
  - Icons in game UI (Power Ups section) with countdown timers
  - Details in guild panel showing remaining time

### Shop Interface
- Dedicated modal accessed from Guild Panel button
- Balance displayed at top of modal + inline affordability indicators per item
- Members can view shop but purchase button disabled (Leader/Officer only can buy)
- Active buffs section shown in shop modal (Claude's discretion on placement)
- Purchase history tab within shop modal
- Confirmation dialog before each purchase

### Statistics Presentation
- Grouped sections layout (Activity, Resources, Members)
- Current values only, no trends or historical comparison
- Required metrics: total catches, Pokedex count, member count, average level, guild age
- Additional stats: active players (24h), bank totals, quest completion rate
- Claude's discretion on what other useful stats to add

### Leaderboard UX
- Accessible from both guild discovery page and inside guild panel
- Default ranking by member count
- Detailed row display: rank, tag, name, score, member count, leader name
- Top 50 guilds shown

### Claude's Discretion
- Shop layout style (cards vs list)
- Shop color scheme
- How to display active buffs within shop modal
- Location of statistics display (section vs tab vs modal)
- How players find their own guild on leaderboard
- Exact buff pricing (guild points vs currency ratio)
- Scaling buff costs with guild size

</decisions>

<specifics>
## Specific Ideas

- Use the existing "Power Ups" section in game UI for buff icons
- Currency should cost "way more" than guild points for same buff
- Follows established modal patterns from Bank and Quests modals

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-guild-shop-statistics*
*Context gathered: 2026-01-18*
