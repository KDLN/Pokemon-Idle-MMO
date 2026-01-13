'use client'

import { useEffect, useState, useRef } from 'react'

interface BackgroundLayerProps {
  zoneType: 'route' | 'town'
  zoneName?: string
  isAnimated?: boolean
}

// Route background with animated grass
function RouteBackground({ isAnimated }: { isAnimated: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base grass color */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-800 to-green-900" />

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

      {/* Flowers scattered */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`flower-${i}`}
          className="absolute text-xs"
          style={{
            left: `${15 + Math.random() * 70}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
        >
          {['🌸', '🌼', '🌺'][i % 3]}
        </div>
      ))}
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
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-sky-100" />

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

      {/* Zone name */}
      {zoneName && (
        <div className="absolute top-4 left-4 bg-white/80 px-3 py-1 rounded-full text-sm font-medium text-gray-800 shadow">
          {zoneName}
        </div>
      )}
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

export function BackgroundLayer({ zoneType, zoneName, isAnimated = true }: BackgroundLayerProps) {
  if (zoneType === 'town') {
    return <TownBackground zoneName={zoneName} />
  }

  return <RouteBackground isAnimated={isAnimated} />
}
