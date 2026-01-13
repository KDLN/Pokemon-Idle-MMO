'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/ui'

interface BattleSceneFrameProps {
  isShiny?: boolean
  glowColor?: string
  sizeClass?: string
  className?: string
  phaseClasses?: string
  caught?: boolean
  children: ReactNode
}

export function BattleSceneFrame({
  isShiny = false,
  glowColor,
  sizeClass = 'max-w-lg',
  className,
  phaseClasses,
  caught = false,
  children
}: BattleSceneFrameProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className={cn(
          'relative w-full rounded-2xl overflow-hidden transition-all duration-500 shadow-2xl',
          sizeClass,
          phaseClasses,
          className
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle, ${glowColor ?? '#3B4CCA'} 0%, transparent 70%)`
          }}
        />
        {isShiny && (
          <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 py-2 animate-shimmer">
            <div className="flex items-center justify-center gap-2">
              <span className="text-black text-lg">バﾝ</span>
              <span className="font-pixel text-sm text-black tracking-widest">SHINY POKEMON!</span>
              <span className="text-black text-lg">バﾝ</span>
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-900/40 to-transparent" />
        <div className={cn('relative flex flex-col bg-transparent', isShiny ? 'pt-10' : 'pt-6')} style={{ minHeight: '420px' }}>
          {children}
        </div>
        <div
          className={cn(
            'absolute inset-0 rounded-2xl border-2 pointer-events-none transition-colors duration-300',
            caught ? 'border-green-500/60' : 'border-[#3a3a5a]'
          )}
        />
      </div>
    </div>
  )
}
