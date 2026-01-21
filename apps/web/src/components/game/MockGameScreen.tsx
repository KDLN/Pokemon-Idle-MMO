'use client'

/**
 * MockGameScreen - Static mock of the main game screen for theme comparison
 *
 * Uses static data instead of WebSocket connection, allowing the theme
 * comparison route to work without authentication or live server.
 *
 * Layout matches GameShell: Header -> Ticker -> 3-column (Map | World | Party)
 *
 * Production quality: fully populated with realistic data, all game sections visible
 */

import { Card, CardHeader } from '@/components/ui/Card'
import { Button, BeveledButton } from '@/components/ui/Button'
import { cn } from '@/lib/ui/cn'

// ============================================
// MOCK DATA
// ============================================

const MOCK_PARTY = [
  { id: 1, nickname: 'Pikachu', species: 'pikachu', speciesId: 25, level: 25, hp: 45, maxHp: 55, type: 'electric', xp: 75 },
  { id: 2, nickname: 'Charizard', species: 'charizard', speciesId: 6, level: 36, hp: 120, maxHp: 120, type: 'fire', xp: 40 },
  { id: 3, nickname: 'Blastoise', species: 'blastoise', speciesId: 9, level: 34, hp: 95, maxHp: 110, type: 'water', xp: 88 },
  { id: 4, nickname: 'Venusaur', species: 'venusaur', speciesId: 3, level: 32, hp: 100, maxHp: 100, type: 'grass', xp: 22 },
  { id: 5, nickname: 'Gengar', species: 'gengar', speciesId: 94, level: 30, hp: 40, maxHp: 80, type: 'ghost', xp: 60 },
  { id: 6, nickname: 'Dragonite', species: 'dragonite', speciesId: 149, level: 55, hp: 145, maxHp: 150, type: 'dragon', xp: 95 },
]

const MOCK_ACTIVITY = [
  { id: 1, message: 'Pikachu gained 120 XP', time: '2s ago', type: 'xp' },
  { id: 2, message: 'Wild Rattata appeared!', time: '5s ago', type: 'encounter' },
  { id: 3, message: 'Caught Rattata!', time: '10s ago', type: 'catch' },
  { id: 4, message: 'Charizard leveled up to 36!', time: '15s ago', type: 'levelup' },
  { id: 5, message: 'Found a Potion!', time: '25s ago', type: 'item' },
  { id: 6, message: 'Blastoise gained 85 XP', time: '30s ago', type: 'xp' },
  { id: 7, message: 'Wild Pidgey fled!', time: '45s ago', type: 'flee' },
  { id: 8, message: 'Entered Viridian Forest', time: '1m ago', type: 'zone' },
  { id: 9, message: 'Venusaur gained 95 XP', time: '1m ago', type: 'xp' },
  { id: 10, message: 'Wild Caterpie appeared!', time: '2m ago', type: 'encounter' },
]

const MOCK_ZONE = { id: 3, name: 'Viridian Forest', type: 'forest' }

const MOCK_CONNECTED_ZONES = [
  { id: 1, name: 'Route 2', type: 'route', direction: 'S' },
  { id: 4, name: 'Pewter City', type: 'town', direction: 'N' },
]

const MOCK_NEARBY_PLAYERS = [
  { id: 1, username: 'AshK', level: 42, status: 'exploring' },
  { id: 2, username: 'MistyW', level: 38, status: 'battling' },
  { id: 3, username: 'BrockP', level: 35, status: 'idle' },
]

const MOCK_CURRENCY = {
  pokedollars: 12500,
  pokeballs: 45,
}

const MOCK_BOOST = {
  type: 'xp_bonus',
  multiplier: 1.5,
  endsAt: Date.now() + 1800000, // 30 min from now
}

const MOCK_SEASON_PROGRESS = {
  level: 12,
  xp: 340,
  xpToNext: 500,
}

// ============================================
// TYPE COLORS
// ============================================

const TYPE_COLORS: Record<string, string> = {
  normal: 'var(--color-type-normal)',
  fire: 'var(--color-type-fire)',
  water: 'var(--color-type-water)',
  electric: 'var(--color-type-electric)',
  grass: 'var(--color-type-grass)',
  ice: 'var(--color-type-ice)',
  fighting: 'var(--color-type-fighting)',
  poison: 'var(--color-type-poison)',
  ground: 'var(--color-type-ground)',
  flying: 'var(--color-type-flying)',
  psychic: 'var(--color-type-psychic)',
  bug: 'var(--color-type-bug)',
  rock: 'var(--color-type-rock)',
  ghost: 'var(--color-type-ghost)',
  dragon: 'var(--color-type-dragon)',
  dark: 'var(--color-type-dark)',
  steel: 'var(--color-type-steel)',
  fairy: 'var(--color-type-fairy)',
}

const DIRECTION_ARROWS: Record<string, string> = {
  'N': '\u2191', 'S': '\u2193', 'E': '\u2192', 'W': '\u2190',
  'NE': '\u2197', 'SE': '\u2198', 'SW': '\u2199', 'NW': '\u2196'
}

/** Generate Pokemon sprite URL from PokeAPI */
function getPokemonSpriteUrl(speciesId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`
}

// ============================================
// COMPONENTS
// ============================================

/** Pokeball icon */
function PokeballIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

/** Star icon for power rating */
function StarIcon({ filled, className = '' }: { filled: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

/** Mock Header component */
function MockHeader() {
  return (
    <header className="relative">
      {/* Top red bar */}
      <div className="h-1.5 bg-gradient-to-r from-[var(--color-brand-secondary)] via-[var(--color-brand-secondary-light)] to-[var(--color-brand-secondary)]" />

      <div className="glass border-b border-[var(--color-border-subtle)] px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[var(--color-brand-secondary)] to-[var(--color-brand-secondary-dark)] overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#f0f0f0] to-[#d0d0d0]" />
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-[var(--color-surface-base)] -translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 w-3.5 h-3.5 bg-[#f0f0f0] rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-[var(--color-surface-base)]">
                  <div className="absolute inset-0.5 bg-white rounded-full" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="font-pixel text-xs text-[var(--color-text-primary)] tracking-wider">POKEMON</h1>
              <p className="text-[9px] text-[var(--color-text-secondary)] tracking-widest uppercase">Idle MMO</p>
            </div>
          </div>

          {/* Center - Navigation buttons and badges */}
          <div className="hidden lg:flex items-center gap-3 flex-1 justify-center">
            {/* Pokedex Button */}
            <button className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-b from-[var(--color-brand-secondary-dark)] to-[#990000] border border-[var(--color-brand-secondary-light)]/30 hover:from-[var(--color-brand-secondary)] hover:to-[var(--color-brand-secondary-dark)] transition-all duration-200 shadow-lg shadow-red-900/30">
              <PokeballIcon className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-semibold">Pokedex</span>
            </button>

            {/* Leaderboard Button */}
            <button className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-b from-[#B8860B] to-[#8B6508] border border-[#FFD700]/30 hover:from-[#DAA520] hover:to-[#B8860B] transition-all duration-200 shadow-lg shadow-yellow-900/30">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-white text-xs font-semibold">Leaderboard</span>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-[var(--color-border-subtle)]" />

            {/* Badges */}
            <span className="text-xs text-[var(--color-text-muted)]">Badges:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-5 h-5 rounded-full border",
                    i <= 3
                      ? "bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300/50"
                      : "bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)]"
                  )}
                />
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-[var(--color-border-subtle)]" />

            {/* Season Progress */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-brand-accent)]">Lv.{MOCK_SEASON_PROGRESS.level}</span>
              <div className="w-20 h-2 rounded-full bg-[var(--color-surface-base)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-brand-accent)] to-[var(--color-brand-accent-dark)]"
                  style={{ width: `${(MOCK_SEASON_PROGRESS.xp / MOCK_SEASON_PROGRESS.xpToNext) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right - Currency */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="hidden sm:inline text-xs text-[var(--color-text-secondary)] ml-1.5">Online</span>
            </div>
            <div className="w-px h-6 bg-[var(--color-border-subtle)]" />
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-brand-accent)] font-mono text-sm">
                ${MOCK_CURRENCY.pokedollars.toLocaleString()}
              </span>
              <span className="text-[var(--color-text-muted)]">|</span>
              <span className="text-[var(--color-text-secondary)] text-sm">
                {MOCK_CURRENCY.pokeballs} <PokeballIcon className="w-3 h-3 inline text-[var(--color-brand-secondary)]" />
              </span>
            </div>
            {/* Trainer avatar placeholder */}
            <div className="hidden sm:flex items-center gap-2 pl-1 pr-3 py-0.5 rounded-full bg-gradient-to-r from-[var(--color-brand-primary)]/20 to-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/30">
              <div className="w-7 h-7 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center text-sm">
                🎮
              </div>
              <span className="text-xs text-[var(--color-text-primary)]">Trainer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-brand-primary)]/50 to-transparent" />
    </header>
  )
}

/** Mock World Events Ticker */
function MockTicker() {
  const events = [
    'AshK caught a Shiny Gyarados!',
    'GuildBattle: Team Rocket vs Team Valor in 5 minutes',
    'New event: Double XP weekend starts Friday!',
    'MistyW completed the Water-type challenge!',
  ]

  return (
    <div className="bg-[var(--color-surface-base)] border-b border-[var(--color-border-subtle)] px-4 py-1.5 overflow-hidden">
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-pixel text-[var(--color-brand-accent)] shrink-0">LIVE</span>
        <div className="flex gap-8 text-xs text-[var(--color-text-secondary)]">
          {events.map((event, i) => (
            <span key={i} className="whitespace-nowrap">{event}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Mock Map Sidebar */
function MockMapSidebar() {
  return (
    <div className="h-full bg-[var(--color-surface-elevated)] border-r border-[var(--color-border-subtle)] p-3 flex flex-col gap-3 overflow-y-auto">
      {/* Map Canvas with handheld device aesthetic */}
      <div className="texture-noise rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] overflow-hidden">
        {/* Header bar with indicator dots */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border-subtle)]">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Map</span>
        </div>
        {/* Map area */}
        <div className="h-44 bg-gradient-to-b from-[#1a2332] to-[#0d1520] relative overflow-hidden">
          {/* Map zone nodes */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-6 left-6 w-10 h-10 rounded-xl bg-amber-500 border-2 border-amber-400" />
            <div className="absolute top-20 left-14 w-8 h-8 rounded-lg bg-green-500 border-2 border-green-400" />
            <div className="absolute top-14 right-6 w-9 h-9 rounded-lg bg-emerald-600 border-2 border-emerald-500" />
            <div className="absolute bottom-10 left-10 w-7 h-7 rounded-lg bg-stone-500 border-2 border-stone-400" />
            <div className="absolute bottom-8 right-10 w-10 h-10 rounded-xl bg-amber-500 border-2 border-amber-400" />
          </div>
          {/* Connections */}
          <svg className="absolute inset-0 w-full h-full opacity-20" style={{ pointerEvents: 'none' }}>
            <line x1="30" y1="30" x2="70" y2="100" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="70" y1="100" x2="55" y2="150" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
          {/* Current zone indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-5 h-5 rounded-lg bg-[var(--color-brand-primary)] animate-pulse shadow-lg shadow-[var(--color-brand-primary)]/50 border-2 border-[var(--color-brand-primary-light)]" />
          </div>
          {/* Corner pokeball decorations */}
          <div className="absolute top-2 right-2 opacity-20">
            <PokeballIcon className="w-4 h-4 text-white" />
          </div>
          <div className="absolute bottom-2 left-2 opacity-20">
            <PokeballIcon className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Current location */}
      <div className="text-center">
        <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Current Location</div>
        <div className="text-sm text-[var(--color-text-primary)] font-medium">{MOCK_ZONE.name}</div>
      </div>

      {/* Travel */}
      <div>
        <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Travel to</div>
        <div className="flex flex-col gap-1.5">
          {MOCK_CONNECTED_ZONES.map(zone => (
            <button
              key={zone.id}
              className="texture-noise flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-border-subtle)] transition-colors text-left border border-transparent hover:border-[var(--color-border-bright)]"
            >
              <span className="text-[var(--color-text-muted)]">{DIRECTION_ARROWS[zone.direction]}</span>
              <span className="text-sm">{zone.type === 'town' ? '🏠' : '🌿'}</span>
              <span className="text-sm text-[var(--color-text-primary)]">{zone.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nearby Players */}
      <div>
        <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Nearby Players</div>
        <div className="flex flex-col gap-1">
          {MOCK_NEARBY_PLAYERS.map(player => (
            <div
              key={player.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded bg-[var(--color-surface-base)]/50 cursor-pointer hover:bg-[var(--color-surface-hover)]"
            >
              <div className="w-6 h-6 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center text-[10px]">
                🎮
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[var(--color-text-primary)] truncate">{player.username}</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">Lv.{player.level}</div>
              </div>
              <div className={cn(
                "w-2 h-2 rounded-full",
                player.status === 'exploring' ? "bg-green-400" : player.status === 'battling' ? "bg-orange-400" : "bg-gray-400"
              )} />
            </div>
          ))}
        </div>
      </div>

      {/* News placeholder */}
      <div className="mt-auto">
        <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">News & Events</div>
        <div className="texture-noise text-xs text-[var(--color-text-secondary)] p-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2 mb-1">
            <span>🎉</span>
            <span className="font-medium text-[var(--color-text-primary)]">Double XP Weekend</span>
          </div>
          <div className="text-[10px] text-[var(--color-text-muted)]">Starting Friday at 6PM UTC</div>
        </div>
      </div>
    </div>
  )
}

/** Mock World View */
function MockWorldView() {
  return (
    <div className="texture-noise h-full relative rounded-xl overflow-hidden bg-gradient-to-b from-[#2a3a2a] to-[#1a2a1a] border border-[var(--color-border-subtle)]">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-transparent to-transparent" />

      {/* Trees/forest decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-900/40 to-transparent" />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="font-pixel text-sm text-[var(--color-text-primary)] mb-2">Exploring...</div>
          <div className="text-[var(--color-text-secondary)] text-sm mb-1">{MOCK_ZONE.name}</div>
          <div className="text-[10px] text-[var(--color-text-muted)] mb-4">Wild Pokemon may appear!</div>
          <div className="flex gap-3 justify-center">
            <BeveledButton hue={120} saturation={60} lightness={40}>
              Search Area
            </BeveledButton>
            <BeveledButton hue={200} saturation={60} lightness={45}>
              Use Item
            </BeveledButton>
          </div>
        </div>
      </div>

      {/* Ambient particles */}
      <div className="absolute top-10 left-10 w-1 h-1 rounded-full bg-green-300/50 animate-pulse" />
      <div className="absolute top-20 right-16 w-1.5 h-1.5 rounded-full bg-yellow-300/40 animate-pulse" />
      <div className="absolute bottom-24 left-20 w-1 h-1 rounded-full bg-green-400/50 animate-pulse" />
      <div className="absolute top-32 left-1/4 w-1 h-1 rounded-full bg-emerald-300/40 animate-pulse" />
      <div className="absolute bottom-16 right-1/4 w-1.5 h-1.5 rounded-full bg-lime-300/30 animate-pulse" />

      {/* Corner pokeball decorations */}
      <div className="absolute top-3 right-3 opacity-10">
        <PokeballIcon className="w-8 h-8 text-white" />
      </div>
      <div className="absolute bottom-3 left-3 opacity-10">
        <PokeballIcon className="w-8 h-8 text-white" />
      </div>
    </div>
  )
}

/** Single Pokemon Card in Party */
function MockPokemonCard({ pokemon }: { pokemon: typeof MOCK_PARTY[0] }) {
  const hpPercent = (pokemon.hp / pokemon.maxHp) * 100
  const isLowHp = hpPercent < 30

  return (
    <div className="texture-noise p-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-bright)] transition-colors cursor-pointer group">
      {/* Pokemon sprite */}
      <div className="w-full aspect-square rounded-lg bg-[var(--color-surface-base)] mb-2 flex items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundColor: TYPE_COLORS[pokemon.type] }}
        />
        <img
          src={getPokemonSpriteUrl(pokemon.speciesId)}
          alt={pokemon.nickname}
          className="w-14 h-14 object-contain pixelated group-hover:scale-110 transition-transform"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Name and level */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--color-text-primary)] font-medium truncate">{pokemon.nickname}</span>
        <span className="text-[10px] text-[var(--color-text-muted)]">Lv.{pokemon.level}</span>
      </div>

      {/* Type badge */}
      <div
        className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium uppercase mb-2"
        style={{
          backgroundColor: TYPE_COLORS[pokemon.type],
          color: 'white',
        }}
      >
        {pokemon.type}
      </div>

      {/* HP bar */}
      <div className="h-1.5 rounded-full bg-[var(--color-surface-base)] overflow-hidden mb-1">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isLowHp ? "bg-[var(--color-error)]" : hpPercent < 50 ? "bg-[var(--color-warning)]" : "bg-[var(--color-success)]"
          )}
          style={{ width: `${hpPercent}%` }}
        />
      </div>

      {/* XP bar */}
      <div className="h-1 rounded-full bg-[var(--color-surface-base)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-brand-primary)]"
          style={{ width: `${pokemon.xp}%` }}
        />
      </div>

      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-[var(--color-text-muted)]">HP {pokemon.hp}/{pokemon.maxHp}</span>
        <span className="text-[9px] text-[var(--color-text-muted)]">XP {pokemon.xp}%</span>
      </div>
    </div>
  )
}

/** Mock Party Panel */
function MockPartyPanel() {
  const totalLevel = MOCK_PARTY.reduce((sum, p) => sum + p.level, 0)
  const powerStars = Math.min(5, Math.floor(MOCK_PARTY.length * 0.8) + 1)

  return (
    <Card variant="glass" padding="sm" className="texture-noise">
      <CardHeader
        icon={<PokeballIcon className="w-4 h-4" />}
        title="Party"
        subtitle={`${MOCK_PARTY.length}/6 Pokemon`}
        className="mb-3"
        action={
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  filled={star <= powerStars}
                  className={cn(
                    "w-2.5 h-2.5",
                    star <= powerStars ? "text-[var(--color-brand-accent)]" : "text-[var(--color-surface-hover)]"
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] text-[var(--color-text-secondary)] font-mono">{totalLevel}</span>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2">
        {MOCK_PARTY.map(pokemon => (
          <MockPokemonCard key={pokemon.id} pokemon={pokemon} />
        ))}
      </div>
    </Card>
  )
}

/** Mock Activity Log */
function MockActivityLog() {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'xp': return '⭐'
      case 'encounter': return '!'
      case 'catch': return '🎉'
      case 'levelup': return '⬆️'
      case 'item': return '🎁'
      case 'flee': return '💨'
      case 'zone': return '🗺️'
      default: return '•'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'catch': return 'text-green-400'
      case 'levelup': return 'text-[var(--color-brand-accent)]'
      case 'flee': return 'text-red-400'
      default: return 'text-[var(--color-text-secondary)]'
    }
  }

  return (
    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
      {MOCK_ACTIVITY.map(entry => (
        <div
          key={entry.id}
          className="texture-noise flex items-start gap-2 text-xs py-1.5 px-2 rounded-lg bg-[var(--color-surface-base)]/50"
        >
          <span className="shrink-0">{getActivityIcon(entry.type)}</span>
          <span className={cn("flex-1", getActivityColor(entry.type))}>{entry.message}</span>
          <span className="text-[var(--color-text-muted)] text-[10px] shrink-0">{entry.time}</span>
        </div>
      ))}
    </div>
  )
}

/** Mock Boost Card */
function MockBoostCard() {
  const timeLeft = Math.floor((MOCK_BOOST.endsAt - Date.now()) / 60000)

  return (
    <div className="texture-noise p-2.5 rounded-lg bg-gradient-to-r from-purple-900/30 to-purple-800/20 border border-purple-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <div>
            <div className="text-xs text-[var(--color-text-primary)] font-medium">XP Boost Active</div>
            <div className="text-[10px] text-[var(--color-text-muted)]">{timeLeft}m remaining</div>
          </div>
        </div>
        <span className="text-sm text-purple-400 font-mono font-bold">{MOCK_BOOST.multiplier}x</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-purple-900/50 overflow-hidden">
        <div className="h-full bg-purple-400 w-3/4" />
      </div>
    </div>
  )
}

/** Mock Party Column */
function MockPartyColumn() {
  return (
    <div className="h-full bg-[var(--color-surface-elevated)] border-l border-[var(--color-border-subtle)] p-3 flex flex-col gap-3 overflow-y-auto">
      {/* Party header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">⚔️</span>
        <span className="text-xs font-pixel text-[var(--color-text-primary)] uppercase tracking-wider">Party</span>
      </div>

      {/* Party */}
      <MockPartyPanel />

      {/* Boosts */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span>⚡</span>
          <span className="text-xs font-pixel text-[var(--color-text-primary)] uppercase tracking-wider">Boosts</span>
        </div>
        <MockBoostCard />
      </div>

      {/* Activity */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <span>📋</span>
          <span className="text-xs font-pixel text-[var(--color-text-primary)] uppercase tracking-wider">Activity</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <MockActivityLog />
        </div>
      </div>
    </div>
  )
}

/** Mock Social Sidebar */
function MockSocialSidebar() {
  return (
    <Card variant="default" padding="none" className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border-subtle)]">
        {[
          { label: '💬 Chat', active: true },
          { label: '👥 2', active: false, badge: true },
          { label: '🔄 Trades', active: false },
          { label: 'Guild', active: false },
        ].map((tab, i) => (
          <button
            key={i}
            className={cn(
              "flex-1 px-2 py-2 text-xs transition-colors relative",
              tab.active
                ? "text-[var(--color-text-primary)] border-b-2 border-[var(--color-brand-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            )}
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-1 px-1 py-0.5 text-[9px] bg-[var(--color-brand-secondary)] text-white rounded">1</span>
            )}
          </button>
        ))}
      </div>

      {/* Chat content */}
      <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto">
        <div className="p-2 rounded-lg bg-[var(--color-surface-base)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[var(--color-brand-primary)]">AshK</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">2m ago</span>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">Anyone want to trade? I have extra Eevees!</span>
        </div>
        <div className="p-2 rounded-lg bg-[var(--color-surface-base)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-purple-400">MistyW</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">1m ago</span>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">Looking for Water types! Will trade anything</span>
        </div>
        <div className="p-2 rounded-lg bg-[var(--color-surface-base)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-green-400">BrockP</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">30s ago</span>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">Just caught my first shiny! 🎉</span>
        </div>
      </div>

      {/* Input */}
      <div className="p-2 border-t border-[var(--color-border-subtle)]">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)]"
          />
          <Button size="sm">Send</Button>
        </div>
      </div>
    </Card>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MockGameScreen() {
  return (
    <div className="h-screen bg-[var(--color-surface-base)] flex flex-col overflow-hidden">
      {/* Header */}
      <MockHeader />

      {/* Ticker */}
      <MockTicker />

      {/* Main 3-column layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Map Sidebar */}
        <div className="w-64 shrink-0 hidden lg:block">
          <MockMapSidebar />
        </div>

        {/* Center: World + Social - balanced proportions */}
        <div className="flex-1 flex flex-col p-3 gap-3 min-w-0 overflow-hidden">
          {/* Zone content - constrained height, not taking all space */}
          <div className="h-64 shrink-0">
            <MockWorldView />
          </div>
          {/* Social/Chat - takes remaining space */}
          <div className="flex-1 min-h-0">
            <MockSocialSidebar />
          </div>
        </div>

        {/* Right: Party Column */}
        <div className="w-72 shrink-0 hidden lg:block">
          <MockPartyColumn />
        </div>
      </div>
    </div>
  )
}
