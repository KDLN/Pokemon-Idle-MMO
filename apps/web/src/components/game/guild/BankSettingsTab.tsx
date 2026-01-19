'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { BankCategory, GuildRole } from '@pokemon-idle/shared'

const ROLES: GuildRole[] = ['officer', 'member']
const CATEGORIES: BankCategory[] = ['currency', 'item', 'pokemon']

const CATEGORY_LABELS: Record<BankCategory, string> = {
  currency: 'Currency',
  item: 'Items',
  pokemon: 'Pokemon Points',
}

export function BankSettingsTab() {
  const [editingLimit, setEditingLimit] = useState<{ role: GuildRole; category: BankCategory } | null>(null)
  const [limitValue, setLimitValue] = useState('')
  const [pokemonPointsValue, setPokemonPointsValue] = useState('')

  const guildBank = useGameStore((state) => state.guildBank)
  const myGuildRole = useGameStore((state) => state.myGuildRole)

  if (!guildBank || myGuildRole !== 'leader') {
    return (
      <div className="p-4 text-slate-400 text-center">
        Only guild leaders can access bank settings.
      </div>
    )
  }

  const { limits } = guildBank

  const getLimit = (role: GuildRole, category: BankCategory) => {
    const limit = limits.find(l => l.role === role && l.category === category)
    return {
      daily_limit: limit?.daily_limit ?? 0,
      pokemon_points_limit: limit?.pokemon_points_limit ?? 0,
    }
  }

  const handleEditLimit = (role: GuildRole, category: BankCategory) => {
    const current = getLimit(role, category)
    setEditingLimit({ role, category })
    setLimitValue(current.daily_limit === -1 ? 'unlimited' : String(current.daily_limit))
    setPokemonPointsValue(String(current.pokemon_points_limit))
  }

  const handleSaveLimit = () => {
    if (!editingLimit) return

    const dailyLimit = limitValue.toLowerCase() === 'unlimited' ? -1 : parseInt(limitValue) || 0
    const pokemonPoints = editingLimit.category === 'pokemon' ? parseInt(pokemonPointsValue) || 0 : 0

    gameSocket.setBankLimit(editingLimit.role, editingLimit.category, dailyLimit, pokemonPoints)
    setEditingLimit(null)
    setLimitValue('')
    setPokemonPointsValue('')
  }

  const formatLimit = (value: number) => {
    if (value === -1) return 'Unlimited'
    if (value === 0) return 'No Access'
    return value.toLocaleString()
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h3 className="text-sm font-medium text-slate-400 mb-4">Daily Withdrawal Limits</h3>
      <p className="text-xs text-slate-500 mb-6">
        Configure how much each role can withdraw per day. Leaders always have unlimited access.
      </p>

      {/* Limits Table */}
      <div className="bg-slate-700/50 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700">
              <th className="text-left p-3 text-sm font-medium text-slate-300">Role</th>
              {CATEGORIES.map(cat => (
                <th key={cat} className="text-left p-3 text-sm font-medium text-slate-300">
                  {CATEGORY_LABELS[cat]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Leader row (read-only) */}
            <tr className="border-t border-slate-600">
              <td className="p-3 text-white font-medium">Leader</td>
              {CATEGORIES.map(cat => (
                <td key={cat} className="p-3 text-yellow-400">Unlimited</td>
              ))}
            </tr>

            {/* Configurable roles */}
            {ROLES.map(role => (
              <tr key={role} className="border-t border-slate-600">
                <td className="p-3 text-white font-medium capitalize">{role}</td>
                {CATEGORIES.map(cat => {
                  const current = getLimit(role, cat)
                  const isEditing = editingLimit?.role === role && editingLimit?.category === cat

                  return (
                    <td key={cat} className="p-3">
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={limitValue}
                            onChange={(e) => setLimitValue(e.target.value)}
                            placeholder="Amount or 'unlimited'"
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm text-white"
                          />
                          {cat === 'pokemon' && (
                            <input
                              type="number"
                              value={pokemonPointsValue}
                              onChange={(e) => setPokemonPointsValue(e.target.value)}
                              placeholder="Points limit"
                              className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm text-white"
                            />
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveLimit}
                              className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingLimit(null)}
                              className="flex-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditLimit(role, cat)}
                          className="text-left hover:text-yellow-400 transition-colors"
                        >
                          <span className={current.daily_limit === 0 ? 'text-red-400' : 'text-slate-300'}>
                            {formatLimit(current.daily_limit)}
                          </span>
                          {cat === 'pokemon' && current.pokemon_points_limit > 0 && (
                            <span className="text-slate-500 text-xs ml-1">
                              ({current.pokemon_points_limit} pts)
                            </span>
                          )}
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Help text */}
      <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
        <h4 className="text-sm font-medium text-slate-300 mb-2">Limit Values</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li><span className="text-yellow-400">Unlimited (-1):</span> No daily limit</li>
          <li><span className="text-red-400">No Access (0):</span> Cannot withdraw at all</li>
          <li><span className="text-slate-300">Number:</span> Maximum amount per day</li>
          <li><span className="text-slate-300">Pokemon Points:</span> Based on rarity (Common=1, Rare=5, Legendary=25)</li>
        </ul>
      </div>
    </div>
  )
}
