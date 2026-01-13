import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // If logged in, redirect to game
  if (session) {
    redirect('/game')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="text-8xl mb-6">🎮</div>
        <h1 className="text-5xl font-bold text-white mb-4">
          Pokemon Idle MMO
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          An idle adventure where your trainer explores, catches, and battles —
          even while you&apos;re away. Set your strategy and watch your collection grow!
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Start Your Adventure
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">🌿</div>
          <h3 className="text-lg font-semibold text-white mb-2">Auto-Explore</h3>
          <p className="text-gray-400 text-sm">
            Your trainer wanders through routes, encountering wild Pokemon automatically.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">🔴</div>
          <h3 className="text-lg font-semibold text-white mb-2">Catch &apos;Em All</h3>
          <p className="text-gray-400 text-sm">
            Set your strategy and watch your Pokedex fill up with new catches.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">⬆️</div>
          <h3 className="text-lg font-semibold text-white mb-2">Level Up</h3>
          <p className="text-gray-400 text-sm">
            Your Pokemon gain XP from battles and grow stronger over time.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-600 text-sm">
        <p>A fan project. Pokemon is a trademark of Nintendo/Game Freak.</p>
      </footer>
    </div>
  )
}
