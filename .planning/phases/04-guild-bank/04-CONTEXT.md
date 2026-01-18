# Phase 4: Guild Bank - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Guilds have shared storage for currency, items, and Pokemon with role-based access control and full audit logging. Leaders can configure permissions per category and role. Members can request items they cannot withdraw directly.

</domain>

<decisions>
## Implementation Decisions

### Storage Capacity

**Currency:**
- Level-based cap: scales with member count
- Claude decides specific formula (balanced between 50k-100k base + per-member bonus)

**Items:**
- Type-based storage: separate sections by category (Healing, Balls, Evolution, etc.)
- Match player inventory categories
- Items stack to 99 per type
- No slot limits per category — just stack limits

**Pokemon:**
- Base: 25 slots
- Bonus: +2 slots per guild member (50 members = 125 total from members)
- Purchasable expansion with scaling price (gets more expensive as you buy more)
- Hard cap: 500 slots maximum
- All Pokemon allowed (no restrictions on what can be deposited)

### Permissions System (WoW-style)

- Leader configures deposit AND withdrawal permissions per category per role
- Permissions are per-category granular (can set different rules for Potions vs Balls)
- Leader can grant Officers permission to configure bank settings
- Simple on/off per category per role for deposits/withdrawals
- Claude decides best UX for configuration UI

### Withdrawal Rules

- Per-category daily limits for Officers and Members
- Reset at midnight UTC (consistent with guild quests)
- Leaders have unlimited withdrawals (no daily cap)
- Role-based defaults with individual player overrides (Leader can give specific player higher/lower limits)
- Remaining daily limit always visible in bank UI

**Pokemon-specific:**
- Rarity-weighted withdrawal limits
- Uses combination of Base Stat Total and manual tiers
- Daily points budget, different Pokemon cost different points

### Request System

- Members can request items/Pokemon they cannot withdraw directly
- Notifications sent to Officers/Leaders
- Request queue for Officers to review
- Requests expire after 24 hours
- Members can cancel their own requests anytime
- No limit on pending requests per member

### Bank UI Layout

- Separate modal (opened from guild panel)
- Tabbed interface: Currency | Items | Pokemon | Logs | Requests
- Split view: Bank on left, personal inventory on right
- Click to select items, button to confirm deposit/withdraw
- Always confirm withdrawals (confirmation dialog)
- Full search and filter capabilities

**Pokemon tab:**
- Three view options: Grid (default), List, Card
- View toggle in tab header

**Items tab:**
- Grouped grid layout by category with headers

**Currency tab:**
- Shows member contributions (who contributed how much)
- Capacity shown in tab headers only

**General:**
- Show depositor info ("Deposited by PlayerName") on hover/detail
- Search by name, filter by type/category

### Transaction Logging

- History kept forever (no expiration)
- Full context per entry: who, what, when, action, item details, Pokemon stats, amounts
- Running balance shown after each transaction (like bank statement)
- Multiple filters: by player, action type, item category, date range
- Members see same UI but auto-filtered to their own transactions
- Request lifecycle fully audited: created, fulfilled, expired, cancelled
- Pagination with page numbers

### Claude's Discretion

- Currency cap formula (balanced scaling)
- Permission configuration UI/UX approach
- Exact scaling prices for Pokemon slot expansion
- BST/tier weight mappings for Pokemon withdrawal limits
- Log entry formatting and display

</decisions>

<specifics>
## Specific Ideas

- "Like WoW guild banks" — rank-based permissions for deposits and withdrawals
- Split view with personal inventory visible for easy deposit/withdraw flow
- Always show who deposited each item for accountability
- Requests have 24hr expiry to keep queue fresh

</specifics>

<deferred>
## Deferred Ideas

- Pokemon loan system (borrow Pokemon with return expectations) — future phase
- Log export to CSV — future feature
- More complex permission tiers beyond Leader/Officer/Member — future consideration

</deferred>

---

*Phase: 04-guild-bank*
*Context gathered: 2026-01-18*
