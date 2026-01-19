# Phase 9: Design System - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Formalize existing design tokens and establish component patterns for consistent visual work. Document 66+ CSS variables with semantic naming, create typography and spacing scales, set up Storybook with interactive examples, and implement CVA component patterns. This phase creates infrastructure — new visual features use these patterns in later phases.

</domain>

<decisions>
## Implementation Decisions

### Token Organization
- Organize by type: colors.css, spacing.css, typography.css — separate files per token category
- Use semantic naming: --color-surface, --color-primary, --text-muted — describes purpose, not value
- Same tokens with different values for theming: --color-surface value changes via :root[data-theme] selector
- Typography as separate properties: --font-size-md, --font-weight-bold, --line-height-tight — mix and match

### Claude's Discretion (Token Organization)
- Prefix convention — determine based on existing codebase patterns
- Spacing scale naming — t-shirt vs numeric based on current usage
- Color opacity variants — based on actual usage patterns
- Border radius naming — size-based vs purpose-based per existing patterns

### Storybook Setup
- Scope: All reusable components — comprehensive coverage
- Story depth: Full MDX docs with usage guidelines, do's/don'ts
- States: All interaction states — hover, focus, active, disabled for each component
- Deployment: Static build alongside app on Vercel — accessible to team

### CVA Patterns
- Variant naming: Both dimensions — intent (primary/secondary/danger) + appearance (solid/outline/ghost) as separate props
- Styling method: Hybrid — Tailwind for layout, CSS variables for colors/typography

### Claude's Discretion (CVA)
- Size variant consistency — unified vs component-specific based on component needs
- Compound variant handling — explicit vs minimal based on design needs

### Documentation Depth
- Format: Both — Markdown source files rendered in Storybook (single source of truth)
- Guidelines: Yes, with do's/don'ts and usage examples

### Claude's Discretion (Documentation)
- Visual swatches — determine what's practical
- Organization structure — by token type vs use case based on token count

</decisions>

<specifics>
## Specific Ideas

No specific external references — open to standard patterns (Radix, shadcn/ui, Tailwind conventions).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-design-system*
*Context gathered: 2026-01-19*
