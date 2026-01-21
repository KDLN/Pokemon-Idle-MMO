import type { Meta, StoryObj } from '@storybook/react'
import { Button, IconButton, BeveledButton } from './Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Primary interactive element for user actions. Supports multiple variants and sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'pokeball'],
      description: 'Visual style of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      description: 'Size of the button',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables interaction',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    children: {
      control: 'text',
      description: 'Button label',
    },
  },
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Default story with controls
export const Default: Story = {}

// All variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="pokeball">Pokeball</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants. Primary for main actions, secondary for alternatives, ghost for subtle actions, danger for destructive actions, pokeball for game-specific CTAs.',
      },
    },
  },
}

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <span className="text-lg">+</span>
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button sizes. Use sm for tight spaces, md for most cases, lg for primary CTAs, icon for icon-only buttons.',
      },
    },
  },
}

// Loading state
export const Loading: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button loading>Loading...</Button>
      <Button variant="secondary" loading>Processing</Button>
      <Button variant="pokeball" loading>Catching</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state shows a spinner and disables the button. Use for async operations.',
      },
    },
  },
}

// Disabled state
export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button disabled>Disabled</Button>
      <Button variant="secondary" disabled>Disabled</Button>
      <Button variant="pokeball" disabled>Disabled</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disabled buttons have reduced opacity and cannot be clicked.',
      },
    },
  },
}

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button>
        <span>+</span> Add Pokemon
      </Button>
      <Button variant="secondary">
        Settings <span>...</span>
      </Button>
      <Button variant="danger">
        <span>x</span> Delete
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with icons. Use gap-2 (built-in) to space icon and text.',
      },
    },
  },
}

// IconButton component
export const IconButtons: Story = {
  render: () => (
    <div className="flex gap-4">
      <IconButton icon="+" label="Add" />
      <IconButton icon="x" label="Close" variant="ghost" />
      <IconButton icon="..." label="Menu" variant="secondary" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'IconButton is a circular icon-only button. Always provide a label for accessibility.',
      },
    },
  },
}

// BeveledButton - 3D effect
export const Beveled: Story = {
  render: () => (
    <BeveledButton>
      Click Me
    </BeveledButton>
  ),
  parameters: {
    docs: {
      description: {
        story: '3D beveled button with raised shadow effect. Hover to lift, click to press down. Uses transform-based animations for smooth performance.',
      },
    },
  },
}

// BeveledButton color variants
export const BeveledColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      <BeveledButton hue={240}>
        Blue (Primary)
      </BeveledButton>
      <BeveledButton hue={0} saturation={70} lightness={50}>
        Red (Danger)
      </BeveledButton>
      <BeveledButton hue={120} saturation={50} lightness={40}>
        Green (Success)
      </BeveledButton>
      <BeveledButton hue={45} saturation={90} lightness={50}>
        Yellow (Warning)
      </BeveledButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Color variants via HSL hue property. Blue for primary actions, red for danger/pokeball, green for success, yellow for warnings.',
      },
    },
  },
}

// BeveledButton interactive demo
export const BeveledInteractive: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <BeveledButton hue={240}>
        Click me to see the press effect!
      </BeveledButton>
      <p className="text-sm text-gray-400">
        Hover to lift the button, click to press it down.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo. The button lifts on hover with a bouncy animation (250ms with overshoot), and presses down snappily on click (34ms).',
      },
    },
  },
}

// BeveledButton disabled state
export const BeveledDisabled: Story = {
  render: () => (
    <div className="flex gap-6">
      <BeveledButton disabled>
        Disabled
      </BeveledButton>
      <BeveledButton hue={0} disabled>
        Disabled Red
      </BeveledButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disabled beveled buttons have grayscale filter and flattened depth.',
      },
    },
  },
}
