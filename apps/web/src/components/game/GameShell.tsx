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
import { NearbyPlayersSection } from './NearbyPlayersSection'
import { ShopPanel } from './ShopPanel'
import { GymBattlePanel } from './GymBattlePanel'
import { MuseumPanel } from './interactions/MuseumPanel'
import { EvolutionModal } from './EvolutionModal'
import { countOnlineFriends } from '@/lib/utils/friendUtils'
import type { ActiveTradeSession } from '@/types/trade'
import { GuildPanel } from './guild'
import { PlayerActionModal } from './PlayerActionModal'
import { BoostCard } from './BoostCard'
import { BoostExpiredToast } from './BoostExpiredToast'
import { InteractiveMap } from './map'
import type { GuildBuffType } from '@pokemon-idle/shared'

// ============================================================================
// LAYOUT-B: Compact 3-Column Grid Layout
// ============================================================================

// Direction priority for sorting (lower = higher priority)
const DIRECTION_ORDER: Record<string, number> = {
  'N': 0, 'E': 1, 'S': 2, 'W': 3,
  'NE': 4, 'SE': 5, 'SW': 6, 'NW': 7
}

// Arrow symbols for each direction
const DIRECTION_ARROWS: Record<string, string> = {
  'N': '\u2191', 'S': '\u2193', 'E': '\u2192', 'W': '\u2190',
  'NE': '\u2197', 'SE': '\u2198', 'SW': '\u2199', 'NW': '\u2196'
}

// TODO: Replace with real data from backend when news/events system is implemented
// These are static placeholders to demonstrate the UI layout
const NEWS_ITEMS = [
  { id: 1, type: 'event' as const, title: 'Coming Soon', desc: 'News and events will appear here', time: '' },
]

// ===== MAP SIDEBAR COMPONENT =====
function MapSidebar({ className = '' }: { className?: string }) {
  const currentZone = useGameStore((state) => state.currentZone)
  const connectedZones = useGameStore((state) => state.connectedZones)

  // Sort connected zones by direction (N first, then E, S, W, then diagonals)
  const sortedConnectedZones = useMemo(() => {
    return [...connectedZones].sort((a, b) => {
      const orderA = DIRECTION_ORDER[a.direction || ''] ?? 99
      const orderB = DIRECTION_ORDER[b.direction || ''] ?? 99
      return orderA - orderB || a.id - b.id  // Stable sort by id when same direction
    })
  }, [connectedZones])

  return (
    <div className={`map-sidebar ${className}`}>
      {/* Interactive Map - replaces static map-canvas */}
      <InteractiveMap />

      <div className="current-location">
        <div className="location-label">Current Location</div>
        <div className="location-name">{currentZone?.name || 'Unknown'}</div>
      </div>

      <div className="travel-section">
        <div className="section-label">Travel to</div>
        <div className="travel-list">
          {sortedConnectedZones.map(zone => (
            <button
              key={zone.id}
              className="travel-btn"
              onClick={() => gameSocket.moveToZone(zone.id)}
            >
              {zone.direction && (
                <span className="direction-arrow text-[var(--color-text-secondary)]">
                  {DIRECTION_ARROWS[zone.direction]}
                </span>
              )}
              <span className="zone-icon">{zone.zone_type === 'town' ? '🏠' : '🌿'}</span>
              <span className="zone-name">{zone.name}</span>
            </button>
          ))}
        </div>
      </div>

      <NearbyPlayersSection />

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
type SocialTab = 'chat' | 'friends' | 'trades' | 'guild'
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
  const guildInvites = useGameStore((state) => state.guildInvites)

  const onlineCount = useMemo(() => countOnlineFriends(friends), [friends])
  const guildInviteCount = guildInvites.length
  const friendRequestCount = incomingFriendRequests.length + outgoingFriendRequests.length
  const tradeRequestCount = incomingTradeRequests.length + outgoingTradeRequests.length

  // Note: Friends/trades data fetching is handled at GameShell level
  // so badge counts are accurate on all mobile tabs immediately after connect

  // Keyboard navigation for tabs per WAI-ARIA tab pattern
  const tabs: SocialTab[] = ['chat', 'friends', 'trades', 'guild']
  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: SocialTab) => {
    const currentIndex = tabs.indexOf(currentTab)
    let newIndex = currentIndex

    if (e.key === 'ArrowLeft') {
      newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
    } else if (e.key === 'ArrowRight') {
      newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1
    } else if (e.key === 'Home') {
      newIndex = 0
    } else if (e.key === 'End') {
      newIndex = tabs.length - 1
    } else {
      return // Don't prevent default for other keys
    }

    e.preventDefault()
    setTab(tabs[newIndex])
    // Focus the new tab button
    document.getElementById(`social-tab-${tabs[newIndex]}`)?.focus()
  }

  return (
    <div className="social-sidebar">
      <div className="social-tabs" role="tablist" aria-label="Social sections">
        <button
          id="social-tab-chat"
          className={`stab ${tab === 'chat' ? 'active' : ''}`}
          onClick={() => setTab('chat')}
          onKeyDown={(e) => handleTabKeyDown(e, 'chat')}
          role="tab"
          aria-selected={tab === 'chat'}
          aria-controls="social-panel-chat"
          tabIndex={tab === 'chat' ? 0 : -1}
        >
          💬 Chat
        </button>
        <button
          id="social-tab-friends"
          className={`stab ${tab === 'friends' ? 'active' : ''}`}
          onClick={() => setTab('friends')}
          onKeyDown={(e) => handleTabKeyDown(e, 'friends')}
          role="tab"
          aria-selected={tab === 'friends'}
          aria-controls="social-panel-friends"
          tabIndex={tab === 'friends' ? 0 : -1}
        >
          👥 <span className="friend-count">{onlineCount}</span>
          {friendRequestCount > 0 && (
            <span className="trade-count ml-1">{friendRequestCount}</span>
          )}
        </button>
        <button
          id="social-tab-trades"
          className={`stab ${tab === 'trades' ? 'active' : ''}`}
          onClick={() => setTab('trades')}
          onKeyDown={(e) => handleTabKeyDown(e, 'trades')}
          role="tab"
          aria-selected={tab === 'trades'}
          aria-controls="social-panel-trades"
          tabIndex={tab === 'trades' ? 0 : -1}
        >
          🔄 Trades
          {tradeRequestCount > 0 && (
            <span className="trade-count">{tradeRequestCount}</span>
          )}
        </button>
        <button
          id="social-tab-guild"
          className={`stab ${tab === 'guild' ? 'active' : ''}`}
          onClick={() => setTab('guild')}
          onKeyDown={(e) => handleTabKeyDown(e, 'guild')}
          role="tab"
          aria-selected={tab === 'guild'}
          aria-controls="social-panel-guild"
          tabIndex={tab === 'guild' ? 0 : -1}
        >
          Guild
          {guildInviteCount > 0 && (
            <span className="trade-count">{guildInviteCount}</span>
          )}
        </button>
      </div>

      <div className="social-content">
        {tab === 'chat' && (
          <div id="social-panel-chat" role="tabpanel" aria-labelledby="social-tab-chat">
            <ChatSidebar isCollapsed={false} onToggle={() => {}} />
          </div>
        )}

        {tab === 'friends' && (
          <div id="social-panel-friends" role="tabpanel" aria-labelledby="social-tab-friends" className="friends-area">
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
          <div id="social-panel-trades" role="tabpanel" aria-labelledby="social-tab-trades" className="trades-area">
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

        {tab === 'guild' && (
          <div id="social-panel-guild" role="tabpanel" aria-labelledby="social-tab-guild" className="guild-area">
            <GuildPanel />
          </div>
        )}
      </div>
    </div>
  )
}

// ===== PARTY COLUMN COMPONENT =====
function PartyColumn({ className = '' }: { className?: string }) {
  const worldLog = useGameStore((state) => state.worldLog)
  const guildActiveBuffs = useGameStore((state) => state.guildActiveBuffs)
  const addExpiredBoost = useGameStore((state) => state.addExpiredBoost)
  const clearExpiredBuff = useGameStore((state) => state.clearExpiredBuff)

  const handleBoostExpire = (buffType: GuildBuffType) => {
    addExpiredBoost(buffType)
    clearExpiredBuff(buffType)
  }

  const hasActiveBoosts = guildActiveBuffs && (
    guildActiveBuffs.xp_bonus ||
    guildActiveBuffs.catch_rate ||
    guildActiveBuffs.encounter_rate
  )

  return (
    <div className={`party-column ${className}`}>
      <div className="party-header">
        <span>{'\u2694\uFE0F'}</span>
        <span className="party-title">Party</span>
      </div>
      <div className="party-content">
        <PartyPanel />
      </div>

      <div className="buffs-section">
        <div className="buffs-header">
          <span>{'\u26A1'}</span>
          <span className="buffs-title">Boosts</span>
        </div>
        <div className="buffs-list">
          {guildActiveBuffs && (
            <>
              {guildActiveBuffs.xp_bonus && (
                <BoostCard
                  key="xp_bonus"
                  buff={guildActiveBuffs.xp_bonus}
                  onExpire={() => handleBoostExpire('xp_bonus')}
                />
              )}
              {guildActiveBuffs.catch_rate && (
                <BoostCard
                  key="catch_rate"
                  buff={guildActiveBuffs.catch_rate}
                  onExpire={() => handleBoostExpire('catch_rate')}
                />
              )}
              {guildActiveBuffs.encounter_rate && (
                <BoostCard
                  key="encounter_rate"
                  buff={guildActiveBuffs.encounter_rate}
                  onExpire={() => handleBoostExpire('encounter_rate')}
                />
              )}
            </>
          )}
          {!hasActiveBoosts && (
            <div className="text-xs text-[var(--color-text-muted)] text-center py-4">
              Use a boost from your guild shop to enhance your training!
            </div>
          )}
        </div>
      </div>

      <div className="activity-section">
        <div className="activity-header">
          <span>{'\uD83D\uDCCB'}</span>
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
      setIsMobile(window.innerWidth <= 1024)  // Matches CSS @media (max-width: 1024px)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isConnected = useGameStore((state) => state.isConnected)

  useEffect(() => {
    // Connect to game server
    gameSocket.connect(accessToken)

    // Cleanup on unmount
    return () => {
      gameSocket.disconnect()
      reset()
    }
  }, [accessToken, reset])

  // Fetch social data when connected - runs at GameShell level so mobile users
  // see correct badge counts immediately on all tabs, not just when Social tab mounts
  useEffect(() => {
    if (isConnected) {
      gameSocket.getFriends()
      gameSocket.getTrades()
    }
  }, [isConnected])

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

  // Badge counts for mobile tab bar
  // Only show incoming requests (action needed from user) for consistency
  const friendBadgeCount = incomingFriendRequests.length
  const tradeBadgeCount = incomingTradeRequests.length

  if (isLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[var(--color-surface-base)] flex items-center justify-center p-4">
        <div className="text-center">
          {/* Pokeball loading spinner */}
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#EE1515] to-[#CC0000] overflow-hidden animate-spin">
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#f0f0f0] to-[#d0d0d0]" />
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-[var(--color-surface-elevated)] -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-[#f0f0f0] rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-[var(--color-surface-elevated)]" />
            </div>
          </div>
          <div className="font-pixel text-sm text-[var(--color-text-primary)] tracking-wider mb-2">LOADING</div>
          <div className="text-[var(--color-text-muted)] text-sm">Connecting to server...</div>
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

        {/* Floating modals/panels */}
        <BoxPanel />
        <ShopPanel />
        <GymBattlePanel />
        <MuseumPanel />
        <LevelUpToast />
        <BoostExpiredToast />
        <EvolutionModal />
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
          {/* Inner flex wrapper for padding and gap */}
          <div className="flex flex-col p-3 gap-3 min-w-0 overflow-hidden h-full">
            {/* Zone content - constrained height (256px) */}
            <div className="h-64 shrink-0">
              <div className="game-world h-full">
                {!hasEncounter ? <WorldView /> : <EncounterDisplay />}
                {isInTown && !hasEncounter && <TownMenu />}
              </div>
            </div>

            {/* Social - fills remaining space */}
            <div className="flex-1 min-h-0">
              <div className="social-section h-full">
                <SocialSidebar onOpenTrade={handleOpenTrade} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Party + Activity Log */}
        <PartyColumn />
      </div>

      {/* Floating modals/panels */}
      <BoxPanel />
      <ShopPanel />
      <GymBattlePanel />
      <MuseumPanel />
      <LevelUpToast />
      <BoostExpiredToast />
      <EvolutionModal />
      <TradeModal isOpen={isTradeModalOpen} onClose={handleCloseTrade} />
      <GlobalPlayerModal />
    </>
  )
}

// Global player action modal - listens to store for selectedPlayer
function GlobalPlayerModal() {
  const selectedPlayer = useGameStore(state => state.selectedPlayer)
  const closePlayerModal = useGameStore(state => state.closePlayerModal)

  if (!selectedPlayer) return null

  return (
    <PlayerActionModal
      player={selectedPlayer}
      onClose={closePlayerModal}
    />
  )
}
