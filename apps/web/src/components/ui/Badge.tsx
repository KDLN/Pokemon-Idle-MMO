'use client'

import { cva, type VariantProps } from "class-variance-authority"
import { cn, getTypeColor } from '@/lib/ui'

/**
 * Badge variant definitions using CVA.
 * Exported for style reuse.
 */
export const badgeVariants = cva(
  // Base classes
  "inline-flex items-center font-bold uppercase tracking-wide rounded",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-border-subtle)] text-[var(--color-text-secondary)]",
        success: "bg-green-500/20 text-green-400 border border-green-500/30",
        warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        error: "bg-red-500/20 text-red-400 border border-red-500/30",
        shiny: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black",
        // Note: 'type' variant handled separately due to dynamic color
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.5",
        md: "text-xs px-2 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Pokemon type for 'type' variant - sets background color dynamically */
  type?: string
}

export function Badge({
  children,
  variant,
  type,
  size,
  className,
  ...props
}: BadgeProps) {
  // Handle Pokemon type badge separately due to dynamic backgroundColor
  // Use type badge when: type is provided AND no variant specified (or variant is explicitly undefined)
  if (type && !variant) {
    const sizeClasses = size === 'md' ? 'text-xs px-2 py-1' : 'text-[10px] px-1.5 py-0.5'
    return (
      <span
        className={cn(
          "inline-flex items-center font-bold uppercase tracking-wide rounded text-white shadow-sm",
          sizeClasses,
          className
        )}
        style={{ backgroundColor: getTypeColor(type || 'normal') }}
        {...props}
      >
        {children}
      </span>
    )
  }

  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </span>
  )
}

// Type Badge - specifically for Pokemon types
interface TypeBadgeProps extends Omit<BadgeProps, 'variant' | 'type'> {
  type: string
}

export function TypeBadge({ type, size = 'sm', className, ...props }: TypeBadgeProps) {
  return (
    <Badge type={type} size={size} className={className} {...props}>
      {type}
    </Badge>
  )
}
