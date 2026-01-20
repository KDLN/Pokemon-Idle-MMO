'use client'

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from '@/lib/ui/cn'

/**
 * Card variant definitions using CVA.
 * Exported for style reuse.
 */
export const cardVariants = cva(
  // Base classes
  "rounded-xl overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]",
        glass: "glass border border-[var(--color-border-subtle)]",
        bordered: "poke-border",
      },
      padding: {
        none: "",
        sm: "p-2 sm:p-3",
        md: "p-3 sm:p-4",
        lg: "p-4 sm:p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
)

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({
  children,
  className,
  variant,
  padding,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Card Header component for consistent headers
interface CardHeaderProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function CardHeader({
  icon,
  title,
  subtitle,
  action,
  className,
}: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-2 sm:gap-3">
        {icon && (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[var(--color-brand-secondary)] to-[var(--color-brand-secondary-dark)] flex items-center justify-center text-white flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h2 className="font-pixel text-[10px] sm:text-xs text-white tracking-wider uppercase">{title}</h2>
          {subtitle && <p className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
