'use client'

import { cn } from '@/lib/ui'

interface ClassicBattleHudProps {
  name: string
  level: number
  currentHp: number
  maxHp: number
  showHpNumbers?: boolean
  showExpBar?: boolean
  expPercent?: number
  side: 'enemy' | 'player'
  gender?: 'male' | 'female' | null
}

function getHpBarColor(percent: number): string {
  if (percent > 50) return 'bg-[#70b840]'
  if (percent > 20) return 'bg-[#f8c830]'
  return 'bg-[#e84848]'
}

export function ClassicBattleHud({
  name,
  level,
  currentHp,
  maxHp,
  showHpNumbers = false,
  showExpBar = false,
  expPercent = 0,
  side,
  gender
}: ClassicBattleHudProps) {
  const hpPercent = maxHp > 0 ? (currentHp / maxHp) * 100 : 0

  return (
    <div
      className={cn(
        'classic-hud relative',
        side === 'enemy' ? 'classic-hud-enemy' : 'classic-hud-player'
      )}
    >
      {/* Main HUD box with notched corner effect */}
      <div className="classic-hud-box">
        {/* Top row: Name and Level */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1">
            <span className="classic-hud-name">{name.toUpperCase()}</span>
            {gender === 'male' && <span className="text-[#5090d0] text-xs">♂</span>}
            {gender === 'female' && <span className="text-[#e86080] text-xs">♀</span>}
          </div>
          <span className="classic-hud-level">
            <span className="text-[#484848] text-[9px] mr-0.5">Lv</span>
            {level}
          </span>
        </div>

        {/* HP Bar row */}
        <div className="flex items-center gap-1.5">
          <span className="classic-hp-label">HP</span>
          <div className="classic-hp-bar-container flex-1">
            <div className="classic-hp-bar-bg">
              <div
                className={cn('classic-hp-bar-fill', getHpBarColor(hpPercent))}
                style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }}
              />
            </div>
          </div>
        </div>

        {/* HP Numbers (player side only) */}
        {showHpNumbers && (
          <div className="flex justify-end mt-0.5">
            <span className="classic-hp-numbers">
              {Math.max(0, currentHp)}<span className="text-[#585858]">/</span>{maxHp}
            </span>
          </div>
        )}

        {/* EXP Bar (player side only) */}
        {showExpBar && (
          <div className="flex items-center gap-1 mt-1">
            <div className="classic-exp-bar-container flex-1">
              <div className="classic-exp-bar-bg">
                <div
                  className="classic-exp-bar-fill"
                  style={{ width: `${Math.max(0, Math.min(100, expPercent))}%` }}
                />
              </div>
            </div>
            <span className="classic-exp-label">EXP</span>
          </div>
        )}
      </div>

      {/* Decorative notch for enemy HUD */}
      {side === 'enemy' && <div className="classic-hud-notch" />}
    </div>
  )
}

// Battle arena with classic layout
interface ClassicBattleArenaProps {
  playerPokemon: {
    name: string
    level: number
    currentHp: number
    maxHp: number
    sprite: string
    expPercent?: number
  }
  enemyPokemon: {
    name: string
    level: number
    currentHp: number
    maxHp: number
    sprite: string
  }
  messageText?: string
  children?: React.ReactNode
  showAttackAnimation?: 'player' | 'enemy' | null
  showDamageFlash?: 'player' | 'enemy' | null
}

export function ClassicBattleArena({
  playerPokemon,
  enemyPokemon,
  messageText,
  children,
  showAttackAnimation,
  showDamageFlash
}: ClassicBattleArenaProps) {
  return (
    <div className="classic-battle-arena">
      {/* Background gradient for grassy field */}
      <div className="classic-battle-bg" />

      {/* Enemy side (top) */}
      <div className="classic-enemy-area">
        {/* Enemy HUD - top left */}
        <div className="classic-enemy-hud-position">
          <ClassicBattleHud
            name={enemyPokemon.name}
            level={enemyPokemon.level}
            currentHp={enemyPokemon.currentHp}
            maxHp={enemyPokemon.maxHp}
            side="enemy"
          />
        </div>

        {/* Enemy Pokemon + Platform - right side */}
        <div className="classic-enemy-pokemon-area">
          <div className="classic-platform-enemy" />
          <div
            className={cn(
              'classic-enemy-sprite',
              showAttackAnimation === 'enemy' && 'animate-attack-lunge-wild',
              showDamageFlash === 'enemy' && 'animate-damage-flash'
            )}
          >
            <img
              src={enemyPokemon.sprite}
              alt={enemyPokemon.name}
              className="w-full h-full pixelated"
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Player side (bottom) */}
      <div className="classic-player-area">
        {/* Player Pokemon + Platform - left side */}
        <div className="classic-player-pokemon-area">
          <div className="classic-platform-player" />
          <div
            className={cn(
              'classic-player-sprite',
              showAttackAnimation === 'player' && 'animate-attack-lunge',
              showDamageFlash === 'player' && 'animate-damage-flash'
            )}
          >
            <img
              src={playerPokemon.sprite}
              alt={playerPokemon.name}
              className="w-full h-full pixelated"
              draggable={false}
            />
          </div>
        </div>

        {/* Player HUD - bottom right */}
        <div className="classic-player-hud-position">
          <ClassicBattleHud
            name={playerPokemon.name}
            level={playerPokemon.level}
            currentHp={playerPokemon.currentHp}
            maxHp={playerPokemon.maxHp}
            showHpNumbers
            showExpBar
            expPercent={playerPokemon.expPercent ?? 0}
            side="player"
          />
        </div>
      </div>

      {/* Message box at bottom */}
      <div className="classic-message-box">
        <p className="classic-message-text">
          {messageText || '\u00A0'}
        </p>
        {children}
      </div>
    </div>
  )
}
