'use client'

import { useEffect, useState, useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { Header } from './Header'
import { EncounterDisplay } from './EncounterDisplay'
import { PartyPanel } from './PartyPanel'
import { BoxPanel } from './BoxPanel'
import { LevelUpToast } from './LevelUpToast'
import { WorldView } from './world'
import { WorldEventsTicker } from './social/WorldEventsTicker'
import { ChatSidebar } from './social/ChatSidebar'
import { FriendsList } from './social/FriendsList'
import { FriendRequests } from './social/FriendRequests'
import { AddFriend } from './social/AddFriend'
import { TradeRequests } from './social/TradeRequests'
import { TradeHistory } from './social/TradeHistory'
import { TradeModal } from './social/TradeModal'
import { TownMenu } from './interactions/TownMenu'
import { WorldLog } from './interactions/WorldLog'
import { ShopPanel } from './ShopPanel'
import { GymBattlePanel } from './GymBattlePanel'
import { MuseumPanel } from './interactions/MuseumPanel'
import { countOnlineFriends } from '@/lib/utils/friendUtils'
import type { ActiveTradeSession } from '@/types/trade'

// ============================================================================
// LAYOUT-B: Compact 3-Column Grid Layout
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

// Placeholder news/events data
const NEWS_ITEMS = [
  { id: 1, type: 'event' as const, title: 'Double XP Weekend', desc: 'Earn 2x XP until Sunday!', time: '2d left' },
  { id: 2, type: 'news' as const, title: 'New Pokemon Added', desc: 'Viridian Forest now has new encounters', time: '1d ago' },
  { id: 3, type: 'update' as const, title: 'v1.2 Released', desc: 'Bug fixes and improvements', time: '3d ago' },
]

// Placeholder buffs data
const AVAILABLE_BUFFS = [
  { id: 'xp_boost', name: 'XP Boost', icon: '⭐', desc: '+50% XP for 1 hour', duration: '1h', cost: 100, active: false },
  { id: 'catch_boost', name: 'Lucky Charm', icon: '🍀', desc: '+10% catch rate', duration: '30m', cost: 50, active: true, timeLeft: '12:34' },
  { id: 'shiny_boost', name: 'Shiny Aura', icon: '✨', desc: '2x shiny chance', duration: '1h', cost: 200, active: false },
  { id: 'gold_boost', name: 'Gold Rush', icon: '💰', desc: '+25% gold drops', duration: '30m', cost: 75, active: false },
]

// ===== MAP SIDEBAR COMPONENT =====
function MapSidebar({ className = '' }: { className?: string }) {
  const currentZone = useGameStore((state) => state.currentZone)
  const connectedZones = useGameStore((state) => state.connectedZones)

  const currentMapZone = useMemo(() => {
    if (!currentZone) return KANTO_ZONES[0]
    return KANTO_ZONES.find(z => z.name === currentZone.name) || KANTO_ZONES[0]
  }, [currentZone])

  const connectedZoneNames = useMemo(() => connectedZones.map(z => z.name), [connectedZones])

  return (
    <div className={`map-sidebar ${className}`}>
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
        <div className="location-name">{currentZone?.name || 'Unknown'}</div>
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
          {NEWS_ITEMS.map(item => (
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

// ===== SOCIAL SIDEBAR COMPONENT =====
type SocialTab = 'chat' | 'friends' | 'trades'
type TradesSubTab = 'active' | 'history'

function SocialSidebar({ onOpenTrade }: { onOpenTrade: (trade: ActiveTradeSession) => void }) {
  const [tab, setTab] = useState<SocialTab>('chat')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [tradesSubTab, setTradesSubTab] = useState<TradesSubTab>('active')
  const [historyFilter, setHistoryFilter] = useState('')

  const friends = useGameStore((state) => state.friends)
  const incomingFriendRequests = useGameStore((state) => state.incomingFriendRequests)
  const outgoingFriendRequests = useGameStore((state) => state.outgoingFriendRequests)
  const incomingTradeRequests = useGameStore((state) => state.incomingTradeRequests)
  const outgoingTradeRequests = useGameStore((state) => state.outgoingTradeRequests)
  const isConnected = useGameStore((state) => state.isConnected)

  const onlineCount = useMemo(() => countOnlineFriends(friends), [friends])
  const friendRequestCount = incomingFriendRequests.length + outgoingFriendRequests.length
  const tradeRequestCount = incomingTradeRequests.length + outgoingTradeRequests.length

  // Fetch friends data when connected
  useEffect(() => {
    if (isConnected) {
      gameSocket.getFriends()
      gameSocket.getTrades()
    }
  }, [isConnected])

  return (
    <div className="social-sidebar">
      <div className="social-tabs">
        <button
          className={`stab ${tab === 'chat' ? 'active' : ''}`}
          onClick={() => setTab('chat')}
        >
          💬 Chat
        </button>
        <button
          className={`stab ${tab === 'friends' ? 'active' : ''}`}
          onClick={() => setTab('friends')}
        >
          👥 <span className="friend-count">{onlineCount}</span>
          {friendRequestCount > 0 && (
            <span className="trade-count ml-1">{friendRequestCount}</span>
          )}
        </button>
        <button
          className={`stab ${tab === 'trades' ? 'active' : ''}`}
          onClick={() => setTab('trades')}
        >
          🔄 Trades
          {tradeRequestCount > 0 && (
            <span className="trade-count">{tradeRequestCount}</span>
          )}
        </button>
      </div>

      <div className="social-content">
        {tab === 'chat' && (
          <ChatSidebar isCollapsed={false} onToggle={() => {}} />
        )}

        {tab === 'friends' && (
          <div className="friends-area">
            <div className="friends-toolbar">
              <span className="online-label">{onlineCount} online</span>
              <button
                className="add-btn"
                onClick={() => setShowAddFriend(!showAddFriend)}
                title={showAddFriend ? 'Close' : 'Add Friend'}
              >
                {showAddFriend ? '×' : '+'}
              </button>
            </div>
            {showAddFriend && <AddFriend onClose={() => setShowAddFriend(false)} />}
            {friendRequestCount > 0 && (
              <div className="mb-3">
                <FriendRequests
                  incoming={incomingFriendRequests}
                  outgoing={outgoingFriendRequests}
                />
              </div>
            )}
            <FriendsList friends={friends} />
          </div>
        )}

        {tab === 'trades' && (
          <div className="trades-area">
            <div className="trades-toolbar">
              <div className="trades-sub-tabs">
                <button
                  className={tradesSubTab === 'active' ? 'active' : ''}
                  onClick={() => setTradesSubTab('active')}
                >
                  Active {tradeRequestCount > 0 && `(${tradeRequestCount})`}
                </button>
                <button
                  className={tradesSubTab === 'history' ? 'active' : ''}
                  onClick={() => setTradesSubTab('history')}
                >
                  History
                </button>
              </div>
            </div>
            {tradesSubTab === 'active' ? (
              <TradeRequests onOpenTrade={onOpenTrade} />
            ) : (
              <TradeHistory
                filterUsername={historyFilter}
                onFilterChange={setHistoryFilter}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== PARTY COLUMN COMPONENT =====
function PartyColumn({ className = '' }: { className?: string }) {
  const worldLog = useGameStore((state) => state.worldLog)

  return (
    <div className={`party-column ${className}`}>
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
          {AVAILABLE_BUFFS.map(buff => (
            <button
              key={buff.id}
              className={`buff-item ${buff.active ? 'active' : ''}`}
              aria-label={`${buff.name}: ${buff.desc}`}
            >
              <span className="buff-icon">{buff.icon}</span>
              <span className="buff-info">
                <span className="buff-name">{buff.name}</span>
                {buff.active && buff.timeLeft && (
                  <span className="buff-timer">{buff.timeLeft}</span>
                )}
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

// ===== MOBILE TAB BAR =====
type MobileTab = 'map' | 'game' | 'party' | 'social'

function MobileTabBar({
  activeTab,
  onTabChange,
  badges
}: {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  badges: { friends: number; trades: number }
}) {
  return (
    <div className="mobile-tab-bar">
      <button
        className={activeTab === 'map' ? 'active' : ''}
        onClick={() => onTabChange('map')}
      >
        <span className="tab-icon">🗺️</span>
        <span>Map</span>
      </button>
      <button
        className={activeTab === 'game' ? 'active' : ''}
        onClick={() => onTabChange('game')}
      >
        <span className="tab-icon">🎮</span>
        <span>Game</span>
      </button>
      <button
        className={activeTab === 'party' ? 'active' : ''}
        onClick={() => onTabChange('party')}
      >
        <span className="tab-icon">⚔️</span>
        <span>Party</span>
      </button>
      <button
        className={`relative ${activeTab === 'social' ? 'active' : ''}`}
        onClick={() => onTabChange('social')}
      >
        <span className="tab-icon">💬</span>
        <span>Social</span>
        {(badges.friends > 0 || badges.trades > 0) && (
          <span className="tab-badge">{badges.friends + badges.trades}</span>
        )}
      </button>
    </div>
  )
}

// ===== MAIN GAME SHELL =====
interface GameShellProps {
  accessToken: string
}

export function GameShell({ accessToken }: GameShellProps) {
  const isLoading = useGameStore((state) => state.isLoading)
  const reset = useGameStore((state) => state.reset)
  const currentZone = useGameStore((state) => state.currentZone)
  const currentEncounter = useGameStore((state) => state.currentEncounter)
  const worldEvents = useGameStore((state) => state.worldEvents)
  const incomingFriendRequests = useGameStore((state) => state.incomingFriendRequests)
  const incomingTradeRequests = useGameStore((state) => state.incomingTradeRequests)
  const outgoingTradeRequests = useGameStore((state) => state.outgoingTradeRequests)
  const isTradeModalOpen = useGameStore((state) => state.isTradeModalOpen)
  const setActiveTrade = useGameStore((state) => state.setActiveTrade)
  const setTradeModalOpen = useGameStore((state) => state.setTradeModalOpen)

  // Mobile state
  const [isMobile, setIsMobile] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('game')

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

  // Trade modal handlers
  const handleOpenTrade = (trade: ActiveTradeSession) => {
    setActiveTrade(trade)
    setTradeModalOpen(true)
  }

  const handleCloseTrade = () => {
    setTradeModalOpen(false)
  }

  // Determine view state
  const isInTown = currentZone?.zone_type === 'town'
  const hasEncounter = currentEncounter !== null

  // Badge counts for mobile
  const friendBadgeCount = incomingFriendRequests.length
  const tradeBadgeCount = incomingTradeRequests.length + outgoingTradeRequests.length

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

  // Mobile layout
  if (isMobile) {
    return (
      <>
        <div className="game-layout">
          <div className="header-row">
            <Header />
          </div>

          <div className="ticker-row">
            <WorldEventsTicker events={worldEvents} />
          </div>

          {/* Mobile: Show active tab content */}
          {mobileTab === 'map' && (
            <MapSidebar className="mobile-active" />
          )}

          {mobileTab === 'game' && (
            <div className="center-column">
              <div className="game-world">
                {!hasEncounter ? <WorldView /> : <EncounterDisplay />}
                {isInTown && !hasEncounter && <TownMenu />}
              </div>
            </div>
          )}

          {mobileTab === 'party' && (
            <PartyColumn className="mobile-active" />
          )}

          {mobileTab === 'social' && (
            <div className="center-column">
              <div className="social-section" style={{ flex: 1 }}>
                <SocialSidebar onOpenTrade={handleOpenTrade} />
              </div>
            </div>
          )}
        </div>

        <MobileTabBar
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          badges={{ friends: friendBadgeCount, trades: tradeBadgeCount }}
        />

        {/* Floating modals */}
        <BoxPanel />
        <ShopPanel />
        <GymBattlePanel />
        <MuseumPanel />
        <LevelUpToast />
        <TradeModal isOpen={isTradeModalOpen} onClose={handleCloseTrade} />
      </>
    )
  }

  // Desktop 3-column layout
  return (
    <>
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
            <SocialSidebar onOpenTrade={handleOpenTrade} />
          </div>
        </div>

        {/* Right: Party + Activity Log */}
        <PartyColumn />
      </div>

      {/* Floating modals */}
      <BoxPanel />
      <ShopPanel />
      <GymBattlePanel />
      <MuseumPanel />
      <LevelUpToast />
      <TradeModal isOpen={isTradeModalOpen} onClose={handleCloseTrade} />
    </>
  )
}
