'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'

export function BankCurrencyTab() {
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit')

  const guildBank = useGameStore((state) => state.guildBank)
  const pokedollars = useGameStore((state) => state.pokedollars)
  const myGuildRole = useGameStore((state) => state.myGuildRole)
  const myBankLimits = useGameStore((state) => state.myBankLimits)

  if (!guildBank || !guildBank.currency) return null

  const { currency } = guildBank
  const playerBalance = pokedollars || 0
  const numAmount = parseInt(amount) || 0

  const canWithdraw = myGuildRole === 'leader' || myGuildRole === 'officer'
  const remainingLimit = myBankLimits?.currency ?? -1 // -1 = unlimited

  const handleSubmit = () => {
    if (numAmount <= 0) return

    if (mode === 'deposit') {
      if (numAmount > playerBalance) return
      gameSocket.depositCurrency(numAmount)
    } else {
      if (numAmount > currency.balance) return
      if (remainingLimit !== -1 && numAmount > remainingLimit) return
      gameSocket.withdrawCurrency(numAmount)
    }
    setAmount('')
  }

  const handleMax = () => {
    if (mode === 'deposit') {
      const maxDeposit = Math.min(playerBalance, currency.max_capacity - currency.balance)
      setAmount(String(Math.max(0, maxDeposit)))
    } else {
      const maxWithdraw = remainingLimit === -1
        ? currency.balance
        : Math.min(currency.balance, remainingLimit)
      setAmount(String(Math.max(0, maxWithdraw)))
    }
  }

  const isValidAmount = numAmount > 0 && (
    mode === 'deposit'
      ? numAmount <= playerBalance && currency.balance + numAmount <= currency.max_capacity
      : numAmount <= currency.balance && (remainingLimit === -1 || numAmount <= remainingLimit)
  )

  return (
    <div className="p-4 h-full flex flex-col gap-4">
      {/* Balance Display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Guild Bank</div>
          <div className="text-2xl font-bold text-yellow-400">
            {currency.balance.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">
            / {currency.max_capacity.toLocaleString()} max
          </div>
          <div className="mt-2 bg-slate-600 rounded-full h-2 overflow-hidden">
            <div
              className="bg-yellow-400 h-full transition-all"
              style={{ width: `${(currency.balance / currency.max_capacity) * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Your Balance</div>
          <div className="text-2xl font-bold text-white">
            {playerBalance.toLocaleString()}
          </div>
          {canWithdraw && remainingLimit !== -1 && (
            <div className="text-xs text-slate-500 mt-2">
              Daily limit remaining: {remainingLimit.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('deposit')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            mode === 'deposit'
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          Deposit
        </button>
        {canWithdraw && (
          <button
            onClick={() => setMode('withdraw')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              mode === 'withdraw'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            Withdraw
          </button>
        )}
      </div>

      {/* Amount Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-yellow-400"
          />
          <button
            onClick={handleMax}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-yellow-400 hover:text-yellow-300"
          >
            MAX
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!isValidAmount}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isValidAmount
              ? mode === 'deposit'
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-orange-600 hover:bg-orange-500 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          {mode === 'deposit' ? 'Deposit' : 'Withdraw'}
        </button>
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex gap-2">
        {[100, 500, 1000, 5000, 10000].map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(String(preset))}
            className="flex-1 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
          >
            {preset >= 1000 ? `${preset / 1000}k` : preset}
          </button>
        ))}
      </div>

      {/* Member Request Option (for non-officers) */}
      {!canWithdraw && (
        <div className="mt-auto p-4 bg-slate-700/30 rounded-lg">
          <p className="text-sm text-slate-400 mb-2">
            Only Officers and Leaders can withdraw currency. You can request a withdrawal:
          </p>
          <button
            onClick={() => {
              if (numAmount > 0) {
                gameSocket.createBankRequest('currency', { amount: numAmount })
              }
            }}
            disabled={numAmount <= 0 || numAmount > currency.balance}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
          >
            Request {numAmount > 0 ? numAmount.toLocaleString() : 'Amount'}
          </button>
        </div>
      )}
    </div>
  )
}
