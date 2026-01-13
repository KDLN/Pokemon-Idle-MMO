'use client'

import { cn } from '@/lib/ui'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'bordered'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-2 sm:p-3',
  md: 'p-3 sm:p-4',
  lg: 'p-4 sm:p-6',
}

const variantClasses = {
  default: 'bg-[#1a1a2e] border border-[#2a2a4a]',
  glass: 'glass border border-[#2a2a4a]',
  bordered: 'poke-border',
}

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden',
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
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
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#EE1515] to-[#CC0000] flex items-center justify-center text-white flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h2 className="font-pixel text-[10px] sm:text-xs text-white tracking-wider uppercase">{title}</h2>
          {subtitle && <p className="text-[9px] sm:text-[10px] text-[#606080]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
