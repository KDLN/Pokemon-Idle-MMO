'use client'

import { cn } from '@/lib/ui'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'pokeball'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'w-10 h-10',
}

const variantClasses = {
  primary: `
    bg-gradient-to-b from-[#3B4CCA] to-[#2a3b9a] text-white
    border border-[#5B6EEA]/30
    hover:from-[#4B5CDA] hover:to-[#3B4CCA]
    active:scale-95
    shadow-lg shadow-[#3B4CCA]/20
  `,
  secondary: `
    bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] text-white
    border border-[#2a2a4a]
    hover:border-[#3a3a6a] hover:from-[#252542]
    active:scale-95
  `,
  ghost: `
    bg-transparent text-[#a0a0c0]
    hover:bg-[#1a1a2e] hover:text-white
    active:scale-95
  `,
  danger: `
    bg-gradient-to-b from-[#EE1515] to-[#CC0000] text-white
    border border-[#FF4444]/30
    hover:from-[#FF2222] hover:to-[#EE1515]
    active:scale-95
    shadow-lg shadow-red-900/30
  `,
  pokeball: `
    bg-gradient-to-b from-[#EE1515] to-[#CC0000] text-white
    border-2 border-[#FF4444]/50
    hover:from-[#FF2222] hover:to-[#EE1515]
    active:scale-95
    shadow-lg shadow-red-900/30
    font-semibold
  `,
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
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
