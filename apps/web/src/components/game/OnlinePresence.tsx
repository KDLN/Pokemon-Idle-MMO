'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGameStore } from '@/stores/gameStore'

interface OnlinePlayer {
  id: string
  username: string
  current_zone_id: number
  last_online: string
}

export function OnlinePresence() {
  const [playersInZone, setPlayersInZone] = useState<OnlinePlayer[]>([])
  const currentZone = useGameStore((state) => state.currentZone)
  const player = useGameStore((state) => state.player)

  useEffect(() => {
    if (!currentZone || !player) return

    const supabase = createClient()

    // Initial fetch
    fetchPlayersInZone()

    // Set up realtime subscription for presence
    const channel = supabase
      .channel('online-players')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `current_zone_id=eq.${currentZone.id}`,
        },
        () => {
          fetchPlayersInZone()
        }
      )
      .subscribe()

    // Poll every 30 seconds as backup
    const interval = setInterval(fetchPlayersInZone, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [currentZone?.id, player?.id])

  async function fetchPlayersInZone() {
    if (!currentZone || !player) return

    try {
      const supabase = createClient()

      // Get players in same zone who were online in last 2 minutes
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('players')
        .select('id, username, current_zone_id, last_online')
        .eq('current_zone_id', currentZone.id)
        .gte('last_online', twoMinutesAgo)
        .neq('id', player.id) // Exclude self

      setPlayersInZone(data || [])
    } catch (err) {
      console.error('Failed to fetch online players:', err)
    }
  }

  if (!currentZone) return null

  return (
    <div className="bg-[#0f0f1a]/60 rounded-xl border border-[#2a2a4a] p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#606080]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          <h3 className="text-xs font-semibold text-[#606080] uppercase tracking-wider">Trainers Nearby</h3>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-400">{playersInZone.length + 1}</span>
        </div>
      </div>

      {playersInZone.length === 0 ? (
        <div className="flex items-center gap-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#1a1a2e] border border-[#2a2a4a] flex items-center justify-center">
            <svg className="w-4 h-4 text-[#3a3a6a]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div className="text-sm text-[#606080]">No other trainers here</div>
        </div>
      ) : (
        <div className="space-y-2">
          {playersInZone.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 py-1.5 px-2 rounded-lg bg-[#1a1a2e]/50 hover:bg-[#1a1a2e] transition-colors"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5B6EEA] to-[#3B4CCA] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {p.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-white truncate">{p.username}</span>
              {/* Online indicator */}
              <div className="ml-auto w-2 h-2 bg-green-400 rounded-full" />
            </div>
          ))}
          {playersInZone.length > 5 && (
            <div className="text-xs text-[#606080] text-center py-1">
              +{playersInZone.length - 5} more trainers
            </div>
          )}
        </div>
      )}
    </div>
  )
}
