'use client'

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from '@/lib/ui/cn'

/**
 * Button variant definitions using CVA.
 * Exported for style reuse (e.g., links styled as buttons).
 */
export const buttonVariants = cva(
  // Base classes applied to all variants
  [
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium",
    "transition-all duration-200",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-b from-[var(--color-brand-primary)] to-[var(--color-brand-primary-dark)] text-white",
          "border border-[var(--color-brand-primary-light)]/30",
          "hover:from-[#4B5CDA] hover:to-[var(--color-brand-primary)]",
          "active:scale-95",
          "shadow-lg shadow-[var(--color-brand-primary)]/20",
        ],
        secondary: [
          "bg-gradient-to-b from-[var(--color-surface-elevated)] to-[var(--color-surface-base)] text-white",
          "border border-[var(--color-border-subtle)]",
          "hover:border-[var(--color-border-bright)] hover:from-[var(--color-surface-hover)]",
          "active:scale-95",
        ],
        ghost: [
          "bg-transparent text-[var(--color-text-secondary)]",
          "hover:bg-[var(--color-surface-elevated)] hover:text-white",
          "active:scale-95",
        ],
        danger: [
          "bg-gradient-to-b from-[var(--color-brand-secondary)] to-[var(--color-brand-secondary-dark)] text-white",
          "border border-[var(--color-brand-secondary-light)]/30",
          "hover:from-[#FF2222] hover:to-[var(--color-brand-secondary)]",
          "active:scale-95",
          "shadow-lg shadow-red-900/30",
        ],
        pokeball: [
          "bg-gradient-to-b from-[var(--color-brand-secondary)] to-[var(--color-brand-secondary-dark)] text-white",
          "border-2 border-[var(--color-brand-secondary-light)]/50",
          "hover:from-[#FF2222] hover:to-[var(--color-brand-secondary)]",
          "active:scale-95",
          "shadow-lg shadow-red-900/30",
          "font-semibold",
        ],
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
        icon: "w-10 h-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export function Button({
  children,
  variant,
  size,
  loading,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && (
        <svg
          className="w-4 h-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

// Icon Button for compact icon-only buttons
interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  icon: React.ReactNode
  label: string
}

export function IconButton({ icon, label, className, ...props }: IconButtonProps) {
  return (
    <Button
      size="icon"
      className={cn('rounded-full', className)}
      title={label}
      aria-label={label}
      {...props}
    >
      {icon}
    </Button>
  )
}
