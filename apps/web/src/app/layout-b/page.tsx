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
// LAYOUT B: Compact 3-Column - Everything visible, no wasted space
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

// Left sidebar: Map + Travel + News
function MapSidebar() {
  const currentZone = useGameStore((state) => state.currentZone)
  const connectedZones = useGameStore((state) => state.connectedZones)

  const currentMapZone = useMemo(() => {
    if (!currentZone) return KANTO_ZONES[0]
    return KANTO_ZONES.find(z => z.name === currentZone.name) || KANTO_ZONES[0]
  }, [currentZone])

  const connectedZoneNames = useMemo(() => connectedZones.map(z => z.name), [connectedZones])

  // Placeholder news/events data
  const newsItems = [
    { id: 1, type: 'event', title: 'Double XP Weekend', desc: 'Earn 2x XP until Sunday!', time: '2d left' },
    { id: 2, type: 'news', title: 'New Pokemon Added', desc: 'Viridian Forest now has new encounters', time: '1d ago' },
    { id: 3, type: 'update', title: 'v1.2 Released', desc: 'Bug fixes and improvements', time: '3d ago' },
  ]

  return (
    <div className="map-sidebar">
      <div className="sidebar-header">
        <span className="header-icon">🗺️</span>
        <span className="header-title">Kanto</span>
      </div>

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
              className={`map-dot ${zone.type} ${isCurrent ? 'current' : ''} ${isConnected ? 'connected' : ''}`}
              style={{ left: `${zone.mapX}%`, top: `${zone.mapY}%` }}
              onClick={() => {
                const target = connectedZones.find(z => z.name === zone.name)
                if (target) gameSocket.moveToZone(target.id)
              }}
              disabled={!isConnected && !isCurrent}
              title={zone.name}
            />
          )
        })}
      </div>

      <div className="current-location">
        <div className="location-label">Current Location</div>
        <div className="location-name">{currentZone?.name}</div>
      </div>

      <div className="travel-section">
        <div className="section-label">Travel to</div>
        <div className="travel-list">
          {connectedZones.map(zone => (
            <button
              key={zone.id}
              className="travel-btn"
              onClick={() => gameSocket.moveToZone(zone.id)}
            >
              <span className="zone-icon">{zone.zone_type === 'town' ? '🏠' : '🌿'}</span>
              <span className="zone-name">{zone.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="news-section">
        <div className="section-label">News & Events</div>
        <div className="news-list">
          {newsItems.map(item => (
            <div key={item.id} className={`news-item ${item.type}`}>
              <div className="news-icon">
                {item.type === 'event' ? '🎉' : item.type === 'news' ? '📰' : '🔧'}
              </div>
              <div className="news-content">
                <div className="news-title">{item.title}</div>
                <div className="news-desc">{item.desc}</div>
              </div>
              <div className="news-time">{item.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Right column: Party + Buffs + Activity Log
function PartyColumn() {
  const worldLog = useGameStore((state) => state.worldLog)

  // Placeholder buffs data - will be replaced with real data later
  const availableBuffs = [
    { id: 'xp_boost', name: 'XP Boost', icon: '⭐', desc: '+50% XP for 1 hour', duration: '1h', cost: 100, active: false },
    { id: 'catch_boost', name: 'Lucky Charm', icon: '🍀', desc: '+10% catch rate', duration: '30m', cost: 50, active: true, timeLeft: '12:34' },
    { id: 'shiny_boost', name: 'Shiny Aura', icon: '✨', desc: '2x shiny chance', duration: '1h', cost: 200, active: false },
    { id: 'gold_boost', name: 'Gold Rush', icon: '💰', desc: '+25% gold drops', duration: '30m', cost: 75, active: false },
  ]

  return (
    <div className="party-column">
      <div className="party-header">
        <span>⚔️</span>
        <span className="party-title">Party</span>
      </div>
      <div className="party-content">
        <PartyPanel />
      </div>

      <div className="buffs-section">
        <div className="buffs-header">
          <span>⚡</span>
          <span className="buffs-title">Power-Ups</span>
        </div>
        <div className="buffs-list">
          {availableBuffs.map(buff => (
            <button
              key={buff.id}
              className={`buff-item ${buff.active ? 'active' : ''}`}
              aria-label={`${buff.name}: ${buff.desc}`}
            >
              <span className="buff-icon">{buff.icon}</span>
              <span className="buff-info">
                <span className="buff-name">{buff.name}</span>
                {buff.active && <span className="buff-timer">{buff.timeLeft}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="activity-section">
        <div className="activity-header">
          <span>📋</span>
          <span className="activity-title">Activity</span>
        </div>
        <div className="activity-log">
          <WorldLog entries={worldLog} />
        </div>
      </div>
    </div>
  )
}

// Center: Social (Chat + Friends)
function SocialSidebar() {
  const [tab, setTab] = useState<'chat' | 'friends'>('chat')
  const [showAdd, setShowAdd] = useState(false)
  const friends = useGameStore((state) => state.friends)
  const onlineCount = useMemo(() => countOnlineFriends(friends), [friends])

  return (
    <div className="social-sidebar">
      <div className="social-tabs">
        <button className={`stab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
          💬 Chat
        </button>
        <button className={`stab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
          👥 <span className="friend-count">{onlineCount}</span>
        </button>
      </div>
      <div className="social-content">
        {tab === 'chat' ? (
          <ChatSidebar isCollapsed={false} />
        ) : (
          <div className="friends-area">
            <div className="friends-toolbar">
              <span className="online-label">{onlineCount} online</span>
              <button className="add-btn" onClick={() => setShowAdd(!showAdd)}>+</button>
            </div>
            {showAdd && <AddFriend onClose={() => setShowAdd(false)} />}
            <FriendsList friends={friends} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function LayoutBPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg-dark: #0a0a0f;
          --bg-base: #0f1015;
          --bg-card: #16171d;
          --bg-elevated: #1d1e26;
          --bg-hover: #252630;
          --border: #2a2b35;
          --border-bright: #3a3b48;
          --text-dim: #5a5b68;
          --text-muted: #8a8b98;
          --text-base: #c5c6d0;
          --text-bright: #eaeaf0;
          --accent: #6366f1;
          --accent-glow: rgba(99, 102, 241, 0.3);
          --green: #22c55e;
          --red: #ef4444;
          --yellow: #eab308;
        }

        body {
          font-family: 'Inter', system-ui, sans-serif;
          background: var(--bg-dark);
          color: var(--text-base);
        }

        .loading {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        /* ===== MAIN LAYOUT: 3-column with header ===== */
        .game-layout {
          display: grid;
          grid-template-columns: 260px 1fr 340px;
          grid-template-rows: auto auto 1fr;
          height: 100vh;
          overflow: hidden;
        }

        .header-row {
          grid-column: 1 / -1;
        }

        .ticker-row {
          grid-column: 1 / -1;
          border-bottom: 1px solid var(--border);
        }

        /* ===== LEFT SIDEBAR: MAP ===== */
        .map-sidebar {
          background: var(--bg-base);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
        }

        .header-icon { font-size: 14px; }
        .header-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-bright);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .map-canvas {
          position: relative;
          height: 180px;
          background: linear-gradient(180deg, #152015 0%, #0a150a 50%, #101520 100%);
          flex-shrink: 0;
        }

        .map-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .map-lines line {
          stroke: rgba(255,255,255,0.08);
          stroke-width: 1;
        }

        .map-lines line.active {
          stroke: var(--accent);
          stroke-width: 2;
          filter: drop-shadow(0 0 3px var(--accent-glow));
        }

        .map-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          transform: translate(-50%, -50%);
          cursor: pointer;
          transition: all 0.15s;
        }

        .map-dot.town { background: var(--red); }
        .map-dot.route { background: var(--accent); width: 6px; height: 6px; }
        .map-dot.forest { background: var(--green); }
        .map-dot.cave { background: #6b7280; }
        .map-dot:disabled { opacity: 0.2; cursor: not-allowed; }
        .map-dot.current {
          width: 12px;
          height: 12px;
          border: 2px solid var(--yellow);
          box-shadow: 0 0 10px var(--yellow);
        }
        .map-dot.connected:not(:disabled):hover {
          transform: translate(-50%, -50%) scale(1.5);
        }

        .current-location {
          padding: 12px 14px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
        }

        .location-label {
          font-size: 9px;
          font-weight: 600;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .location-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--green);
        }

        .travel-section {
          padding: 12px;
          flex-shrink: 0;
        }

        .section-label {
          font-size: 9px;
          font-weight: 600;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .travel-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .travel-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-base);
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }

        .travel-btn:hover {
          background: var(--bg-hover);
          border-color: var(--accent);
          color: var(--text-bright);
        }

        .zone-icon { font-size: 14px; }
        .zone-name { flex: 1; }

        /* ===== NEWS SECTION ===== */
        .news-section {
          flex: 1;
          min-height: 0;
          padding: 12px;
          padding-top: 0;
          display: flex;
          flex-direction: column;
        }

        .news-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .news-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 10px;
          background: var(--bg-card);
          border-radius: 6px;
          border-left: 3px solid var(--border);
        }

        .news-item.event { border-left-color: var(--yellow); }
        .news-item.news { border-left-color: var(--accent); }
        .news-item.update { border-left-color: var(--green); }

        .news-icon { font-size: 14px; flex-shrink: 0; }

        .news-content { flex: 1; min-width: 0; }

        .news-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-bright);
          margin-bottom: 2px;
        }

        .news-desc {
          font-size: 10px;
          color: var(--text-muted);
          line-height: 1.3;
        }

        .news-time {
          font-size: 9px;
          color: var(--text-dim);
          flex-shrink: 0;
        }

        /* ===== CENTER COLUMN: Game ===== */
        .center-column {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg-dark);
        }

        .game-world {
          padding: 8px;
          padding-bottom: 0;
          flex-shrink: 0;
        }

        /* ===== SOCIAL SECTION (under world view) ===== */
        .social-section {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .social-sidebar {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ===== PARTY COLUMN (right) ===== */
        .party-column {
          background: var(--bg-base);
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .party-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .party-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Buffs section in party column */
        .buffs-section {
          flex: 0 0 auto;
          border-top: 1px solid var(--border);
        }

        .buffs-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
        }

        .buffs-title {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .buffs-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px 12px;
          background: var(--bg-base);
        }

        .buff-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
          font-family: inherit;
        }

        .buff-item:hover {
          background: var(--bg-hover);
          border-color: var(--accent);
        }

        .buff-item.active {
          background: linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%);
          border-color: var(--accent);
          box-shadow: 0 0 12px var(--accent-glow);
        }

        .buff-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .buff-info {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-width: 0;
        }

        .buff-name {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-base);
        }

        .buff-item.active .buff-name {
          color: white;
        }

        .buff-timer {
          font-size: 10px;
          font-weight: 600;
          color: var(--yellow);
          background: var(--bg-dark);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .buff-item.active .buff-timer {
          background: rgba(0,0,0,0.3);
          color: white;
        }

        /* Activity section in party column */
        .activity-section {
          flex: 1 1 auto;
          min-height: 120px;
          max-height: 220px;
          display: flex;
          flex-direction: column;
          border-top: 1px solid var(--border);
        }

        .activity-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .activity-title {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .activity-log {
          flex: 1;
          overflow-y: auto;
          padding: 10px 12px;
          font-size: 11px;
        }

        .activity-log > div {
          padding: 0 !important;
          background: transparent !important;
        }

        .social-tabs {
          display: flex;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .stab {
          flex: 1;
          padding: 10px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-muted);
          font-family: inherit;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .stab:hover { color: var(--text-base); background: var(--bg-elevated); }
        .stab.active { color: var(--text-bright); border-bottom-color: var(--accent); }

        .friend-count {
          background: var(--green);
          color: var(--bg-dark);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
        }

        .social-content {
          flex: 1;
          overflow-y: auto;
        }

        .friends-area {
          padding: 8px;
        }

        .friends-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .online-label {
          font-size: 11px;
          color: var(--green);
          font-weight: 500;
        }

        .add-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent);
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .add-btn:hover { background: #7c7fff; }

        /* ===== COMPONENT OVERRIDES - Remove clashing styles ===== */

        /* WorldView - remove extra border/rounding */
        .game-world > div {
          border-radius: 8px !important;
        }

        /* TownMenu - compact it */
        .game-world .poke-card,
        .game-world [class*="town-menu"],
        .game-world [class*="TownMenu"] {
          margin-top: 8px !important;
          padding: 8px !important;
          border-radius: 8px !important;
        }

        /* Chat component overrides */
        .social-content > div {
          height: 100%;
        }

        .social-content [class*="chat"],
        .social-content [class*="Chat"] {
          border: none !important;
          border-radius: 0 !important;
          background: transparent !important;
        }

        /* Party content area */
        .party-content {
          flex: 0 1 auto;
          overflow-y: auto;
          padding: 8px;
          max-height: 50%;
        }

        /* Remove extra borders on nested cards */
        .party-content [class*="card"],
        .party-content [class*="Card"] {
          border-radius: 6px !important;
          margin-bottom: 6px !important;
        }

        /* Party panel - remove its own padding */
        .party-content > div {
          padding: 0 !important;
        }

        /* Party grid - 2 columns with tight gap */
        .party-content [class*="grid"] {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 6px !important;
        }

        /* Pokemon cards - increase internal padding for badges */
        .party-content .group.relative.rounded-xl > .relative {
          padding: 8px !important;
        }

        /* Type badges - smaller size, ensure visible */
        .party-content [class*="TypeBadge"],
        .party-content [class*="Badge"],
        .party-content .flex.gap-1 > span[class*="rounded"],
        .party-content .flex.gap-1 > span[class*="px-"] {
          font-size: 7px !important;
          padding: 2px 4px !important;
          line-height: 1 !important;
        }

        /* Pokemon names - prevent truncation */
        .party-content .font-semibold.truncate {
          font-size: 11px !important;
          overflow: visible !important;
          white-space: normal !important;
          text-overflow: unset !important;
        }

        /* ===== SCROLLBAR ===== */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg-dark); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--border-bright); }

        /* ===== LAYOUT LABEL ===== */
        .layout-label {
          position: fixed;
          top: 90px;
          right: 270px;
          background: var(--accent);
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          z-index: 100;
        }
      `}</style>

      <div className="game-layout">
        <div className="header-row">
          <Header />
        </div>

        <div className="ticker-row">
          <WorldEventsTicker events={worldEvents} />
        </div>

        {/* Left: Map & Navigation */}
        <MapSidebar />

        {/* Center: World + Social */}
        <div className="center-column">
          <div className="game-world">
            {!hasEncounter ? <WorldView /> : <EncounterDisplay />}
            {isInTown && !hasEncounter && <TownMenu />}
          </div>

          <div className="social-section">
            <SocialSidebar />
          </div>
        </div>

        {/* Right: Party + Activity Log */}
        <PartyColumn />

        <div className="layout-label">Layout B</div>
      </div>

      <BoxPanel />
      <ShopPanel />
      <GymBattlePanel />
      <LevelUpToast />
    </>
  )
}
