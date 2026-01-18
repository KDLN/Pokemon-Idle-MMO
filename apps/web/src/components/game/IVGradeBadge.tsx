'use client'

import { cn } from '@/lib/ui'
import type { Pokemon } from '@/types/game'
import {
  getIVGrade,
  getGradeColorClass,
  getGradeDescription,
  getTotalIVs,
  type IVGrade,
} from '@/lib/ivUtils'

interface IVGradeBadgeProps {
  pokemon: Pokemon
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

const sizeClasses = {
  xs: 'w-4 h-4 text-[8px]',
  sm: 'w-5 h-5 text-[10px]',
  md: 'w-6 h-6 text-xs',
  lg: 'w-8 h-8 text-sm',
}

export function IVGradeBadge({
  pokemon,
  size = 'sm',
  showTooltip = true,
  className,
}: IVGradeBadgeProps) {
  const grade = getIVGrade(pokemon)
  const total = getTotalIVs(pokemon)
  const description = getGradeDescription(grade)
  const colorClass = getGradeColorClass(grade)

  const tooltip = showTooltip
    ? `${description} (${total}/186 IVs)`
    : undefined

  return (
    <div
      className={cn(
        sizeClasses[size],
        colorClass,
        'rounded font-bold flex items-center justify-center shadow-sm',
        grade === 'S' && 'animate-pulse ring-1 ring-yellow-300/50',
        className
      )}
      title={tooltip}
    >
      {grade}
    </div>
  )
}

interface IVGradeTextProps {
  pokemon: Pokemon
  showTotal?: boolean
  className?: string
}

export function IVGradeText({
  pokemon,
  showTotal = true,
  className,
}: IVGradeTextProps) {
  const grade = getIVGrade(pokemon)
  const total = getTotalIVs(pokemon)
  const description = getGradeDescription(grade)

  const gradeTextColor: Record<IVGrade, string> = {
    S: 'text-yellow-400',
    A: 'text-emerald-400',
    B: 'text-blue-400',
    C: 'text-gray-400',
    D: 'text-red-400',
  }

  return (
    <span className={cn('font-medium', className)}>
      <span className={gradeTextColor[grade]}>
        Grade {grade}
      </span>
      {showTotal && (
        <span className="text-[#a0a0c0] ml-1">
          ({total}/186)
        </span>
      )}
    </span>
  )
}
