'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { PokedexPanel } from './PokedexPanel'
import { CurrencyDisplay } from './header/CurrencyDisplay'
import { BadgeCase } from './header/BadgeCase'
import { BattlePassProgress } from './header/BattlePassProgress'
import { TrainerCustomizerModal } from './settings/TrainerCustomizerModal'
import { SpriteTrainer } from './world/SpriteTrainer'

export function Header() {
  const player = useGameStore((state) => state.player)
  const isConnected = useGameStore((state) => state.isConnected)
  const badges = useGameStore((state) => state.badges)
  const seasonProgress = useGameStore((state) => state.seasonProgress)
  const [showPokedex, setShowPokedex] = useState(false)
  const [showCustomizer, setShowCustomizer] = useState(false)

  return (
    <>
      <header className="relative">
        {/* Top red bar - Pokeball style */}
        <div className="h-1.5 bg-gradient-to-r from-[#EE1515] via-[#FF4444] to-[#EE1515]" />

        <div className="glass border-b border-[#2a2a4a] px-4 py-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto gap-4">
            {/* Logo / Title */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Pokeball Logo */}
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#EE1515] to-[#CC0000] overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#f0f0f0] to-[#d0d0d0]" />
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#1a1a2e] -translate-y-1/2" />
                  <div className="absolute top-1/2 left-1/2 w-3.5 h-3.5 bg-[#f0f0f0] rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-[#1a1a2e]">
                    <div className="absolute inset-0.5 bg-white rounded-full" />
                  </div>
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-pixel text-xs text-white tracking-wider">
                  POKEMON
                </h1>
                <p className="text-[9px] text-[#a0a0c0] tracking-widest uppercase">
                  Idle MMO
                </p>
              </div>
            </div>

            {/* Center - Navigation & Status */}
            <div className="hidden lg:flex items-center gap-3 flex-1 justify-center">
              {/* Pokedex Button */}
              <button
                onClick={() => setShowPokedex(true)}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-b from-[#CC0000] to-[#990000] border border-[#FF4444]/30 hover:from-[#EE1515] hover:to-[#CC0000] transition-all duration-200 shadow-lg shadow-red-900/30"
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
                <span className="text-white text-xs font-semibold">Pokedex</span>
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-[#2a2a4a]" />

              {/* Badge Case */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-[#606080] mr-1">Badges:</span>
                <BadgeCase earnedBadges={badges} />
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-[#2a2a4a]" />

              {/* Season Progress */}
              <BattlePassProgress progress={seasonProgress} compact />
            </div>

            {/* Right side - Currency & Profile */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Connection Status (mobile only shows dot) */}
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}
                  title={isConnected ? 'Connected' : 'Disconnected'}
                />
                <span className="hidden sm:inline text-xs text-[#a0a0c0] ml-1.5">
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-[#2a2a4a]" />

              {/* Currency Display */}
              <CurrencyDisplay compact />

              {/* User Profile - Click to customize */}
              {player && (
                <>
                  <div className="hidden sm:block w-px h-6 bg-[#2a2a4a]" />
                  <button
                    onClick={() => setShowCustomizer(true)}
                    className="flex items-center gap-2 pl-1 pr-3 py-0.5 rounded-full bg-gradient-to-r from-[#3B4CCA]/20 to-[#3B4CCA]/10 border border-[#3B4CCA]/30 hover:border-[#5B6EEA]/50 hover:from-[#3B4CCA]/30 transition-all duration-200 group"
                    title="Customize your trainer"
                    aria-label="Open trainer customization"
                  >
                    {/* Mini Trainer Preview */}
                    <div className="w-8 h-8 relative overflow-hidden rounded-full bg-gradient-to-b from-[#87CEEB]/20 to-[#90EE90]/20">
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 scale-[0.6] origin-bottom">
                        <SpriteTrainer
                          direction="right"
                          isWalking={false}
                          scale={2}
                        />
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-white font-medium text-xs leading-tight">{player.username}</span>
                      <span className="text-[9px] text-[#5B6EEA] group-hover:text-[#7B8EFA] transition-colors">Customize</span>
                    </div>
                  </button>
                </>
              )}

              {/* Mobile Pokedex Button */}
              <button
                onClick={() => setShowPokedex(true)}
                className="lg:hidden p-1.5 rounded-lg bg-gradient-to-b from-[#CC0000] to-[#990000] border border-[#FF4444]/30"
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#3B4CCA]/50 to-transparent" />
      </header>

      {/* Pokedex Modal */}
      <PokedexPanel isOpen={showPokedex} onClose={() => setShowPokedex(false)} />

      {/* Trainer Customizer Modal */}
      <TrainerCustomizerModal isOpen={showCustomizer} onClose={() => setShowCustomizer(false)} />
    </>
  )
}
