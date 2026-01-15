'use client'

import { useEffect, useState, useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { createClient } from '@/lib/supabase/client'

// Real components
import { Header } from '@/components/game/Header'
import { WorldView } from '@/components/game/world'
import { EncounterDisplay } from '@/components/game/EncounterDisplay'
import { PartyPanel } from '@/components/game/PartyPanel'
import { TownMenu } from '@/components/game/interactions/TownMenu'
import { WorldLog } from '@/components/game/interactions/WorldLog'
import { ChatSidebar } from '@/components/game/social/ChatSidebar'
import { FriendsList } from '@/components/game/social/FriendsList'
import { AddFriend } from '@/components/game/social/AddFriend'
import { WorldEventsTicker } from '@/components/game/social/WorldEventsTicker'
import { BoxPanel } from '@/components/game/BoxPanel'
import { ShopPanel } from '@/components/game/ShopPanel'
import { GymBattlePanel } from '@/components/game/GymBattlePanel'
import { LevelUpToast } from '@/components/game/LevelUpToast'
import { countOnlineFriends } from '@/lib/utils/friendUtils'

// ============================================================================
// LAYOUT C: "Floating Panels" - Full-screen world with floating, minimizable panels
// ============================================================================

interface Zone {
  id: string
  name: string
  type: 'town' | 'route' | 'forest' | 'cave'
  connections: string[]
  mapX: number
  mapY: number
}

const KANTO_ZONES: Zone[] = [
  { id: '1', name: 'Pallet Town', type: 'town', connections: ['2'], mapX: 18, mapY: 85 },
  { id: '2', name: 'Route 1', type: 'route', connections: ['1', '3'], mapX: 18, mapY: 72 },
  { id: '3', name: 'Viridian City', type: 'town', connections: ['2', '4', '5'], mapX: 18, mapY: 58 },
  { id: '4', name: 'Route 2', type: 'route', connections: ['3', '6'], mapX: 18, mapY: 42 },
  { id: '5', name: 'Route 22', type: 'route', connections: ['3', '12'], mapX: 8, mapY: 58 },
  { id: '6', name: 'Viridian Forest', type: 'forest', connections: ['4', '7'], mapX: 18, mapY: 30 },
  { id: '7', name: 'Pewter City', type: 'town', connections: ['6', '8'], mapX: 18, mapY: 18 },
  { id: '12', name: 'Pokemon League', type: 'town', connections: ['5'], mapX: 8, mapY: 42 },
]

// Floating Panel Component
function FloatingPanel({
  id,
  title,
  icon,
  isOpen,
  onClose,
  position,
  children,
  width = 340
}: {
  id: string
  title: string
  icon: string
  isOpen: boolean
  onClose: () => void
  position: 'left' | 'right' | 'bottom-left' | 'bottom-right'
  children: React.ReactNode
  width?: number
}) {
  if (!isOpen) return null

  const positionStyles: Record<string, React.CSSProperties> = {
    'left': { top: 120, left: 16 },
    'right': { top: 120, right: 16 },
    'bottom-left': { bottom: 80, left: 16 },
    'bottom-right': { bottom: 80, right: 16 },
  }

  return (
    <div className="floating-panel" style={{ ...positionStyles[position], width }}>
      <div className="panel-header">
        <span className="panel-icon">{icon}</span>
        <span className="panel-title">{title}</span>
        <button className="panel-close" onClick={onClose}>×</button>
      </div>
      <div className="panel-body">
        {children}
      </div>
    </div>
  )
}

// Quick Action Bar
function QuickActionBar({
  onToggleMap,
  onToggleParty,
  onToggleChat,
  onToggleFriends,
  onToggleLog,
  activePanel,
  friendsOnline
}: {
  onToggleMap: () => void
  onToggleParty: () => void
  onToggleChat: () => void
  onToggleFriends: () => void
  onToggleLog: () => void
  activePanel: string | null
  friendsOnline: number
}) {
  return (
    <div className="quick-action-bar">
      <button
        className={`action-btn ${activePanel === 'map' ? 'active' : ''}`}
        onClick={onToggleMap}
        title="Map"
      >
        🗺️
      </button>
      <button
        className={`action-btn ${activePanel === 'party' ? 'active' : ''}`}
        onClick={onToggleParty}
        title="Party"
      >
        ⚔️
      </button>
      <button
        className={`action-btn ${activePanel === 'log' ? 'active' : ''}`}
        onClick={onToggleLog}
        title="Activity Log"
      >
        📜
      </button>
      <div className="action-divider" />
      <button
        className={`action-btn ${activePanel === 'chat' ? 'active' : ''}`}
        onClick={onToggleChat}
        title="Chat"
      >
        💬
      </button>
      <button
        className={`action-btn ${activePanel === 'friends' ? 'active' : ''}`}
        onClick={onToggleFriends}
        title="Friends"
      >
        👥
        {friendsOnline > 0 && <span className="action-badge">{friendsOnline}</span>}
      </button>
    </div>
  )
}

// Map Panel Content
function MapPanelContent() {
  const currentZone = useGameStore((state) => state.currentZone)
  const connectedZones = useGameStore((state) => state.connectedZones)

  const currentMapZone = useMemo(() => {
    if (!currentZone) return KANTO_ZONES[0]
    return KANTO_ZONES.find(z => z.name === currentZone.name) || KANTO_ZONES[0]
  }, [currentZone])

  const connectedZoneNames = useMemo(() => connectedZones.map(z => z.name), [connectedZones])

  return (
    <div className="map-panel-content">
      <div className="map-visual">
        <svg className="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {KANTO_ZONES.map(zone =>
            zone.connections.map(connId => {
              const connZone = KANTO_ZONES.find(z => z.id === connId)
              if (!connZone || zone.id > connId) return null
              const isActive = zone.name === currentMapZone.name || connZone.name === currentMapZone.name
              return (
                <line
                  key={`${zone.id}-${connId}`}
                  x1={zone.mapX} y1={zone.mapY}
                  x2={connZone.mapX} y2={connZone.mapY}
                  className={isActive ? 'active' : ''}
                />
              )
            })
          )}
        </svg>
        {KANTO_ZONES.map(zone => {
          const isCurrent = zone.name === currentMapZone.name
          const isConnected = connectedZoneNames.includes(zone.name)
          return (
            <button
              key={zone.id}
              className={`map-dot ${zone.type} ${isCurrent ? 'current' : ''} ${isConnected ? 'connected' : ''}`}
              style={{ left: `${zone.mapX}%`, top: `${zone.mapY}%` }}
              onClick={() => {
                const target = connectedZones.find(z => z.name === zone.name)
                if (target) gameSocket.moveToZone(target.id)
              }}
              disabled={!isConnected && !isCurrent}
            />
          )
        })}
      </div>

      <div className="travel-list">
        <div className="current-location">
          <span className="location-icon">{currentZone?.zone_type === 'town' ? '🏠' : '🌿'}</span>
          <span className="location-name">{currentZone?.name}</span>
        </div>
        <div className="travel-options">
          {connectedZones.map(zone => (
            <button
              key={zone.id}
              className="travel-option"
              onClick={() => gameSocket.moveToZone(zone.id)}
            >
              <span>{zone.zone_type === 'town' ? '🏠' : '🌿'}</span>
              <span>{zone.name}</span>
              <span className="travel-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LayoutCPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activePanel, setActivePanel] = useState<string | null>('party')
  const [showAddFriend, setShowAddFriend] = useState(false)

  const isGameLoading = useGameStore((state) => state.isLoading)
  const reset = useGameStore((state) => state.reset)
  const currentZone = useGameStore((state) => state.currentZone)
  const currentEncounter = useGameStore((state) => state.currentEncounter)
  const worldLog = useGameStore((state) => state.worldLog)
  const worldEvents = useGameStore((state) => state.worldEvents)
  const friends = useGameStore((state) => state.friends)

  const onlineFriendsCount = useMemo(() => countOnlineFriends(friends), [friends])

  useEffect(() => {
    const getSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) setAccessToken(session.access_token)
      setIsLoading(false)
    }
    getSession()
  }, [])

  useEffect(() => {
    if (accessToken) {
      gameSocket.connect(accessToken)
      return () => { gameSocket.disconnect(); reset() }
    }
  }, [accessToken, reset])

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel)
  }

  const isInTown = currentZone?.zone_type === 'town'
  const hasEncounter = currentEncounter !== null

  if (isLoading) return <div className="loading-screen">Checking authentication...</div>
  if (!accessToken) return <div className="loading-screen"><a href="/">Please log in</a></div>
  if (isGameLoading) return <div className="loading-screen">Connecting to server...</div>

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        :root {
          --bg-deep: #0a0a12;
          --bg-dark: #0f0f1a;
          --bg-card: #161625;
          --bg-elevated: #1a1a2e;
          --border-subtle: #2a2a4a;
          --accent-blue: #5B6EEA;
          --accent-gold: #F7D02C;
          --accent-green: #4ade80;
          --accent-red: #EE1515;
          --glass: rgba(15, 15, 26, 0.85);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: var(--bg-deep); color: white; }

        .loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-deep);
          color: white;
        }

        /* ========== LAYOUT C: FLOATING PANELS ========== */
        .layout-c {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        /* Full Screen World */
        .world-fullscreen {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          overflow: hidden;
        }

        .world-container {
          width: 100%;
          max-width: 1000px;
        }

        .world-container > * + * {
          margin-top: 24px;
        }

        /* Quick Action Bar */
        .quick-action-bar {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--glass);
          backdrop-filter: blur(16px);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          z-index: 200;
        }

        .action-btn {
          position: relative;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 2px solid transparent;
          border-radius: 12px;
          font-size: 22px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: var(--bg-elevated);
          border-color: var(--border-subtle);
        }

        .action-btn.active {
          background: var(--accent-blue);
          border-color: var(--accent-blue);
        }

        .action-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          background: var(--accent-green);
          border-radius: 8px;
          font-size: 10px;
          font-weight: 700;
          color: var(--bg-deep);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-divider {
          width: 1px;
          height: 32px;
          background: var(--border-subtle);
          margin: 0 4px;
        }

        /* Floating Panels */
        .floating-panel {
          position: fixed;
          background: var(--glass);
          backdrop-filter: blur(16px);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          z-index: 150;
          overflow: hidden;
          animation: panelSlideIn 0.3s ease;
        }

        @keyframes panelSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-subtle);
        }

        .panel-icon { font-size: 18px; }
        .panel-title { flex: 1; font-weight: 600; font-size: 14px; }

        .panel-close {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #606080;
          font-size: 18px;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .panel-close:hover {
          background: var(--accent-red);
          color: white;
        }

        .panel-body {
          max-height: 400px;
          overflow-y: auto;
        }

        /* Map Panel */
        .map-panel-content {
          display: flex;
          flex-direction: column;
        }

        .map-visual {
          position: relative;
          height: 180px;
          background: linear-gradient(180deg, #1a4a1a 0%, #0d2d0d 50%, #2a4a5a 100%);
        }

        .map-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .map-lines line {
          stroke: rgba(255,255,255,0.2);
          stroke-width: 1;
        }

        .map-lines line.active {
          stroke: var(--accent-blue);
          stroke-width: 2;
        }

        .map-dot {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          transform: translate(-50%, -50%);
          cursor: pointer;
          transition: all 0.2s;
        }

        .map-dot.town { background: var(--accent-red); }
        .map-dot.route { background: #3B82F6; width: 8px; height: 8px; }
        .map-dot.forest { background: var(--accent-green); }
        .map-dot:disabled { opacity: 0.3; cursor: not-allowed; }
        .map-dot.current {
          width: 16px; height: 16px;
          border: 2px solid var(--accent-gold);
          box-shadow: 0 0 12px var(--accent-gold);
        }
        .map-dot.connected:not(:disabled):hover { transform: translate(-50%, -50%) scale(1.5); }

        .travel-list {
          padding: 12px;
        }

        .current-location {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--accent-blue);
          border-radius: 10px;
          margin-bottom: 12px;
        }

        .location-icon { font-size: 18px; }
        .location-name { font-weight: 600; font-size: 14px; }

        .travel-options {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .travel-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .travel-option:hover {
          border-color: var(--accent-blue);
          background: var(--bg-card);
        }

        .travel-arrow {
          margin-left: auto;
          color: var(--accent-blue);
        }

        /* Friends Panel */
        .friends-panel-content {
          padding: 12px;
        }

        .friends-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .friends-header span {
          font-size: 12px;
          color: var(--accent-green);
        }

        .add-btn {
          padding: 6px 12px;
          background: var(--accent-blue);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 11px;
          cursor: pointer;
        }

        /* Label */
        .layout-label {
          position: fixed;
          top: 100px;
          right: 16px;
          background: var(--accent-gold);
          color: var(--bg-deep);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          z-index: 100;
        }
      `}</style>

      <div className="layout-c">
        <Header />
        <WorldEventsTicker events={worldEvents} />

        {/* Full Screen World View */}
        <div className="world-fullscreen">
          <div className="world-container">
            {!hasEncounter ? <WorldView /> : <EncounterDisplay />}
            {isInTown && !hasEncounter && <TownMenu />}
          </div>
        </div>

        {/* Quick Action Bar */}
        <QuickActionBar
          onToggleMap={() => togglePanel('map')}
          onToggleParty={() => togglePanel('party')}
          onToggleChat={() => togglePanel('chat')}
          onToggleFriends={() => togglePanel('friends')}
          onToggleLog={() => togglePanel('log')}
          activePanel={activePanel}
          friendsOnline={onlineFriendsCount}
        />

        {/* Floating Panels */}
        <FloatingPanel
          id="map"
          title="Kanto Map"
          icon="🗺️"
          isOpen={activePanel === 'map'}
          onClose={() => setActivePanel(null)}
          position="left"
          width={320}
        >
          <MapPanelContent />
        </FloatingPanel>

        <FloatingPanel
          id="party"
          title="Party"
          icon="⚔️"
          isOpen={activePanel === 'party'}
          onClose={() => setActivePanel(null)}
          position="right"
          width={360}
        >
          <PartyPanel />
        </FloatingPanel>

        <FloatingPanel
          id="log"
          title="Activity Log"
          icon="📜"
          isOpen={activePanel === 'log'}
          onClose={() => setActivePanel(null)}
          position="bottom-left"
          width={400}
        >
          <WorldLog entries={worldLog} />
        </FloatingPanel>

        <FloatingPanel
          id="chat"
          title="Chat"
          icon="💬"
          isOpen={activePanel === 'chat'}
          onClose={() => setActivePanel(null)}
          position="bottom-right"
          width={340}
        >
          <ChatSidebar isCollapsed={false} />
        </FloatingPanel>

        <FloatingPanel
          id="friends"
          title="Friends"
          icon="👥"
          isOpen={activePanel === 'friends'}
          onClose={() => setActivePanel(null)}
          position="right"
          width={320}
        >
          <div className="friends-panel-content">
            <div className="friends-header">
              <span>{onlineFriendsCount} online</span>
              <button className="add-btn" onClick={() => setShowAddFriend(!showAddFriend)}>+ Add</button>
            </div>
            {showAddFriend && <AddFriend onClose={() => setShowAddFriend(false)} />}
            <FriendsList friends={friends} />
          </div>
        </FloatingPanel>

        <div className="layout-label">Layout C: Floating Panels</div>
      </div>

      <BoxPanel />
      <ShopPanel />
      <GymBattlePanel />
      <LevelUpToast />
    </>
  )
}
