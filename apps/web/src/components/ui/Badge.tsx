'use client'

import { cn, getTypeColor } from '@/lib/ui'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'type' | 'success' | 'warning' | 'error' | 'shiny'
  type?: string
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  type,
  size = 'sm',
  className,
}: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'

  const baseClasses = cn(
    'inline-flex items-center font-bold uppercase tracking-wide rounded',
    sizeClasses
  )

  if (variant === 'type' && type) {
    return (
      <span
        className={cn(baseClasses, 'text-white shadow-sm', className)}
        style={{ backgroundColor: getTypeColor(type) }}
      >
        {children}
      </span>
    )
  }

  if (variant === 'shiny') {
    return (
      <span
        className={cn(
          baseClasses,
          'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black',
          className
        )}
      >
        {children}
      </span>
    )
  }

  const variantClasses: Record<string, string> = {
    default: 'bg-[#2a2a4a] text-[#a0a0c0]',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
  }

  return (
    <span className={cn(baseClasses, variantClasses[variant] ?? variantClasses.default, className)}>
      {children}
    </span>
  )
}

// Type Badge - specifically for Pokemon types
interface TypeBadgeProps {
  type: string
  size?: 'sm' | 'md'
  className?: string
}

export function TypeBadge({ type, size = 'sm', className }: TypeBadgeProps) {
  return (
    <Badge variant="type" type={type} size={size} className={className}>
      {type}
    </Badge>
  )
}
