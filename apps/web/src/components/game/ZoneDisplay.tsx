'use client'

import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { OnlinePresence } from './OnlinePresence'
import { ShopPanel } from './ShopPanel'

// Zone data with icons and imagery
const ZONE_DATA: Record<string, { description: string; icon: string; features: string[] }> = {
  'Pallet Town': {
    description: 'A small, quiet town. Your adventure begins here!',
    icon: '🏠',
    features: ['Pokemon Lab', 'Your Home', 'Heal Station'],
  },
  'Route 1': {
    description: 'A grassy path connecting Pallet Town to Viridian City.',
    icon: '🌿',
    features: ['Tall Grass', 'Wild Pokemon', 'Trainers'],
  },
  'Viridian City': {
    description: 'A city surrounded by forests. A Pokemon Center heals your team.',
    icon: '🏛️',
    features: ['Pokemon Center', 'Poke Mart', 'Gym (Closed)'],
  },
  'Route 2': {
    description: 'A path through tall grass north of Viridian City.',
    icon: '🌲',
    features: ['Tall Grass', 'Wild Pokemon', 'Bug Catchers'],
  },
}

export function ZoneDisplay() {
  const currentZone = useGameStore((state) => state.currentZone)
  const connectedZones = useGameStore((state) => state.connectedZones)
  const isConnected = useGameStore((state) => state.isConnected)

  if (!currentZone) {
    return (
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]" />
        <div className="relative p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-[#2a2a4a] border-t-[#3B4CCA] animate-spin" />
          <div className="text-[#606080]">Loading zone...</div>
        </div>
      </div>
    )
  }

  const zoneData = ZONE_DATA[currentZone.name] || {
    description: '',
    icon: '📍',
    features: [],
  }
  const isRoute = currentZone.zone_type === 'route'
  const isTown = currentZone.zone_type === 'town'

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Background gradient based on zone type */}
      <div
        className={`absolute inset-0 ${
          isTown ? 'zone-town' : 'zone-route'
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/90 to-[#0f0f1a]/95" />

      {/* Decorative elements */}
      {isRoute && (
        <>
          <div className="absolute top-4 right-4 w-16 h-16 opacity-10">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse" />
          </div>
          <div className="absolute bottom-20 left-4 w-8 h-8 opacity-10">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse delay-300" />
          </div>
        </>
      )}

      {isTown && (
        <div className="absolute top-4 right-4 w-20 h-20 opacity-10">
          <div className="w-full h-full rounded-lg bg-gradient-to-br from-amber-400 to-amber-600" />
        </div>
      )}

      {/* Content */}
      <div className="relative p-5">
        {/* Zone Header */}
        <div className="flex items-start gap-4 mb-5">
          {/* Zone Icon */}
          <div
            className={`
              w-14 h-14 rounded-xl flex items-center justify-center text-2xl
              ${isTown
                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30'
                : 'bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30'
              }
            `}
          >
            {zoneData.icon}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-pixel text-sm text-white tracking-wider">
                {currentZone.name.toUpperCase()}
              </h1>
              <span
                className={`
                  px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                  ${isTown
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }
                `}
              >
                {isTown ? 'Town' : 'Route'}
              </span>
            </div>
            <p className="text-sm text-[#a0a0c0]">{zoneData.description}</p>
          </div>
        </div>

        {/* Zone Info Card */}
        <div className="bg-[#0f0f1a]/60 rounded-xl border border-[#2a2a4a] p-4 mb-5">
          {isRoute ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-[10px] text-[#606080] uppercase tracking-wider mb-1">Level Range</div>
                <div className="font-pixel text-xs text-white">
                  {currentZone.min_level}-{currentZone.max_level}
                </div>
              </div>
              <div className="text-center border-x border-[#2a2a4a]">
                <div className="text-[10px] text-[#606080] uppercase tracking-wider mb-1">Status</div>
                <div className={`font-pixel text-xs flex items-center justify-center gap-1.5 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  {isConnected ? 'Exploring' : 'Offline'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[#606080] uppercase tracking-wider mb-1">Encounters</div>
                <div className="font-pixel text-xs text-green-400">Active</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-pink-600/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div>
                <div className="text-sm text-white font-medium">Pokemon Healed!</div>
                <div className="text-xs text-[#606080]">Your team is restored when resting in town</div>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        {zoneData.features.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {zoneData.features.map((feature) => (
              <span
                key={feature}
                className="px-2.5 py-1 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] text-xs text-[#a0a0c0]"
              >
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* Navigation and Online Players */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Travel Options */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-[#606080]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              <h3 className="text-xs font-semibold text-[#606080] uppercase tracking-wider">Travel</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {connectedZones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => gameSocket.moveToZone(zone.id)}
                  className={`
                    group relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${zone.zone_type === 'town'
                      ? 'bg-gradient-to-b from-amber-500/10 to-amber-600/5 border border-amber-500/30 text-amber-400 hover:from-amber-500/20 hover:to-amber-600/10 hover:border-amber-500/50'
                      : 'bg-gradient-to-b from-green-500/10 to-green-600/5 border border-green-500/30 text-green-400 hover:from-green-500/20 hover:to-green-600/10 hover:border-green-500/50'
                    }
                    hover:scale-105 active:scale-95
                  `}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>{zone.zone_type === 'town' ? '🏠' : '🌿'}</span>
                    <span>{zone.name}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Online Presence */}
          <OnlinePresence />
        </div>
      </div>

      {/* Bottom border accent */}
      <div className={`h-1 ${isTown ? 'bg-gradient-to-r from-transparent via-amber-500/50 to-transparent' : 'bg-gradient-to-r from-transparent via-green-500/50 to-transparent'}`} />

      {/* Shop Panel Modal */}
      <ShopPanel />
    </div>
  )
}
