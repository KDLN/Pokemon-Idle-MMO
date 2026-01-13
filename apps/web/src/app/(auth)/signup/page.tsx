'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { STARTER_POKEMON, getPokemonSpriteUrl } from '@/types/game'

type SignupStep = 'credentials' | 'username' | 'starter'

export default function SignupPage() {
  const [step, setStep] = useState<SignupStep>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [selectedStarter, setSelectedStarter] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('Signup response:', { data, error })

      if (error) {
        setError(error.message)
        return
      }

      // If email confirmation is disabled, user is auto-logged in
      // If not, we need to sign them in manually
      if (!data.session) {
        console.log('No session after signup, signing in...')
        // Sign in immediately after signup
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        console.log('Sign in response:', { signInData, signInError })
        if (signInError) {
          setError(signInError.message)
          return
        }
      }

      // Verify we have a session
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session after auth:', session)

      if (!session) {
        setError('Failed to establish session. Please try logging in.')
        return
      }

      setStep('username')
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (username.length < 3 || username.length > 20) {
      setError('Username must be 3-20 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Check if username is available
      const { data: available } = await supabase.rpc('is_username_available', {
        p_username: username,
      })

      if (!available) {
        setError('Username is already taken')
        return
      }

      setStep('starter')
    } catch (err) {
      setError('Failed to check username')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStarterSubmit = async () => {
    if (!selectedStarter) {
      setError('Please select a starter Pokemon')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session in handleStarterSubmit:', session)

      if (!session?.user) {
        setError('Not logged in - session lost. Please refresh and try again.')
        return
      }

      const user = session.user

      // Create player with starter
      const { error: createError } = await supabase.rpc('create_new_player', {
        p_user_id: user.id,
        p_username: username,
        p_starter_species_id: selectedStarter,
      })

      if (createError) {
        setError(createError.message)
        return
      }

      router.push('/game')
    } catch (err) {
      setError('Failed to create player')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-3xl font-bold text-white">Pokemon Idle MMO</h1>
          <p className="text-gray-400 mt-2">
            {step === 'credentials' && 'Create your account'}
            {step === 'username' && 'Choose your trainer name'}
            {step === 'starter' && 'Choose your starter Pokemon'}
          </p>
        </div>

        {/* Step Progress */}
        <div className="flex justify-center gap-2 mb-6">
          {['credentials', 'username', 'starter'].map((s, i) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full ${
                step === s ? 'bg-blue-500' : i < ['credentials', 'username', 'starter'].indexOf(step) ? 'bg-green-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Credentials */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="trainer@pokemon.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Creating account...' : 'Continue'}
              </button>
            </form>
          )}

          {/* Step 2: Username */}
          {step === 'username' && (
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                  Trainer Name
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="Ash_Ketchum"
                />
                <p className="text-xs text-gray-500 mt-1">3-20 characters, letters, numbers, and underscores only</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </form>
          )}

          {/* Step 3: Starter Selection */}
          {step === 'starter' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {STARTER_POKEMON.map((starter) => (
                  <button
                    key={starter.id}
                    onClick={() => setSelectedStarter(starter.id)}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${selectedStarter === starter.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }
                    `}
                  >
                    <img
                      src={getPokemonSpriteUrl(starter.id)}
                      alt={starter.name}
                      className="w-16 h-16 mx-auto pixelated"
                    />
                    <div className="text-center mt-2">
                      <div className="text-sm font-medium text-white">{starter.name}</div>
                      <div className="text-xs text-gray-400">{starter.type}</div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleStarterSubmit}
                disabled={loading || !selectedStarter}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Starting adventure...' : 'Start Adventure!'}
              </button>
            </div>
          )}

          {step === 'credentials' && (
            <div className="mt-6 text-center">
              <span className="text-gray-500">Already have an account? </span>
              <Link href="/login" className="text-blue-400 hover:text-blue-300">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
