'use client'

interface LongPressIndicatorProps {
  /** Progress value from 0 to 1 */
  progress: number
  /** Size in pixels (default 48) */
  size?: number
  /** Whether to show the indicator */
  visible?: boolean
}

/**
 * Radial progress ring that fills during long-press countdown
 * Shows during the 300ms hold before drag activates
 */
export function LongPressIndicator({
  progress,
  size = 48,
  visible = false,
}: LongPressIndicatorProps) {
  if (!visible || progress <= 0) return null

  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(progress, 1))

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        className="drop-shadow-lg"
      >
        {/* Background circle */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="3"
        />
        {/* Progress circle */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="var(--poke-blue, #3B4CCA)"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: 'stroke-dashoffset 50ms linear' }}
        />
      </svg>
    </div>
  )
}
