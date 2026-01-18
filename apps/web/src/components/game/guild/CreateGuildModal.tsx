'use client'

import { useState } from 'react'
import { gameSocket } from '@/lib/ws/gameSocket'

interface CreateGuildModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateGuildModal({ isOpen, onClose }: CreateGuildModalProps) {
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (name.length < 3 || name.length > 30) {
      setError('Guild name must be 3-30 characters')
      return
    }
    if (!/^[a-zA-Z0-9 ]+$/.test(name)) {
      setError('Guild name can only contain letters, numbers, and spaces')
      return
    }
    if (tag.length < 2 || tag.length > 5) {
      setError('Guild tag must be 2-5 characters')
      return
    }
    if (!/^[a-zA-Z0-9]+$/.test(tag)) {
      setError('Guild tag can only contain letters and numbers')
      return
    }

    gameSocket.createGuild(name.trim(), tag.trim().toUpperCase(), description.trim() || undefined)

    // Reset form and close
    setName('')
    setTag('')
    setDescription('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Create Guild</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Guild Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Guild"
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              maxLength={30}
            />
            <p className="text-xs text-gray-500 mt-1">3-30 characters, letters, numbers, spaces only</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Guild Tag</label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase())}
              placeholder="TAG"
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none uppercase"
              maxLength={5}
            />
            <p className="text-xs text-gray-500 mt-1">2-5 characters, shown as [TAG]</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell players about your guild..."
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
              maxLength={500}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              Create Guild
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
