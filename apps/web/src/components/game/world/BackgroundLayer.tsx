'use client'

import { useEffect, useState, useRef } from 'react'

interface BackgroundLayerProps {
  zoneType: 'route' | 'town' | 'forest' | 'cave' | 'water'
  zoneName?: string
  isAnimated?: boolean
}

// Route background with animated grass
function RouteBackground({ isAnimated }: { isAnimated: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base grass color - zone-specific gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a3a2a] to-[#1a2a1a]" />

      {/* Sky gradient overlay at top */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-transparent to-transparent" />

      {/* Dirt path */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-full bg-gradient-to-t from-amber-800/60 to-amber-900/40" />

      {/* Animated grass tufts */}
      <div className="absolute inset-0">
        {[...Array(24)].map((_, i) => {
          const row = Math.floor(i / 6)
          const col = i % 6
          const offsetX = (col * 60) + (row % 2 ? 30 : 0)
          const offsetY = row * 40 + 20

          return (
            <div
              key={i}
              className={`absolute ${isAnimated ? 'animate-grass-sway' : ''}`}
              style={{
                left: `${offsetX}px`,
                top: `${offsetY}px`,
                animationDelay: `${(i * 0.15) % 2}s`,
              }}
            >
              <GrassTuft />
            </div>
          )
        })}
      </div>

      {/* Flowers scattered - fixed positions */}
      <div className="absolute text-xs" style={{ left: '18%', top: '25%' }}>🌸</div>
      <div className="absolute text-xs" style={{ left: '72%', top: '35%' }}>🌼</div>
      <div className="absolute text-xs" style={{ left: '35%', top: '55%' }}>🌺</div>
      <div className="absolute text-xs" style={{ left: '55%', top: '42%' }}>🌸</div>
      <div className="absolute text-xs" style={{ left: '82%', top: '65%' }}>🌼</div>
      <div className="absolute text-xs" style={{ left: '25%', top: '70%' }}>🌺</div>
      <div className="absolute text-xs" style={{ left: '65%', top: '28%' }}>🌸</div>
      <div className="absolute text-xs" style={{ left: '45%', top: '75%' }}>🌼</div>
    </div>
  )
}

function GrassTuft() {
  return (
    <svg width="24" height="20" viewBox="0 0 24 20" className="text-green-500">
      <path
        d="M4 20 Q6 10 8 8 Q10 12 12 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 20 Q12 8 14 5 Q16 10 18 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 20 Q18 12 20 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Town background with buildings
function TownBackground({ zoneName }: { zoneName?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base town gradient - neutral dark tones */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a3a] to-[#1a1a2a]" />

      {/* Sky gradient overlay at top */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-transparent to-transparent" />

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-b from-amber-200 to-amber-300" />

      {/* Simple building silhouettes */}
      <div className="absolute bottom-1/3 left-0 right-0 flex justify-center gap-4 items-end px-8">
        {/* Pokemon Center style building */}
        <div className="relative">
          <div className="w-20 h-16 bg-red-500 rounded-t-lg border-2 border-red-700" />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-500 text-lg font-bold">
            +
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-8 bg-gray-700 rounded-t" />
        </div>

        {/* House */}
        <div className="relative">
          <div className="w-14 h-12 bg-amber-100 border-2 border-amber-300" />
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '36px solid transparent',
              borderRight: '36px solid transparent',
              borderBottom: '24px solid #92400e',
            }}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-amber-800 rounded-t" />
          <div className="absolute top-3 left-2 w-3 h-3 bg-sky-200 border border-sky-400" />
          <div className="absolute top-3 right-2 w-3 h-3 bg-sky-200 border border-sky-400" />
        </div>

        {/* Pokemart style building */}
        <div className="relative">
          <div className="w-16 h-14 bg-blue-400 rounded-t border-2 border-blue-600" />
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-white text-xs font-bold">
            MART
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-7 bg-blue-700" />
        </div>
      </div>

      {/* Trees on sides */}
      <div className="absolute bottom-1/3 left-4">
        <Tree />
      </div>
      <div className="absolute bottom-1/3 right-4">
        <Tree />
      </div>
    </div>
  )
}

function Tree() {
  return (
    <div className="relative">
      <div className="w-8 h-8 bg-green-600 rounded-full" />
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-3 h-6 bg-amber-700" />
    </div>
  )
}

// Tall forest tree
function ForestTree({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { canopy: 'w-10 h-10', trunk: 'w-2 h-8 top-8' },
    md: { canopy: 'w-14 h-14', trunk: 'w-3 h-12 top-11' },
    lg: { canopy: 'w-18 h-18', trunk: 'w-4 h-16 top-14' },
  }
  const s = sizes[size]

  return (
    <div className="relative">
      {/* Tree canopy - layered for depth */}
      <div className={`${s.canopy} bg-green-800 rounded-full`} />
      <div className={`absolute top-1 left-1 ${s.canopy} bg-green-700 rounded-full scale-90`} />
      <div className={`absolute top-2 left-2 ${s.canopy} bg-green-600 rounded-full scale-75`} />
      {/* Trunk */}
      <div className={`absolute ${s.trunk} left-1/2 -translate-x-1/2 bg-amber-900 rounded-b`} />
    </div>
  )
}

// Forest background with dense trees and darker atmosphere
function ForestBackground({ zoneName, isAnimated }: { zoneName?: string; isAnimated: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Dark forest gradient - green tones matching Mock */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a3a2a] to-[#1a2a1a]" />

      {/* Sky gradient overlay at top */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-transparent to-transparent" />

      {/* Forest floor gradient at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-900/40 to-transparent" />

      {/* Fog/mist effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-green-900/50 via-transparent to-green-950/30" />

      {/* Ground - mossy forest floor */}
      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-amber-950 via-green-950 to-green-900" />

      {/* Dirt path through forest */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-1/3 bg-gradient-to-t from-amber-900/70 to-transparent" />

      {/* Background trees (distant, darker) - fixed offsets for stability */}
      <div className="absolute bottom-1/4 left-0 right-0 flex justify-around items-end opacity-60">
        <div className="relative" style={{ transform: 'translateY(5px)' }}><div className="w-8 h-20 bg-green-950 rounded-t-full" /></div>
        <div className="relative" style={{ transform: 'translateY(12px)' }}><div className="w-8 h-20 bg-green-950 rounded-t-full" /></div>
        <div className="relative" style={{ transform: 'translateY(3px)' }}><div className="w-8 h-20 bg-green-950 rounded-t-full" /></div>
        <div className="relative" style={{ transform: 'translateY(15px)' }}><div className="w-8 h-20 bg-green-950 rounded-t-full" /></div>
        <div className="relative" style={{ transform: 'translateY(8px)' }}><div className="w-8 h-20 bg-green-950 rounded-t-full" /></div>
        <div className="relative" style={{ transform: 'translateY(18px)' }}><div className="w-8 h-20 bg-green-950 rounded-t-full" /></div>
        <div className="relative" style={{ transform: 'translateY(6px)' }}><div className="w-8 h-20 bg-green-950 rounded-t-full" /></div>
        <div className="relative" style={{ transform: 'translateY(10px)' }}><div className="w-8 h-20 bg-green-950 rounded-t-full" /></div>
      </div>

      {/* Midground trees */}
      <div className="absolute bottom-1/4 left-0 right-0 flex justify-around items-end px-4">
        <ForestTree size="lg" />
        <ForestTree size="md" />
        <ForestTree size="lg" />
        <ForestTree size="md" />
        <ForestTree size="lg" />
      </div>

      {/* Foreground trees on edges */}
      <div className="absolute bottom-1/4 left-0">
        <div className="w-16 h-32 bg-green-950 rounded-tr-full" />
      </div>
      <div className="absolute bottom-1/4 right-0">
        <div className="w-16 h-32 bg-green-950 rounded-tl-full" />
      </div>

      {/* Mushrooms on forest floor */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`mushroom-${i}`}
          className="absolute bottom-4"
          style={{ left: `${15 + i * 18}%` }}
        >
          <div className="w-3 h-2 bg-red-600 rounded-t-full" />
          <div className="w-1.5 h-2 bg-amber-100 mx-auto" />
        </div>
      ))}

      {/* Fireflies - drift and fade with varied animations */}
      {isAnimated && (
        <>
          <div className="absolute w-1.5 h-1.5 bg-yellow-300/80 rounded-full animate-firefly-1" style={{ left: '15%', top: '25%' }} />
          <div className="absolute w-1 h-1 bg-yellow-200/70 rounded-full animate-firefly-2" style={{ left: '25%', top: '40%', animationDelay: '2s' }} />
          <div className="absolute w-1.5 h-1.5 bg-yellow-300/80 rounded-full animate-firefly-3" style={{ left: '45%', top: '30%', animationDelay: '1s' }} />
          <div className="absolute w-1 h-1 bg-yellow-200/70 rounded-full animate-firefly-1" style={{ left: '55%', top: '50%', animationDelay: '3.5s' }} />
          <div className="absolute w-1.5 h-1.5 bg-yellow-300/80 rounded-full animate-firefly-2" style={{ left: '70%', top: '35%', animationDelay: '0.5s' }} />
          <div className="absolute w-1 h-1 bg-yellow-200/70 rounded-full animate-firefly-3" style={{ left: '80%', top: '55%', animationDelay: '4s' }} />
        </>
      )}

      {/* Light rays breaking through canopy */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div
          className="absolute w-8 h-full bg-gradient-to-b from-yellow-200/40 to-transparent rotate-12"
          style={{ left: '20%', top: '-10%' }}
        />
        <div
          className="absolute w-6 h-full bg-gradient-to-b from-yellow-200/30 to-transparent -rotate-6"
          style={{ left: '60%', top: '-10%' }}
        />
        <div
          className="absolute w-4 h-full bg-gradient-to-b from-yellow-200/20 to-transparent rotate-3"
          style={{ left: '80%', top: '-10%' }}
        />
      </div>
    </div>
  )
}

// Cave background with dark atmosphere
function CaveBackground({ zoneName }: { zoneName?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Cave gradient - dark gray/purple tones */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a3a] to-[#1a1a2a]" />

      {/* Dim lighting from above */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-transparent to-transparent" />

      {/* Rock formations on sides */}
      <div className="absolute bottom-0 left-0 w-24 h-full bg-gradient-to-r from-stone-900/60 to-transparent" />
      <div className="absolute bottom-0 right-0 w-24 h-full bg-gradient-to-l from-stone-900/60 to-transparent" />

      {/* Stalactites at top */}
      <div className="absolute top-0 left-1/4 w-4 h-12 bg-gradient-to-b from-stone-800 to-transparent rounded-b-full opacity-40" />
      <div className="absolute top-0 left-1/2 w-6 h-16 bg-gradient-to-b from-stone-800 to-transparent rounded-b-full opacity-50" />
      <div className="absolute top-0 right-1/4 w-3 h-10 bg-gradient-to-b from-stone-800 to-transparent rounded-b-full opacity-35" />
    </div>
  )
}

// Water background with ocean/lake feel
function WaterBackground({ zoneName }: { zoneName?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Water gradient - blue tones */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a3a4a] to-[#1a2a3a]" />

      {/* Sky gradient overlay at top */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-transparent to-transparent" />

      {/* Water surface shimmer */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-blue-900/40 via-blue-800/20 to-transparent" />

      {/* Wave lines */}
      <div className="absolute bottom-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
      <div className="absolute bottom-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/20 to-transparent" />
    </div>
  )
}

export function BackgroundLayer({ zoneType, zoneName, isAnimated = true }: BackgroundLayerProps) {
  if (zoneType === 'town') {
    return <TownBackground zoneName={zoneName} />
  }

  if (zoneType === 'forest') {
    return <ForestBackground zoneName={zoneName} isAnimated={isAnimated} />
  }

  if (zoneType === 'cave') {
    return <CaveBackground zoneName={zoneName} />
  }

  if (zoneType === 'water') {
    return <WaterBackground zoneName={zoneName} />
  }

  return <RouteBackground isAnimated={isAnimated} />
}
