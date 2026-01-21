# Phase 19: Cleanup & Polish - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove experimental code (MockGameScreen, /theme-compare), update Storybook for Modern theme showcase, run E2E and manual verification across all breakpoints, and fix any regressions before shipping v1.2.

</domain>

<decisions>
## Implementation Decisions

### Experimental removal
- Full audit for Mock/experimental code, not just the two named files
- Remove orphaned utilities, hooks, or CSS only used by Mock code
- Clean up console.log statements and debug comments from v1.2 development
- Fix all ESLint warnings (run lint --fix, address remaining issues)
- Git history is sufficient backup — no need to archive experimental code

### Storybook updates
- Update existing stories AND add new showcase for Modern theme
- Feature BeveledButton + card components in showcase
- Modern theme only (no light/dark variants)
- Show all interactive states (hover, active, disabled, loading)
- Host Storybook at /storybook in production
- Build Storybook to public/storybook folder (Next.js serves it statically)
- Storybook is publicly accessible
- Build Storybook as part of npm run build (not separate command)

### Testing approach
- Both automated E2E tests AND manual walkthrough
- E2E scope: Core gameplay loop + guild basics (login → zone → catch → party + guild create/join/chat)
- No visual regression testing (too heavy for this milestone)
- Test at all three breakpoints: desktop (1440px), tablet (768px), mobile (375px)

### Regression handling
- Fix all regressions before shipping — phase isn't complete until resolved
- Track regressions as tasks in PLAN.md (add as discovered)
- Do proper refactoring if needed, not minimal workarounds
- Regression = broken functionality (something that worked before doesn't work now)

### Claude's Discretion
- Which specific experimental files to remove (based on audit)
- Exact Storybook story organization
- E2E test framework choice (Playwright vs Cypress)
- Order of verification testing

</decisions>

<specifics>
## Specific Ideas

- Want Storybook accessible at /storybook for component reference
- E2E should cover both core gameplay AND guild features (v1.0 scope)
- Quality bar: everything that worked before v1.2 should still work

</specifics>

<deferred>
## Deferred Ideas

- Visual regression testing (Percy/Chromatic) — consider for v1.3
- Sound/audio system — noted in PROJECT.md for future

</deferred>

---

*Phase: 19-cleanup-polish*
*Context gathered: 2026-01-21*
