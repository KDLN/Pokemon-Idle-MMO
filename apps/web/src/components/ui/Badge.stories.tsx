import type { Meta, StoryObj } from '@storybook/react'
import { Badge, TypeBadge } from './Badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Compact label for status, categories, or metadata. Includes special TypeBadge for Pokemon types.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'shiny'],
      description: 'Visual style of the badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Size of the badge',
    },
    type: {
      control: 'text',
      description: 'Pokemon type (for type variant)',
    },
    children: {
      control: 'text',
      description: 'Badge label',
    },
  },
  args: {
    children: 'Badge',
    variant: 'default',
    size: 'sm',
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

// Default story with controls
export const Default: Story = {}

// All variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="shiny">Shiny</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badge variants for different statuses. Default for neutral info, success/warning/error for states, shiny for special highlighting.',
      },
    },
  },
}

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badge sizes. sm (default) for most cases, md when more emphasis is needed.',
      },
    },
  },
}

// Pokemon type badges
export const PokemonTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <TypeBadge type="normal" />
      <TypeBadge type="fire" />
      <TypeBadge type="water" />
      <TypeBadge type="electric" />
      <TypeBadge type="grass" />
      <TypeBadge type="ice" />
      <TypeBadge type="fighting" />
      <TypeBadge type="poison" />
      <TypeBadge type="ground" />
      <TypeBadge type="flying" />
      <TypeBadge type="psychic" />
      <TypeBadge type="bug" />
      <TypeBadge type="rock" />
      <TypeBadge type="ghost" />
      <TypeBadge type="dragon" />
      <TypeBadge type="dark" />
      <TypeBadge type="steel" />
      <TypeBadge type="fairy" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TypeBadge component for all 18 Pokemon types. Colors are defined in the design tokens.',
      },
    },
  },
}

// Type badge sizes
export const TypeBadgeSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <TypeBadge type="fire" size="sm" />
      <TypeBadge type="fire" size="md" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TypeBadge also supports sm and md sizes.',
      },
    },
  },
}

// Usage in context
export const InContext: Story = {
  render: () => (
    <div className="bg-[var(--color-surface-elevated)] p-4 rounded-lg space-y-4 w-[300px]">
      <div className="flex items-center justify-between">
        <span className="text-white font-medium">Pikachu</span>
        <div className="flex gap-1">
          <TypeBadge type="electric" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white font-medium">Charizard</span>
        <div className="flex gap-1">
          <TypeBadge type="fire" />
          <TypeBadge type="flying" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white font-medium">Venusaur</span>
        <div className="flex gap-1">
          <TypeBadge type="grass" />
          <TypeBadge type="poison" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TypeBadges in a Pokemon list context. Multiple types shown side-by-side.',
      },
    },
  },
}

// Status badges in context
export const StatusInContext: Story = {
  render: () => (
    <div className="bg-[var(--color-surface-elevated)] p-4 rounded-lg space-y-3 w-[300px]">
      <div className="flex items-center justify-between">
        <span className="text-white">Server Status</span>
        <Badge variant="success">Online</Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white">Quest Progress</span>
        <Badge variant="warning">In Progress</Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white">Battle Result</span>
        <Badge variant="error">Failed</Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white">Pokemon Variant</span>
        <Badge variant="shiny">Shiny</Badge>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Status badges in a list context. Use variants to communicate state at a glance.',
      },
    },
  },
}
