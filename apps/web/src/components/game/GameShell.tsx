'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { Header } from './Header'
import { ZoneDisplay } from './ZoneDisplay'
import { EncounterDisplay } from './EncounterDisplay'
import { PartyPanel } from './PartyPanel'
import { BoxPanel } from './BoxPanel'
import { LevelUpToast } from './LevelUpToast'
import { WorldView } from './world'
import { WorldEventsTicker } from './social/WorldEventsTicker'
import { ChatSidebar } from './social/ChatSidebar'
import { FriendsPanel } from './social/FriendsPanel'
import { TradesPanel } from './social/TradesPanel'
import { TownMenu } from './interactions/TownMenu'
import { WorldLog, createLogEntry } from './interactions/WorldLog'
import { ShopPanel } from './ShopPanel'
import { GymBattlePanel } from './GymBattlePanel'
import { MuseumPanel } from './interactions/MuseumPanel'

interface GameShellProps {
  accessToken: string
}

export function GameShell({ accessToken }: GameShellProps) {
  const isLoading = useGameStore((state) => state.isLoading)
  const reset = useGameStore((state) => state.reset)
  const currentZone = useGameStore((state) => state.currentZone)
  const currentEncounter = useGameStore((state) => state.currentEncounter)
  const worldLog = useGameStore((state) => state.worldLog)
  const worldEvents = useGameStore((state) => state.worldEvents)
  const addLogEntry = useGameStore((state) => state.addLogEntry)

  // Start with chat, friends, and trades collapsed on mobile
  const [isChatCollapsed, setIsChatCollapsed] = useState(true)
  const [isFriendsCollapsed, setIsFriendsCollapsed] = useState(true)
  const [isTradesCollapsed, setIsTradesCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Connect to game server
    gameSocket.connect(accessToken)

    // Cleanup on unmount
    return () => {
      gameSocket.disconnect()
      reset()
    }
  }, [accessToken, reset])

  // Add welcome log entry on load
  useEffect(() => {
    if (!isLoading && worldLog.length === 0) {
      addLogEntry(createLogEntry('system', 'Welcome to Pokemon Idle MMO!', '👋'))
    }
  }, [isLoading, worldLog.length, addLogEntry])

  // Determine if we should show WorldView or Encounter
  const isInTown = currentZone?.zone_type === 'town'
  const hasEncounter = currentEncounter !== null
  const showWorldView = !hasEncounter

  if (isLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[#0f0f1a] flex items-center justify-center p-4">
        <div className="text-center">
          {/* Pokeball loading spinner */}
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#EE1515] to-[#CC0000] overflow-hidden animate-spin">
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#f0f0f0] to-[#d0d0d0]" />
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#1a1a2e] -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-[#f0f0f0] rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-[#1a1a2e]" />
            </div>
          </div>
          <div className="font-pixel text-sm text-white tracking-wider mb-2">LOADING</div>
          <div className="text-[#606080] text-sm">Connecting to server...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#0f0f1a] text-white flex flex-col overflow-x-hidden">
      {/* Header with badges, currency, season progress */}
      <Header />

      {/* World Events Ticker */}
      <WorldEventsTicker events={worldEvents} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full px-3 sm:px-4 pb-4">
        {/* Left/Main Column - Game Area */}
        <div className="flex-1 space-y-3 sm:space-y-4 min-w-0 py-3 sm:py-4">
          {/* World View / Encounter Area */}
          <div className="relative">
            {showWorldView ? (
              <WorldView />
            ) : (
              <EncounterDisplay />
            )}
          </div>

          {/* Town Menu (only in towns) */}
          {isInTown && !hasEncounter && (
            <TownMenu />
          )}

          {/* Zone Navigation */}
          <ZoneDisplay />

          {/* World Log - hide on mobile to save space */}
          <div className="hidden sm:block">
            <WorldLog entries={worldLog} />
          </div>
        </div>

        {/* Right Sidebar - Party & Chat */}
        <div className="w-full lg:w-80 xl:w-96 lg:pl-4 space-y-3 sm:space-y-4 flex flex-col py-3 sm:py-4 lg:py-4">
          {/* Party Panel */}
          <PartyPanel />

          {/* Chat Sidebar - Full on desktop, collapsible on mobile */}
          {!isMobile && (
            <div className="flex-1 min-h-[280px]">
              <ChatSidebar
                isCollapsed={false}
                onToggle={() => {}}
              />
            </div>
          )}
        </div>
      </main>

      {/* Floating UI */}
      <BoxPanel />
      <ShopPanel />
      <GymBattlePanel />
      <MuseumPanel />
      <LevelUpToast />

      {/* Friends Panel - floating */}
      <FriendsPanel
        isCollapsed={isFriendsCollapsed}
        onToggle={() => setIsFriendsCollapsed(!isFriendsCollapsed)}
      />

      {/* Trades Panel - floating */}
      <TradesPanel
        isCollapsed={isTradesCollapsed}
        onToggle={() => setIsTradesCollapsed(!isTradesCollapsed)}
      />

      {/* Mobile Chat Toggle Button */}
      {isMobile && (
        <ChatSidebar
          isCollapsed={isChatCollapsed}
          onToggle={() => setIsChatCollapsed(!isChatCollapsed)}
        />
      )}
    </div>
  )
}
