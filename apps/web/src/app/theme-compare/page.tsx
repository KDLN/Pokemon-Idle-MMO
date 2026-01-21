'use client'

/**
 * Theme Comparison Route
 *
 * Allows visual comparison of current theme vs "Pokemon Clean Modern" theme
 * using a toggle switch. Renders MockGameScreen which uses CSS variables
 * that automatically respond to data-theme attribute changes.
 *
 * No authentication required - uses static mock data.
 */

import { useState } from 'react'
import { MockGameScreen } from '@/components/game/MockGameScreen'

export default function ThemeComparePage() {
  const [theme, setTheme] = useState<'current' | 'modern'>('current')

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)]">
      {/* Fixed toggle control - top right */}
      <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-white/10">
        <div className="flex items-center gap-3">
          <span className={`text-sm ${theme === 'current' ? 'text-white' : 'text-white/50'}`}>
            Current
          </span>
          <button
            onClick={() => setTheme(t => t === 'current' ? 'modern' : 'current')}
            className="relative w-14 h-7 bg-[var(--color-surface-elevated)] rounded-full transition-colors border border-white/10"
            aria-label={`Switch to ${theme === 'current' ? 'modern' : 'current'} theme`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-[var(--color-brand-primary)] rounded-full transition-transform duration-200 ${
                theme === 'modern' ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm ${theme === 'modern' ? 'text-white' : 'text-white/50'}`}>
            Modern
          </span>
        </div>
        <p className="text-xs text-white/50 mt-2 text-center">
          Click toggle to compare themes
        </p>
      </div>

      {/* Theme label indicator - top left */}
      <div className="fixed top-4 left-4 z-50 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg border border-white/10">
        <span className="text-sm font-medium text-white">
          {theme === 'current' ? 'Current Theme' : 'Pokemon Clean Modern'}
        </span>
      </div>

      {/* Themed wrapper - data-theme triggers CSS variable overrides */}
      <div data-theme={theme === 'modern' ? 'modern' : undefined}>
        <MockGameScreen />
      </div>
    </div>
  )
}
