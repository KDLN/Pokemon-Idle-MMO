import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader } from './Card'
import { Button } from './Button'

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Container component for grouping related content. Supports multiple visual variants and padding options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'glass', 'bordered'],
      description: 'Visual style of the card',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Internal padding',
    },
    children: {
      control: 'text',
      description: 'Card content',
    },
  },
  args: {
    variant: 'default',
    padding: 'md',
    children: 'Card content goes here',
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

// Default story with controls
export const Default: Story = {}

// All variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[320px]">
      <Card variant="default">
        <p className="text-white">Default Card</p>
        <p className="text-sm text-[var(--color-text-secondary)]">Standard elevated surface with subtle border.</p>
      </Card>
      <Card variant="glass">
        <p className="text-white">Glass Card</p>
        <p className="text-sm text-[var(--color-text-secondary)]">Translucent effect with backdrop blur.</p>
      </Card>
      <Card variant="bordered">
        <p className="text-white">Bordered Card</p>
        <p className="text-sm text-[var(--color-text-secondary)]">Pokemon-style border with gradient background.</p>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card variants. Default for most cases, glass for overlays, bordered for featured content.',
      },
    },
  },
}

// All padding options
export const Padding: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[320px]">
      <Card padding="none">
        <div className="bg-[var(--color-surface-hover)] p-4">
          <p className="text-white">padding=none</p>
        </div>
      </Card>
      <Card padding="sm">
        <p className="text-white">padding=sm (p-2 / p-3)</p>
      </Card>
      <Card padding="md">
        <p className="text-white">padding=md (p-3 / p-4)</p>
      </Card>
      <Card padding="lg">
        <p className="text-white">padding=lg (p-4 / p-6)</p>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Padding options. Use none for custom internal layouts, sm for compact content, md for standard content, lg for spacious layouts.',
      },
    },
  },
}

// With CardHeader
export const WithHeader: Story = {
  render: () => (
    <div className="w-[320px]">
      <Card>
        <CardHeader
          icon={<span className="text-lg">...</span>}
          title="Party Pokemon"
          subtitle="6 Pokemon in your party"
          action={<Button size="sm" variant="ghost">Edit</Button>}
        />
        <div className="mt-4 space-y-2">
          <p className="text-[var(--color-text-secondary)]">Pikachu Lv.25</p>
          <p className="text-[var(--color-text-secondary)]">Charizard Lv.36</p>
          <p className="text-[var(--color-text-secondary)]">Blastoise Lv.36</p>
        </div>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card with CardHeader component. Header includes icon, title, optional subtitle, and optional action.',
      },
    },
  },
}

// Header variations
export const HeaderVariations: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[320px]">
      <Card>
        <CardHeader title="Simple Header" />
        <p className="mt-2 text-[var(--color-text-secondary)]">Title only, no icon or action.</p>
      </Card>
      <Card>
        <CardHeader
          icon={<span>O</span>}
          title="With Icon"
        />
        <p className="mt-2 text-[var(--color-text-secondary)]">Icon adds visual context.</p>
      </Card>
      <Card>
        <CardHeader
          icon={<span>...</span>}
          title="Full Header"
          subtitle="Supporting text here"
          action={<Button size="sm">Action</Button>}
        />
        <p className="mt-2 text-[var(--color-text-secondary)]">All header elements populated.</p>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'CardHeader flexibility. Supports icon, title, subtitle, and action in various combinations.',
      },
    },
  },
}

// Nested cards
export const Nested: Story = {
  render: () => (
    <div className="w-[360px]">
      <Card variant="bordered" padding="lg">
        <CardHeader title="Outer Card" />
        <div className="mt-4 space-y-3">
          <Card variant="default" padding="sm">
            <p className="text-sm text-white">Nested Card 1</p>
          </Card>
          <Card variant="default" padding="sm">
            <p className="text-sm text-white">Nested Card 2</p>
          </Card>
        </div>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Cards can be nested. Use different variants to create visual hierarchy.',
      },
    },
  },
}
