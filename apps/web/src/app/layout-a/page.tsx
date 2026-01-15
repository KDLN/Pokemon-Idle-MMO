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
// LAYOUT A: "Hub & Spoke" - Clean version with mini map & tabbed dock
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
  { id: '2', name: 'Route 1', type: 'route', connections: ['1', '3'], mapX: 18, mapY: 70 },
  { id: '3', name: 'Viridian City', type: 'town', connections: ['2', '4', '5'], mapX: 18, mapY: 55 },
  { id: '4', name: 'Route 2', type: 'route', connections: ['3', '6'], mapX: 18, mapY: 40 },
  { id: '5', name: 'Route 22', type: 'route', connections: ['3', '12'], mapX: 8, mapY: 55 },
  { id: '6', name: 'Viridian Forest', type: 'forest', connections: ['4', '7'], mapX: 18, mapY: 25 },
  { id: '7', name: 'Pewter City', type: 'town', connections: ['6', '8'], mapX: 18, mapY: 12 },
  { id: '8', name: 'Route 3', type: 'route', connections: ['7', '9'], mapX: 40, mapY: 12 },
  { id: '9', name: 'Mt. Moon', type: 'cave', connections: ['8', '10'], mapX: 55, mapY: 12 },
  { id: '10', name: 'Route 4', type: 'route', connections: ['9', '11'], mapX: 70, mapY: 12 },
  { id: '11', name: 'Cerulean City', type: 'town', connections: ['10'], mapX: 85, mapY: 12 },
  { id: '12', name: 'Pokemon League', type: 'town', connections: ['5'], mapX: 8, mapY: 40 },
]

// Compact Mini Map
function MiniMap({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const currentZone = useGameStore((state) => state.currentZone)
  const connectedZones = useGameStore((state) => state.connectedZones)

  const currentMapZone = useMemo(() => {
    if (!currentZone) return KANTO_ZONES[0]
    return KANTO_ZONES.find(z => z.name === currentZone.name) || KANTO_ZONES[0]
  }, [currentZone])

  const connectedZoneNames = useMemo(() => connectedZones.map(z => z.name), [connectedZones])

  const handleZoneClick = (zone: Zone) => {
    const targetZone = connectedZones.find(z => z.name === zone.name)
    if (targetZone) gameSocket.moveToZone(targetZone.id)
  }

  return (
    <div className={`mini-map ${isOpen ? 'open' : ''}`}>
      <button className="map-header" onClick={onToggle}>
        <span className="map-icon">🗺️</span>
        <span className="map-title">{currentZone?.name || 'Map'}</span>
        <span className="map-chevron">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="map-body">
          <div className="map-canvas">
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
                  className={`zone-dot ${zone.type} ${isCurrent ? 'current' : ''} ${isConnected ? 'connected' : ''}`}
                  style={{ left: `${zone.mapX}%`, top: `${zone.mapY}%` }}
                  onClick={() => isConnected && handleZoneClick(zone)}
                  disabled={!isConnected && !isCurrent}
                  title={zone.name}
                />
              )
            })}
          </div>

          {/* Quick travel */}
          <div className="quick-travel">
            {connectedZones.map(zone => (
              <button
                key={zone.id}
                className="travel-btn"
                onClick={() => gameSocket.moveToZone(zone.id)}
              >
                {zone.zone_type === 'town' ? '🏠' : '🌿'} {zone.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Bottom Dock
function BottomDock() {
  const [activeTab, setActiveTab] = useState<'party' | 'log' | 'chat' | 'friends'>('party')
  const worldLog = useGameStore((state) => state.worldLog)
  const friends = useGameStore((state) => state.friends)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const onlineFriendsCount = useMemo(() => countOnlineFriends(friends), [friends])

  return (
    <div className="bottom-dock">
      <div className="dock-tabs">
        {[
          { id: 'party', icon: '⚔️', label: 'Party' },
          { id: 'log', icon: '📜', label: 'Log' },
          { id: 'chat', icon: '💬', label: 'Chat' },
          { id: 'friends', icon: '👥', label: 'Friends', badge: onlineFriendsCount },
        ].map(tab => (
          <button
            key={tab.id}
            className={`dock-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge ? <span className="tab-badge">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      <div className="dock-content">
        {activeTab === 'party' && <PartyPanel />}
        {activeTab === 'log' && <WorldLog entries={worldLog} />}
        {activeTab === 'chat' && <ChatSidebar isCollapsed={false} />}
        {activeTab === 'friends' && (
          <div className="friends-panel">
            <div className="friends-toolbar">
              <span className="online-count">{onlineFriendsCount} online</span>
              <button className="add-btn" onClick={() => setShowAddFriend(!showAddFriend)}>+ Add</button>
            </div>
            {showAddFriend && <AddFriend onClose={() => setShowAddFriend(false)} />}
            <FriendsList friends={friends} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function LayoutAPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapOpen, setMapOpen] = useState(false)

  const isGameLoading = useGameStore((state) => state.isLoading)
  const reset = useGameStore((state) => state.reset)
  const currentZone = useGameStore((state) => state.currentZone)
  const currentEncounter = useGameStore((state) => state.currentEncounter)
  const worldEvents = useGameStore((state) => state.worldEvents)

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

  const isInTown = currentZone?.zone_type === 'town'
  const hasEncounter = currentEncounter !== null

  if (isLoading) return <div className="loading">Checking authentication...</div>
  if (!accessToken) return <div className="loading"><a href="/">Please log in</a></div>
  if (isGameLoading) return <div className="loading">Connecting...</div>

  return (
    <>
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: #080810;
          color: #e0e0f0;
        }

        .loading {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
        }

        /* ===== LAYOUT A: HUB & SPOKE ===== */
        .layout-a {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        /* Center Stage */
        .center-stage {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          overflow-y: auto;
          min-height: 0;
        }

        .game-area {
          width: 100%;
          max-width: 860px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Mini Map */
        .mini-map {
          position: fixed;
          top: 90px;
          left: 12px;
          width: 200px;
          background: #12121f;
          border: 1px solid #252540;
          border-radius: 10px;
          overflow: hidden;
          z-index: 100;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }

        .map-header {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          background: #1a1a2e;
          border: none;
          color: #e0e0f0;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .map-header:hover { background: #222240; }
        .map-icon { font-size: 14px; }
        .map-title { flex: 1; text-align: left; }
        .map-chevron { font-size: 8px; opacity: 0.5; }

        .map-body {
          border-top: 1px solid #252540;
        }

        .map-canvas {
          position: relative;
          height: 140px;
          background: linear-gradient(180deg, #1a3a1a 0%, #0d2010 50%, #1a2a3a 100%);
        }

        .map-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .map-lines line {
          stroke: rgba(255,255,255,0.15);
          stroke-width: 1;
        }

        .map-lines line.active {
          stroke: #5B6EEA;
          stroke-width: 2;
        }

        .zone-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          transform: translate(-50%, -50%);
          cursor: pointer;
          transition: all 0.15s;
        }

        .zone-dot.town { background: #EE1515; }
        .zone-dot.route { background: #3B82F6; width: 6px; height: 6px; }
        .zone-dot.forest { background: #22C55E; }
        .zone-dot.cave { background: #6B7280; }
        .zone-dot:disabled { opacity: 0.25; cursor: not-allowed; }
        .zone-dot.current {
          width: 12px;
          height: 12px;
          border: 2px solid #F7D02C;
          box-shadow: 0 0 8px #F7D02C;
        }
        .zone-dot.connected:not(:disabled):hover {
          transform: translate(-50%, -50%) scale(1.4);
        }

        .quick-travel {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding: 8px;
          background: #0d0d18;
        }

        .travel-btn {
          padding: 5px 8px;
          background: #1a1a2e;
          border: 1px solid #252540;
          border-radius: 6px;
          color: #c0c0d0;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .travel-btn:hover {
          background: #252540;
          border-color: #5B6EEA;
          color: white;
        }

        /* Bottom Dock */
        .bottom-dock {
          background: #0d0d18;
          border-top: 1px solid #252540;
          display: flex;
          flex-direction: column;
          height: 280px;
          flex-shrink: 0;
        }

        .dock-tabs {
          display: flex;
          background: #12121f;
          border-bottom: 1px solid #252540;
        }

        .dock-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #707090;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .dock-tab:hover {
          color: #c0c0d0;
          background: #1a1a2e;
        }

        .dock-tab.active {
          color: white;
          border-bottom-color: #5B6EEA;
          background: #1a1a2e;
        }

        .tab-badge {
          background: #4ade80;
          color: #080810;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 8px;
        }

        .dock-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          min-height: 0;
        }

        .friends-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .friends-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .online-count {
          font-size: 11px;
          color: #4ade80;
        }

        .add-btn {
          padding: 4px 10px;
          background: #5B6EEA;
          border: none;
          border-radius: 5px;
          color: white;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        .add-btn:hover { background: #7080f0; }

        /* Layout Label */
        .layout-label {
          position: fixed;
          bottom: 290px;
          right: 12px;
          background: #5B6EEA;
          color: white;
          padding: 4px 10px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 600;
          z-index: 100;
        }
      `}</style>

      <div className="layout-a">
        <Header />
        <WorldEventsTicker events={worldEvents} />

        <div className="center-stage">
          <MiniMap isOpen={mapOpen} onToggle={() => setMapOpen(!mapOpen)} />

          <div className="game-area">
            {!hasEncounter ? <WorldView /> : <EncounterDisplay />}
            {isInTown && !hasEncounter && <TownMenu />}
          </div>
        </div>

        <BottomDock />
        <div className="layout-label">Layout A</div>
      </div>

      <BoxPanel />
      <ShopPanel />
      <GymBattlePanel />
      <LevelUpToast />
    </>
  )
}
