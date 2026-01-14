'use client'

import { useState, useRef, useLayoutEffect, useEffect, useId, type ReactNode } from 'react'
import { cn } from '@/lib/ui'

// Constants for positioning
const VIEWPORT_PADDING = 8
const TOOLTIP_OFFSET = 8

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipId = useId()

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  // Handle Escape key to dismiss tooltip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        hideTooltip()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible])

  // Use useLayoutEffect to position tooltip before paint to avoid flicker
  useLayoutEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()

      let x = 0
      let y = 0

      switch (position) {
        case 'top':
          x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
          y = triggerRect.top - tooltipRect.height - TOOLTIP_OFFSET
          break
        case 'bottom':
          x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
          y = triggerRect.bottom + TOOLTIP_OFFSET
          break
        case 'left':
          x = triggerRect.left - tooltipRect.width - TOOLTIP_OFFSET
          y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
          break
        case 'right':
          x = triggerRect.right + TOOLTIP_OFFSET
          y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
          break
      }

      // Keep tooltip within viewport
      x = Math.max(VIEWPORT_PADDING, Math.min(x, window.innerWidth - tooltipRect.width - VIEWPORT_PADDING))
      y = Math.max(VIEWPORT_PADDING, Math.min(y, window.innerHeight - tooltipRect.height - VIEWPORT_PADDING))

      setCoords({ x, y })
    }
  }, [isVisible, position])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-describedby={isVisible ? tooltipId : undefined}
        className={cn('inline-block', className)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className="fixed z-50 pointer-events-none animate-fade-in"
          style={{ left: coords.x, top: coords.y }}
        >
          {content}
        </div>
      )}
    </>
  )
}

// Pre-styled tooltip content for items
interface ItemTooltipContentProps {
  name: string
  description: string
  effect?: string
  price?: number
  quantity?: number
}

export function ItemTooltipContent({
  name,
  description,
  effect,
  price,
  quantity,
}: ItemTooltipContentProps) {
  return (
    <div className="max-w-[200px] p-3 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] shadow-xl">
      {/* Item Name */}
      <div className="font-medium text-white text-sm mb-1">{name}</div>

      {/* Description */}
      <p className="text-xs text-[#a0a0c0] mb-2">{description}</p>

      {/* Effect (if any) */}
      {effect && (
        <div className="flex items-center gap-1.5 text-xs text-[#78C850] mb-2">
          <span className="text-[10px]">✦</span>
          <span>{effect}</span>
        </div>
      )}

      {/* Footer with price/quantity */}
      <div className="flex items-center justify-between pt-2 border-t border-[#2a2a4a]">
        {price !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#FFDE00]">$</span>
            <span className="text-xs text-[#FFDE00]">{price.toLocaleString()}</span>
          </div>
        )}
        {quantity !== undefined && (
          <div className="text-xs text-[#606080]">
            Owned: <span className="text-[#a0a0c0]">{quantity}</span>
          </div>
        )}
      </div>
    </div>
  )
}
