import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GameShell } from '@/components/game/GameShell'

export default async function GamePage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Check if player exists
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('user_id', session.user.id)
    .single()

  if (!player) {
    // User is authenticated but hasn't created a player yet
    redirect('/signup')
  }

  return <GameShell accessToken={session.access_token} />
}
