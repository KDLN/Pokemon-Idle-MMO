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
import { FriendRequests } from '@/components/game/social/FriendRequests'
import { AddFriend } from '@/components/game/social/AddFriend'
import { WorldEventsTicker } from '@/components/game/social/WorldEventsTicker'
import { BoxPanel } from '@/components/game/BoxPanel'
import { ShopPanel } from '@/components/game/ShopPanel'
import { GymBattlePanel } from '@/components/game/GymBattlePanel'
import { LevelUpToast } from '@/components/game/LevelUpToast'
import { countOnlineFriends } from '@/lib/utils/friendUtils'

// ============================================================================
// TYPES
// ============================================================================

interface Zone {
  id: string
  name: string
  type: 'town' | 'route' | 'forest' | 'cave'
  levelRange?: { min: number; max: number }
  connections: string[]
  mapX: number
  mapY: number
}

// Kanto map layout - positions are percentages on the map
const KANTO_ZONES: Zone[] = [
  { id: '1', name: 'Pallet Town', type: 'town', connections: ['2'], mapX: 18, mapY: 85 },
  { id: '2', name: 'Route 1', type: 'route', levelRange: { min: 2, max: 5 }, connections: ['1', '3'], mapX: 18, mapY: 72 },
  { id: '3', name: 'Viridian City', type: 'town', connections: ['2', '4', '5'], mapX: 18, mapY: 58 },
  { id: '4', name: 'Route 2', type: 'route', levelRange: { min: 3, max: 6 }, connections: ['3', '6'], mapX: 18, mapY: 42 },
  { id: '5', name: 'Route 22', type: 'route', levelRange: { min: 3, max: 7 }, connections: ['3', '12'], mapX: 8, mapY: 58 },
  { id: '6', name: 'Viridian Forest', type: 'forest', levelRange: { min: 4, max: 8 }, connections: ['4', '7'], mapX: 18, mapY: 30 },
  { id: '7', name: 'Pewter City', type: 'town', connections: ['6', '8'], mapX: 18, mapY: 18 },
  { id: '8', name: 'Route 3', type: 'route', levelRange: { min: 6, max: 12 }, connections: ['7', '9'], mapX: 35, mapY: 18 },
  { id: '9', name: 'Mt. Moon', type: 'cave', levelRange: { min: 8, max: 14 }, connections: ['8', '10'], mapX: 50, mapY: 18 },
  { id: '10', name: 'Route 4', type: 'route', levelRange: { min: 10, max: 16 }, connections: ['9', '11'], mapX: 65, mapY: 18 },
  { id: '11', name: 'Cerulean City', type: 'town', connections: ['10', '13', '14', '15'], mapX: 78, mapY: 18 },
  { id: '12', name: 'Pokemon League', type: 'town', connections: ['5'], mapX: 8, mapY: 42 },
  { id: '13', name: 'Route 24', type: 'route', levelRange: { min: 10, max: 14 }, connections: ['11', '16'], mapX: 78, mapY: 8 },
  { id: '14', name: 'Route 5', type: 'route', levelRange: { min: 12, max: 16 }, connections: ['11', '17'], mapX: 78, mapY: 35 },
  { id: '15', name: 'Route 9', type: 'route', levelRange: { min: 14, max: 18 }, connections: ['11', '18'], mapX: 88, mapY: 18 },
  { id: '16', name: "Bill's House", type: 'town', connections: ['13'], mapX: 92, mapY: 8 },
  { id: '17', name: 'Saffron City', type: 'town', connections: ['14', '19', '20', '21'], mapX: 78, mapY: 50 },
  { id: '18', name: 'Rock Tunnel', type: 'cave', levelRange: { min: 15, max: 20 }, connections: ['15', '22'], mapX: 92, mapY: 30 },
  { id: '19', name: 'Route 7', type: 'route', levelRange: { min: 18, max: 22 }, connections: ['17', '23'], mapX: 62, mapY: 50 },
  { id: '20', name: 'Route 8', type: 'route', levelRange: { min: 18, max: 22 }, connections: ['17', '22'], mapX: 88, mapY: 50 },
  { id: '21', name: 'Route 6', type: 'route', levelRange: { min: 14, max: 18 }, connections: ['17', '24'], mapX: 78, mapY: 65 },
  { id: '22', name: 'Lavender Town', type: 'town', connections: ['18', '20', '25'], mapX: 92, mapY: 50 },
  { id: '23', name: 'Celadon City', type: 'town', connections: ['19', '26'], mapX: 50, mapY: 50 },
  { id: '24', name: 'Vermilion City', type: 'town', connections: ['21', '27'], mapX: 78, mapY: 78 },
  { id: '25', name: 'Route 12', type: 'route', levelRange: { min: 22, max: 28 }, connections: ['22', '28'], mapX: 92, mapY: 65 },
  { id: '26', name: 'Route 16', type: 'route', levelRange: { min: 20, max: 26 }, connections: ['23', '29'], mapX: 35, mapY: 50 },
  { id: '27', name: 'Route 11', type: 'route', levelRange: { min: 18, max: 24 }, connections: ['24', '28'], mapX: 88, mapY: 78 },
  { id: '28', name: 'Route 13', type: 'route', levelRange: { min: 24, max: 30 }, connections: ['25', '27', '30'], mapX: 92, mapY: 85 },
  { id: '29', name: 'Cycling Road', type: 'route', levelRange: { min: 22, max: 28 }, connections: ['26', '31'], mapX: 35, mapY: 70 },
  { id: '30', name: 'Fuchsia City', type: 'town', connections: ['28', '31', '32'], mapX: 62, mapY: 85 },
  { id: '31', name: 'Route 18', type: 'route', levelRange: { min: 26, max: 32 }, connections: ['29', '30'], mapX: 45, mapY: 85 },
  { id: '32', name: 'Route 19', type: 'route', levelRange: { min: 28, max: 35 }, connections: ['30', '33'], mapX: 50, mapY: 92 },
  { id: '33', name: 'Cinnabar Island', type: 'town', connections: ['32', '34'], mapX: 18, mapY: 92 },
  { id: '34', name: 'Route 21', type: 'route', levelRange: { min: 28, max: 35 }, connections: ['33', '1'], mapX: 18, mapY: 92 },
]

// ============================================================================
// KANTO MAP COMPONENT
// ============================================================================

function KantoMapColumn() {
  const currentZone = useGameStore((state) => state.currentZone)
  const connectedZones = useGameStore((state) => state.connectedZones)
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null)

  // Map current zone name to our KANTO_ZONES
  const currentMapZone = useMemo(() => {
    if (!currentZone) return KANTO_ZONES[0]
    return KANTO_ZONES.find(z => z.name === currentZone.name) || KANTO_ZONES[0]
  }, [currentZone])

  const connectedZoneNames = useMemo(() => {
    return connectedZones.map(z => z.name)
  }, [connectedZones])

  // Draw connection lines between zones
  const getConnectionLines = () => {
    const lines: { x1: number; y1: number; x2: number; y2: number; connected: boolean }[] = []
    const drawnPairs = new Set<string>()

    KANTO_ZONES.forEach(zone => {
      zone.connections.forEach(connId => {
        const pairKey = [zone.id, connId].sort().join('-')
        if (drawnPairs.has(pairKey)) return
        drawnPairs.add(pairKey)

        const connZone = KANTO_ZONES.find(z => z.id === connId)
        if (connZone) {
          const isConnectedToCurrent = zone.name === currentMapZone.name || connZone.name === currentMapZone.name
          lines.push({
            x1: zone.mapX,
            y1: zone.mapY,
            x2: connZone.mapX,
            y2: connZone.mapY,
            connected: isConnectedToCurrent
          })
        }
      })
    })
    return lines
  }

  const handleZoneClick = (zone: Zone) => {
    // Find the actual connected zone and move to it
    const targetZone = connectedZones.find(z => z.name === zone.name)
    if (targetZone) {
      gameSocket.moveToZone(targetZone.id)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Map Container */}
      <div className="kanto-map">
        {/* Map Title */}
        <div className="map-title">KANTO</div>

        {/* Connection Lines SVG */}
        <svg className="map-lines">
          {getConnectionLines().map((line, i) => (
            <line
              key={i}
              x1={`${line.x1}%`}
              y1={`${line.y1}%`}
              x2={`${line.x2}%`}
              y2={`${line.y2}%`}
              className={`map-connection ${line.connected ? 'connected' : ''}`}
            />
          ))}
        </svg>

        {/* Zone Markers */}
        {KANTO_ZONES.map(zone => {
          const isCurrent = zone.name === currentMapZone.name
          const isConnected = connectedZoneNames.includes(zone.name)
          const isHovered = hoveredZone?.id === zone.id

          return (
            <button
              key={zone.id}
              className={`map-marker ${zone.type} ${isCurrent ? 'current' : ''} ${isConnected ? 'connected' : ''} ${isHovered ? 'hovered' : ''}`}
              style={{ left: `${zone.mapX}%`, top: `${zone.mapY}%` }}
              onClick={() => isConnected && handleZoneClick(zone)}
              onMouseEnter={() => setHoveredZone(zone)}
              onMouseLeave={() => setHoveredZone(null)}
              disabled={!isConnected && !isCurrent}
            >
              <span className="marker-icon">
                {zone.type === 'town' ? '●' : zone.type === 'cave' ? '▲' : zone.type === 'forest' ? '♣' : '○'}
              </span>
            </button>
          )
        })}

        {/* Hover Tooltip */}
        {hoveredZone && (
          <div
            className="map-tooltip"
            style={{
              left: `${Math.min(hoveredZone.mapX + 5, 75)}%`,
              top: `${hoveredZone.mapY}%`
            }}
          >
            <div className="tooltip-name">{hoveredZone.name}</div>
            {hoveredZone.levelRange && (
              <div className="tooltip-level">Lv. {hoveredZone.levelRange.min}-{hoveredZone.levelRange.max}</div>
            )}
            {connectedZoneNames.includes(hoveredZone.name) && (
              <div className="tooltip-action">Click to travel</div>
            )}
          </div>
        )}

        {/* Map Legend */}
        <div className="map-legend">
          <div className="legend-item"><span className="legend-marker town">●</span> Town</div>
          <div className="legend-item"><span className="legend-marker route">○</span> Route</div>
          <div className="legend-item"><span className="legend-marker cave">▲</span> Cave</div>
          <div className="legend-item"><span className="legend-marker forest">♣</span> Forest</div>
        </div>
      </div>

      {/* Current Zone Info */}
      {currentZone && (
        <div className="current-zone-panel">
          <div className="current-zone-icon">
            {currentZone.zone_type === 'town' ? '🏘️' : currentZone.name.toLowerCase().includes('forest') ? '🌲' : currentZone.name.toLowerCase().includes('cave') || currentZone.name.toLowerCase().includes('tunnel') || currentZone.name.toLowerCase().includes('moon') ? '🗻' : '🛤️'}
          </div>
          <div className="current-zone-info">
            <div className="current-zone-name">{currentZone.name}</div>
            {currentZone.zone_type === 'route' && (
              <div className="current-zone-level">Lv. {currentZone.min_level}-{currentZone.max_level}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SOCIAL COLUMN (COMBINED CHAT + FRIENDS)
// ============================================================================

function SocialColumn() {
  const [activeTab, setActiveTab] = useState<'chat' | 'friends'>('chat')
  const [friendsSubTab, setFriendsSubTab] = useState<'list' | 'requests'>('list')
  const [showAddFriend, setShowAddFriend] = useState(false)

  const friends = useGameStore((state) => state.friends)
  const incomingRequests = useGameStore((state) => state.incomingFriendRequests)
  const outgoingRequests = useGameStore((state) => state.outgoingFriendRequests)
  const isConnected = useGameStore((state) => state.isConnected)

  const onlineFriendsCount = useMemo(() => countOnlineFriends(friends), [friends])
  const totalRequests = incomingRequests.length + outgoingRequests.length

  // Fetch friends on connect
  useEffect(() => {
    if (isConnected) {
      gameSocket.getFriends()
    }
  }, [isConnected])

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="social-tabs">
        <button
          className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <span className="tab-icon">💬</span>
          <span>Chat</span>
        </button>
        <button
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <span className="tab-icon">👥</span>
          <span>Friends</span>
          {onlineFriendsCount > 0 && (
            <span className="online-badge">{onlineFriendsCount}</span>
          )}
        </button>
      </div>

      {/* Chat Panel - Using real ChatSidebar internals */}
      {activeTab === 'chat' && (
        <div className="flex-1 min-h-0">
          <ChatSidebar isCollapsed={false} />
        </div>
      )}

      {/* Friends Panel */}
      {activeTab === 'friends' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] overflow-hidden">
          {/* Add Friend Button */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a4a]">
            <span className="text-xs text-[#4ade80]">{onlineFriendsCount} online</span>
            <button
              onClick={() => setShowAddFriend(!showAddFriend)}
              className="p-1.5 text-[#606080] hover:text-[#5B6EEA] transition-colors rounded hover:bg-[#2a2a4a]"
              title="Add Friend"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
          </div>

          {/* Add Friend Form */}
          {showAddFriend && (
            <AddFriend onClose={() => setShowAddFriend(false)} />
          )}

          {/* Sub-tabs */}
          <div className="flex border-b border-[#2a2a4a]">
            <button
              onClick={() => setFriendsSubTab('list')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                friendsSubTab === 'list'
                  ? 'text-[#5B6EEA] border-b-2 border-[#5B6EEA]'
                  : 'text-[#606080] hover:text-white'
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setFriendsSubTab('requests')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors relative ${
                friendsSubTab === 'requests'
                  ? 'text-[#5B6EEA] border-b-2 border-[#5B6EEA]'
                  : 'text-[#606080] hover:text-white'
              }`}
            >
              Requests
              {totalRequests > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
                  {totalRequests}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {friendsSubTab === 'list' ? (
              <FriendsList friends={friends} />
            ) : (
              <FriendRequests
                incoming={incomingRequests}
                outgoing={outgoingRequests}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function LayoutTestPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isGameLoading = useGameStore((state) => state.isLoading)
  const reset = useGameStore((state) => state.reset)
  const currentZone = useGameStore((state) => state.currentZone)
  const currentEncounter = useGameStore((state) => state.currentEncounter)
  const worldLog = useGameStore((state) => state.worldLog)
  const worldEvents = useGameStore((state) => state.worldEvents)

  // Get session on mount
  useEffect(() => {
    const getSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        setAccessToken(session.access_token)
      }
      setIsLoading(false)
    }
    getSession()
  }, [])

  // Connect to game server
  useEffect(() => {
    if (accessToken) {
      gameSocket.connect(accessToken)
      return () => {
        gameSocket.disconnect()
        reset()
      }
    }
  }, [accessToken, reset])

  const isInTown = currentZone?.zone_type === 'town'
  const hasEncounter = currentEncounter !== null
  const showWorldView = !hasEncounter

  // Auth check loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-white">Checking authentication...</div>
      </div>
    )
  }

  // Not authenticated
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Please log in to view the layout test</div>
          <a href="/" className="text-[#5B6EEA] hover:underline">Go to Login</a>
        </div>
      </div>
    )
  }

  // Game loading
  if (isGameLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#EE1515] to-[#CC0000] overflow-hidden animate-spin">
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#f0f0f0] to-[#d0d0d0]" />
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#1a1a2e] -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-[#f0f0f0] rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-[#1a1a2e]" />
            </div>
          </div>
          <div className="text-white">Connecting to server...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Space+Mono:wght@400;700&display=swap');

        :root {
          --bg-deep: #0a0a12;
          --bg-dark: #0f0f1a;
          --bg-card: #161625;
          --bg-elevated: #1a1a2e;
          --border-subtle: #2a2a4a;
          --border-accent: #3d3d6b;
          --text-primary: #f0f0ff;
          --text-secondary: #a0a0c0;
          --text-muted: #606080;
          --accent-blue: #5B6EEA;
          --accent-purple: #8B5CF6;
          --accent-gold: #F7D02C;
          --accent-red: #EE1515;
          --accent-green: #4ade80;
          --glow-blue: rgba(91, 110, 234, 0.3);
          --glow-purple: rgba(139, 92, 246, 0.3);
        }

        * {
          box-sizing: border-box;
        }

        /* ========== LAYOUT ========== */
        .layout-container {
          display: grid;
          grid-template-columns: 280px 1fr 360px 340px;
          grid-template-rows: auto auto 1fr;
          gap: 0;
          height: 100vh;
          overflow: hidden;
          background: var(--bg-deep);
        }

        .header-row {
          grid-column: 1 / -1;
        }

        .ticker-row {
          grid-column: 1 / -1;
        }

        /* Columns */
        .column {
          padding: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .column-map {
          background: linear-gradient(135deg, var(--bg-dark) 0%, #0d0d18 100%);
          border-right: 1px solid var(--border-subtle);
          padding: 12px;
        }

        .column-game {
          background: var(--bg-deep);
          padding: 20px 24px;
          overflow-y: auto;
        }

        .column-party {
          background: linear-gradient(135deg, var(--bg-dark) 0%, #0d0d18 100%);
          border-left: 1px solid var(--border-subtle);
          border-right: 1px solid var(--border-subtle);
          overflow-y: auto;
          padding: 16px;
        }

        .column-social {
          background: linear-gradient(135deg, #0d0d18 0%, var(--bg-dark) 100%);
          border-left: 1px solid var(--border-subtle);
          padding: 16px;
        }

        /* ========== KANTO MAP ========== */
        .kanto-map {
          flex: 1;
          position: relative;
          background: linear-gradient(180deg, #1a4a1a 0%, #0d2d0d 30%, #1a3a2a 60%, #2a4a5a 100%);
          border-radius: 10px;
          border: 2px solid var(--border-accent);
          overflow: hidden;
          min-height: 200px;
        }

        .kanto-map::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 80%, rgba(100, 200, 255, 0.15) 0%, transparent 30%),
            radial-gradient(circle at 60% 90%, rgba(100, 200, 255, 0.1) 0%, transparent 25%);
          pointer-events: none;
        }

        .map-title {
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Silkscreen', cursive;
          font-size: 13px;
          color: var(--accent-gold);
          text-shadow: 0 2px 4px rgba(0,0,0,0.5), 0 0 20px rgba(247, 208, 44, 0.3);
          letter-spacing: 4px;
          z-index: 20;
        }

        .map-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .map-connection {
          stroke: rgba(255,255,255,0.15);
          stroke-width: 2;
          stroke-linecap: round;
        }

        .map-connection.connected {
          stroke: var(--accent-blue);
          stroke-width: 3;
          filter: drop-shadow(0 0 4px var(--accent-blue));
          animation: pulse-line 2s ease-in-out infinite;
        }

        @keyframes pulse-line {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .map-marker {
          position: absolute;
          transform: translate(-50%, -50%);
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-family: inherit;
          padding: 0;
          z-index: 10;
        }

        .map-marker .marker-icon {
          font-size: 12px;
          line-height: 1;
        }

        .map-marker.town {
          background: #EE1515;
          color: white;
          box-shadow: 0 0 8px rgba(238, 21, 21, 0.5);
        }

        .map-marker.route {
          background: #3B82F6;
          color: white;
          width: 12px;
          height: 12px;
        }

        .map-marker.route .marker-icon {
          font-size: 9px;
        }

        .map-marker.cave {
          background: #6B7280;
          color: white;
        }

        .map-marker.forest {
          background: #22C55E;
          color: white;
        }

        .map-marker:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .map-marker.connected:not(:disabled) {
          animation: marker-pulse 1.5s ease-in-out infinite;
        }

        .map-marker.connected:not(:disabled):hover {
          transform: translate(-50%, -50%) scale(1.4);
          z-index: 15;
        }

        .map-marker.current {
          width: 26px;
          height: 26px;
          border: 3px solid var(--accent-gold);
          box-shadow: 0 0 15px var(--accent-gold), 0 0 30px rgba(247, 208, 44, 0.3);
          z-index: 15;
          animation: current-glow 2s ease-in-out infinite;
        }

        .map-marker.current .marker-icon {
          font-size: 14px;
        }

        @keyframes marker-pulse {
          0%, 100% { box-shadow: 0 0 8px var(--accent-blue); }
          50% { box-shadow: 0 0 16px var(--accent-blue), 0 0 24px var(--glow-blue); }
        }

        @keyframes current-glow {
          0%, 100% { box-shadow: 0 0 15px var(--accent-gold), 0 0 30px rgba(247, 208, 44, 0.3); }
          50% { box-shadow: 0 0 20px var(--accent-gold), 0 0 40px rgba(247, 208, 44, 0.5); }
        }

        .map-tooltip {
          position: absolute;
          background: var(--bg-elevated);
          border: 1px solid var(--border-accent);
          border-radius: 8px;
          padding: 8px 12px;
          z-index: 100;
          pointer-events: none;
          transform: translateY(-50%);
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          min-width: 100px;
        }

        .tooltip-name {
          font-family: 'Silkscreen', cursive;
          font-size: 10px;
          color: white;
          margin-bottom: 2px;
        }

        .tooltip-level {
          font-size: 9px;
          color: var(--accent-gold);
        }

        .tooltip-action {
          font-size: 8px;
          color: var(--accent-green);
          margin-top: 4px;
        }

        .map-legend {
          position: absolute;
          bottom: 6px;
          left: 6px;
          display: flex;
          gap: 6px;
          background: rgba(0,0,0,0.6);
          padding: 3px 6px;
          border-radius: 6px;
          z-index: 20;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 8px;
          color: var(--text-secondary);
        }

        .legend-marker {
          font-size: 9px;
        }

        .legend-marker.town { color: #EE1515; }
        .legend-marker.route { color: #3B82F6; }
        .legend-marker.cave { color: #6B7280; }
        .legend-marker.forest { color: #22C55E; }

        /* Current Zone Panel */
        .current-zone-panel {
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%);
          border-radius: 10px;
          padding: 10px;
          margin-top: 10px;
          box-shadow: 0 4px 15px var(--glow-blue);
        }

        .current-zone-icon {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }

        .current-zone-info {
          flex: 1;
        }

        .current-zone-name {
          font-family: 'Silkscreen', cursive;
          font-size: 11px;
          color: white;
        }

        .current-zone-level {
          font-size: 9px;
          color: rgba(255,255,255,0.8);
        }

        /* ========== SOCIAL TABS ========== */
        .social-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
        }

        .tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
          color: var(--text-secondary);
          transition: all 0.2s;
        }

        .tab:hover {
          background: var(--bg-elevated);
        }

        .tab.active {
          background: var(--accent-blue);
          border-color: var(--accent-blue);
          color: white;
        }

        .tab-icon {
          font-size: 14px;
        }

        .online-badge {
          background: var(--accent-green);
          color: var(--bg-deep);
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 700;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: var(--bg-deep);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: var(--border-accent);
        }

        /* Responsive adjustments */
        @media (max-width: 1800px) {
          .layout-container {
            grid-template-columns: 260px 1fr 340px 320px;
          }
        }

        @media (max-width: 1600px) {
          .layout-container {
            grid-template-columns: 240px 1fr 320px 300px;
          }
        }

        @media (max-width: 1400px) {
          .layout-container {
            grid-template-columns: 220px 1fr 300px 280px;
          }

          .map-marker {
            width: 14px;
            height: 14px;
          }

          .map-marker.current {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>

      <div className="layout-container">
        {/* Header Row */}
        <div className="header-row">
          <Header />
        </div>

        {/* World Events Ticker */}
        <div className="ticker-row">
          <WorldEventsTicker events={worldEvents} />
        </div>

        {/* Column 1: Kanto Map */}
        <div className="column column-map">
          <KantoMapColumn />
        </div>

        {/* Column 2: Main Game View */}
        <div className="column column-game">
          <div className="space-y-4">
            {/* World View / Encounter */}
            {showWorldView ? (
              <WorldView />
            ) : (
              <EncounterDisplay />
            )}

            {/* Town Menu (only in towns) */}
            {isInTown && !hasEncounter && (
              <TownMenu />
            )}

            {/* World Log */}
            <WorldLog entries={worldLog} />
          </div>
        </div>

        {/* Column 3: Party */}
        <div className="column column-party">
          <PartyPanel />
        </div>

        {/* Column 4: Social */}
        <div className="column column-social">
          <SocialColumn />
        </div>
      </div>

      {/* Floating UI */}
      <BoxPanel />
      <ShopPanel />
      <GymBattlePanel />
      <LevelUpToast />
    </>
  )
}
