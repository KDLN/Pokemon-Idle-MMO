# Phase 5: Guild Quests - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Shared daily and weekly goals that all guild members contribute to automatically. Completed quests reward the guild bank with currency, items, and guild points. Individual contributor bonuses included.

</domain>

<decisions>
## Implementation Decisions

### Quest Generation
- Daily quest count scales with guild size (e.g., 3 base + 1 per 10 members)
- 2-3 weekly quests per guild (fixed count)
- Difficulty scales with average guild activity (not member count)
- Mixed quest types: catching, battling, evolving, exploring zones
- Some quests are generic (any activity), some are type/zone-specific for variety
- Zone-specific quests generate regardless of member zone access (encourages progression)
- Weekly quests are a mix of scaled dailies and unique objectives (e.g., "catch 10 unique species")

### Reroll System
- Limited rerolls per day: 1-2 daily rerolls (Claude decides exact count)
- Rerolls cost guild currency from guild bank
- Leader and Officers can reroll quests (Members cannot)
- Separate weekly reroll pool: 1 weekly reroll per week
- Incomplete quests disappear at reset (no partial rewards, no carryover)

### Progress Tracking
- Individual member contributions visible as leaderboard (most contribution at top, descending)
- Real-time progress updates via WebSocket
- Milestone notifications at 25%, 50%, 75%, 100% via both guild chat system message AND toast notification
- Time display: countdown timer when < 6 hours remaining, reset time otherwise
- Full paginated history of past quest completions
- Ties in contribution leaderboard: Claude decides (likely first to contribute)

### Reward Distribution
- Rewards include: currency, items, and guild points
- Main rewards deposit to guild bank
- Individual bonus given to contributors (in addition to bank deposit)
- Bonus distribution method: NEEDS RESEARCH on what keeps players engaged
- Harder quests (type-specific, zone-specific) give scaled higher rewards
- Reward amounts shown on quest card before completion
- Weekly reward scaling vs dailies: Claude decides based on economy balance

### Quest UI Presentation
- Dedicated "Guild Quests" modal accessed from guild panel
- Progress bars (horizontal) for each quest
- Daily and weekly quests in separated sections with different card styling/colors
- Contribution leaderboard is expandable section on each quest card
- Completed quests: card fades with strikethrough on title
- Remaining rerolls shown prominently at top of modal
- Quest card layout: Claude decides based on content density

### Celebration
- Confetti animation on quest completion

### Claude's Discretion
- Exact daily reroll count (1 or 2)
- Weekly reward bonus amount vs proportional to dailies
- Quest card layout (vertical list vs grid)
- Reroll button placement (icon on card vs in details)
- Tie-breaking for contribution leaderboard
- Quest history visibility (all members vs officers+)

</decisions>

<specifics>
## Specific Ideas

- Celebration should be confetti particles over the quest area/modal
- Progress milestones should appear in both guild chat (system message) AND toast notification for visibility
- "Scales with activity" means using average daily guild activity to set achievable but challenging targets
- Contribution leaderboard helps foster healthy competition and recognition

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 05-guild-quests*
*Context gathered: 2026-01-18*
