import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Player, Pokemon, Zone, EncounterTableEntry, PokemonSpecies, ChatChannel, ChatMessageEntry, Friend, FriendRequest, FriendStatus, Trade, TradeOffer, TradeRequest, TradeStatus, OutgoingTradeRequest, TradeHistoryEntry, TradeHistoryPokemon } from './types.js'

let supabase: SupabaseClient

export function initDatabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required')
  }

  supabase = createClient(url, key)
  return supabase
}

export function getSupabase() {
  return supabase
}

// Player queries
export async function getPlayerByUserId(userId: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Failed to get player:', error)
    return null
  }
  // Ensure badges is always an array (database default is '{}' but handle null just in case)
  return {
    ...data,
    badges: data.badges || []
  }
}

export async function getPlayerParty(playerId: string): Promise<(Pokemon | null)[]> {
  const { data, error } = await supabase
    .from('pokemon')
    .select('*, species:pokemon_species(*)')
    .eq('owner_id', playerId)
    .not('party_slot', 'is', null)
    .order('party_slot')

  if (error) {
    console.error('Failed to get party:', error)
    return [null, null, null, null, null, null]
  }

  // Convert to 6-slot array
  const party: (Pokemon | null)[] = [null, null, null, null, null, null]
  for (const pokemon of data || []) {
    if (pokemon.party_slot >= 1 && pokemon.party_slot <= 6) {
      party[pokemon.party_slot - 1] = pokemon
    }
  }
  return party
}

export async function getPlayerPokeballs(playerId: string): Promise<number> {
  const { data, error } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('player_id', playerId)
    .eq('item_id', 'pokeball')
    .single()

  if (error) return 0
  return data?.quantity || 0
}

export async function updatePlayerPokeballs(playerId: string, quantity: number): Promise<void> {
  await supabase
    .from('inventory')
    .upsert({ player_id: playerId, item_id: 'pokeball', quantity })
}

export async function getPlayerGreatBalls(playerId: string): Promise<number> {
  const { data, error } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('player_id', playerId)
    .eq('item_id', 'great_ball')
    .single()

  if (error) return 0
  return data?.quantity || 0
}

export async function updatePlayerGreatBalls(playerId: string, quantity: number): Promise<void> {
  await supabase
    .from('inventory')
    .upsert({ player_id: playerId, item_id: 'great_ball', quantity })
}

export async function updatePlayerLastOnline(playerId: string): Promise<void> {
  await supabase
    .from('players')
    .update({ last_online: new Date().toISOString() })
    .eq('id', playerId)
}

export async function updatePlayerZone(playerId: string, zoneId: number): Promise<void> {
  await supabase
    .from('players')
    .update({ current_zone_id: zoneId })
    .eq('id', playerId)
}

// Zone queries
export async function getZone(zoneId: number): Promise<Zone | null> {
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('id', zoneId)
    .single()

  if (error) {
    console.error('Failed to get zone:', error)
    return null
  }
  return data
}

export async function getConnectedZones(zoneId: number): Promise<Zone[]> {
  const { data, error } = await supabase
    .from('zone_connections')
    .select('to_zone_id')
    .eq('from_zone_id', zoneId)

  if (error || !data) return []

  const zoneIds = data.map(c => c.to_zone_id)
  const { data: zones } = await supabase
    .from('zones')
    .select('*')
    .in('id', zoneIds)

  return zones || []
}

export async function getEncounterTable(zoneId: number): Promise<EncounterTableEntry[]> {
  const { data, error } = await supabase
    .from('encounter_tables')
    .select(`
      zone_id,
      species_id,
      encounter_rate,
      species:pokemon_species(*)
    `)
    .eq('zone_id', zoneId)
    .order('encounter_rate', { ascending: false })

  if (error) {
    console.error('Failed to get encounter table:', error)
    return []
  }

  return (data || []).map(entry => ({
    zone_id: entry.zone_id,
    species_id: entry.species_id,
    encounter_rate: entry.encounter_rate,
    species: entry.species as unknown as PokemonSpecies
  }))
}

export async function getSpecies(speciesId: number): Promise<PokemonSpecies | null> {
  const { data, error } = await supabase
    .from('pokemon_species')
    .select('*')
    .eq('id', speciesId)
    .single()

  if (error) return null
  return data
}

// Pokemon mutations
export async function saveCaughtPokemon(
  playerId: string,
  species: PokemonSpecies,
  level: number,
  isShiny: boolean = false
): Promise<Pokemon | null> {
  const maxHp = Math.floor((2 * species.base_hp * level / 100) + level + 10)
  const attack = Math.floor((2 * species.base_attack * level / 100) + 5)
  const defense = Math.floor((2 * species.base_defense * level / 100) + 5)
  const spAttack = Math.floor((2 * species.base_sp_attack * level / 100) + 5)
  const spDefense = Math.floor((2 * species.base_sp_defense * level / 100) + 5)
  const speed = Math.floor((2 * species.base_speed * level / 100) + 5)

  const { data, error } = await supabase
    .from('pokemon')
    .insert({
      owner_id: playerId,
      species_id: species.id,
      level,
      xp: 0,
      current_hp: maxHp,
      max_hp: maxHp,
      stat_attack: attack,
      stat_defense: defense,
      stat_sp_attack: spAttack,
      stat_sp_defense: spDefense,
      stat_speed: speed,
      is_shiny: isShiny
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to save pokemon:', error)
    return null
  }
  return data
}

export async function updatePokedex(
  playerId: string,
  speciesId: number,
  caught: boolean
): Promise<void> {
  const { data: existing } = await supabase
    .from('pokedex_entries')
    .select('*')
    .eq('player_id', playerId)
    .eq('species_id', speciesId)
    .single()

  if (existing) {
    await supabase
      .from('pokedex_entries')
      .update({
        seen: true,
        caught: existing.caught || caught,
        catch_count: caught ? existing.catch_count + 1 : existing.catch_count,
        first_caught_at: existing.first_caught_at || (caught ? new Date().toISOString() : null)
      })
      .eq('player_id', playerId)
      .eq('species_id', speciesId)
  } else {
    await supabase
      .from('pokedex_entries')
      .insert({
        player_id: playerId,
        species_id: speciesId,
        seen: true,
        caught,
        catch_count: caught ? 1 : 0,
        first_caught_at: caught ? new Date().toISOString() : null
      })
  }
}

export async function updatePokemonStats(pokemon: Pokemon): Promise<void> {
  await supabase
    .from('pokemon')
    .update({
      level: pokemon.level,
      xp: pokemon.xp,
      max_hp: pokemon.max_hp,
      current_hp: pokemon.current_hp,
      stat_attack: pokemon.stat_attack,
      stat_defense: pokemon.stat_defense,
      stat_sp_attack: pokemon.stat_sp_attack,
      stat_sp_defense: pokemon.stat_sp_defense,
      stat_speed: pokemon.stat_speed
    })
    .eq('id', pokemon.id)
}

// Update Pokemon's species after evolution (also updates stats)
// Includes ownership check for security - only the owner can evolve their Pokemon
export async function evolvePokemon(
  pokemonId: string,
  ownerId: string,
  newSpeciesId: number,
  newStats: {
    max_hp: number
    stat_attack: number
    stat_defense: number
    stat_sp_attack: number
    stat_sp_defense: number
    stat_speed: number
  }
): Promise<boolean> {
  const { error, count } = await supabase
    .from('pokemon')
    .update({
      species_id: newSpeciesId,
      max_hp: newStats.max_hp,
      current_hp: newStats.max_hp, // Full heal on evolution
      stat_attack: newStats.stat_attack,
      stat_defense: newStats.stat_defense,
      stat_sp_attack: newStats.stat_sp_attack,
      stat_sp_defense: newStats.stat_sp_defense,
      stat_speed: newStats.stat_speed
    })
    .eq('id', pokemonId)
    .eq('owner_id', ownerId) // Verify ownership for security

  if (error) {
    console.error('Failed to evolve Pokemon:', error)
    return false
  }

  // Check that we actually updated a row (ownership check passed)
  if (count === 0) {
    console.error('Pokemon not found or ownership check failed')
    return false
  }

  return true
}

// Update only a Pokemon's current HP - includes ownership check for security
export async function updatePokemonHP(
  pokemonId: string,
  currentHp: number,
  ownerId?: string
): Promise<boolean> {
  let query = supabase
    .from('pokemon')
    .update({ current_hp: currentHp })
    .eq('id', pokemonId)

  // If ownerId provided, verify ownership (defense in depth)
  if (ownerId) {
    query = query.eq('owner_id', ownerId)
  }

  const { data, error } = await query.select()

  if (error) {
    console.error('Failed to update Pokemon HP:', error)
    return false
  }

  // If no rows were updated, either Pokemon doesn't exist or ownership check failed
  if (!data || data.length === 0) {
    console.error('Pokemon HP update failed: no matching Pokemon found')
    return false
  }

  return true
}

export async function getPlayerBox(playerId: string): Promise<Pokemon[]> {
  const { data, error } = await supabase
    .from('pokemon')
    .select('*')
    .eq('owner_id', playerId)
    .is('party_slot', null)
    .order('caught_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function swapPartyMember(
  playerId: string,
  boxPokemonId: string,
  partySlot: number
): Promise<boolean> {
  // Clear current slot
  await supabase
    .from('pokemon')
    .update({ party_slot: null })
    .eq('owner_id', playerId)
    .eq('party_slot', partySlot)

  // Move box pokemon to party
  const { error } = await supabase
    .from('pokemon')
    .update({ party_slot: partySlot })
    .eq('id', boxPokemonId)
    .eq('owner_id', playerId)

  return !error
}

// Remove a Pokemon from party (move to box)
export async function removeFromParty(
  playerId: string,
  partySlot: number
): Promise<boolean> {
  const { error } = await supabase
    .from('pokemon')
    .update({ party_slot: null })
    .eq('owner_id', playerId)
    .eq('party_slot', partySlot)

  return !error
}

export async function savePokemonXP(pokemonId: string, xp: number): Promise<void> {
  await supabase
    .from('pokemon')
    .update({ xp })
    .eq('id', pokemonId)
}

// Update player's Pokedollars
export async function updatePlayerMoney(playerId: string, amount: number): Promise<void> {
  await supabase
    .from('players')
    .update({ pokedollars: amount })
    .eq('id', playerId)
}

// Shop items
export const SHOP_ITEMS = [
  { id: 'pokeball', name: 'Poke Ball', description: 'A device for catching wild Pokemon', price: 200, effect_type: 'ball' as const },
  { id: 'great_ball', name: 'Great Ball', description: 'A good ball with a higher catch rate', price: 600, effect_type: 'great_ball' as const },
  { id: 'potion', name: 'Potion', description: 'Restores 20 HP to one Pokemon', price: 300, effect_type: 'potion' as const },
  { id: 'super_potion', name: 'Super Potion', description: 'Restores 50 HP to one Pokemon', price: 700, effect_type: 'super_potion' as const },
]

// Buy an item from the shop
export async function buyItem(
  playerId: string,
  itemId: string,
  quantity: number,
  currentMoney: number
): Promise<{ success: boolean; newMoney: number; newQuantity: number; error?: string }> {
  const item = SHOP_ITEMS.find(i => i.id === itemId)
  if (!item) {
    return { success: false, newMoney: currentMoney, newQuantity: 0, error: 'Item not found' }
  }

  const totalCost = item.price * quantity
  if (currentMoney < totalCost) {
    return { success: false, newMoney: currentMoney, newQuantity: 0, error: 'Not enough money' }
  }

  const newMoney = currentMoney - totalCost

  // Update player money
  await supabase
    .from('players')
    .update({ pokedollars: newMoney })
    .eq('id', playerId)

  // Update inventory
  const { data: existing } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('player_id', playerId)
    .eq('item_id', itemId)
    .single()

  const currentQuantity = existing?.quantity || 0
  const newQuantity = currentQuantity + quantity

  await supabase
    .from('inventory')
    .upsert({ player_id: playerId, item_id: itemId, quantity: newQuantity })

  return { success: true, newMoney, newQuantity }
}

// Get player inventory
export async function getPlayerInventory(playerId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('inventory')
    .select('item_id, quantity')
    .eq('player_id', playerId)

  if (error) return {}

  const inventory: Record<string, number> = {}
  for (const item of data || []) {
    inventory[item.item_id] = item.quantity
  }
  return inventory
}

// Add an inventory item (increment quantity) - used for refunds/compensation
export async function addInventoryItem(
  playerId: string,
  itemId: string,
  quantity: number = 1
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('player_id', playerId)
    .eq('item_id', itemId)
    .single()

  const currentQuantity = existing?.quantity || 0
  const newQuantity = currentQuantity + quantity

  const { error } = await supabase
    .from('inventory')
    .upsert({ player_id: playerId, item_id: itemId, quantity: newQuantity })

  if (error) {
    console.error('Failed to add inventory item:', error)
    return false
  }
  return true
}

// Use an inventory item (decrement quantity) - uses optimistic locking to prevent race conditions
export async function useInventoryItem(
  playerId: string,
  itemId: string,
  quantity: number = 1
): Promise<{ success: boolean; newQuantity: number; error?: string }> {
  // Read current quantity
  const { data: existing } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('player_id', playerId)
    .eq('item_id', itemId)
    .single()

  const currentQuantity = existing?.quantity || 0
  if (currentQuantity < quantity) {
    return { success: false, newQuantity: currentQuantity, error: 'Not enough items' }
  }

  const newQuantity = currentQuantity - quantity

  // Use optimistic locking: only update if quantity hasn't changed since we read it
  // This prevents race conditions where two concurrent operations both try to use the same item
  if (newQuantity === 0) {
    // Delete the row and use .select() to verify deletion happened
    const { data, error } = await supabase
      .from('inventory')
      .delete()
      .eq('player_id', playerId)
      .eq('item_id', itemId)
      .eq('quantity', currentQuantity) // Optimistic lock
      .select()

    // If no rows were deleted, another operation modified the quantity
    if (error || !data || data.length === 0) {
      return { success: false, newQuantity: currentQuantity, error: 'Item was modified, please try again' }
    }
  } else {
    // Update and use .select() to verify update happened
    const { data, error } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('player_id', playerId)
      .eq('item_id', itemId)
      .eq('quantity', currentQuantity) // Optimistic lock
      .select()

    // If no rows were updated, another operation modified the quantity
    if (error || !data || data.length === 0) {
      return { success: false, newQuantity: currentQuantity, error: 'Item was modified, please try again' }
    }
  }

  return { success: true, newQuantity }
}

// Get potion heal amount by item id
export function getPotionHealAmount(itemId: string): number {
  switch (itemId) {
    case 'potion':
      return 20
    case 'super_potion':
      return 50
    case 'hyper_potion':
      return 200
    case 'max_potion':
      return 9999 // Full heal
    default:
      return 0
  }
}

interface ChatMessageRow {
  id: string
  player_id: string
  channel: ChatChannel
  content: string
  created_at: string
  player?: { username?: string } | { username?: string }[] | null
}

// Helper to extract username from Supabase join result (handles both object and array formats)
function extractUsername(player: ChatMessageRow['player']): string {
  if (!player) return 'Unknown'
  if (Array.isArray(player)) {
    return player[0]?.username || 'Unknown'
  }
  return player.username || 'Unknown'
}

export async function getRecentChatMessages(limit = 50): Promise<ChatMessageEntry[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      id,
      player_id,
      channel,
      content,
      created_at,
      player:players(username)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to load chat messages:', error)
    return []
  }

  const rows = (data || []) as ChatMessageRow[]

  return rows.map((row) => ({
    id: row.id,
    player_id: row.player_id,
    player_name: extractUsername(row.player),
    channel: row.channel,
    content: row.content,
    created_at: row.created_at,
  }))
}

export async function saveChatMessage(
  playerId: string,
  channel: ChatChannel,
  content: string
): Promise<ChatMessageEntry | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      player_id: playerId,
      channel,
      content,
    })
    .select(`
      id,
      player_id,
      channel,
      content,
      created_at,
      player:players(username)
    `)
    .single()

  if (error || !data) {
    console.error('Failed to save chat message:', error)
    return null
  }

  return {
    id: data.id,
    player_id: data.player_id,
    player_name: extractUsername(data.player as ChatMessageRow['player']),
    channel: data.channel,
    content: data.content,
    created_at: data.created_at,
  }
}

// ============================================
// GYM QUERIES
// ============================================

export interface GymLeader {
  id: string
  name: string
  title: string
  badge_id: string
  badge_name: string
  specialty_type: string
  zone_id: number
  dialog_intro: string
  dialog_win: string
  dialog_lose: string
  reward_money: number
  reward_badge_points: number
  required_badges: string[]
  team: GymLeaderPokemon[]
}

export interface GymLeaderPokemon {
  species_id: number
  species_name: string
  level: number
  slot: number
  type1: string
  type2: string | null
  species?: PokemonSpecies
}

// Get gym leader for a zone
export async function getGymLeaderByZone(zoneId: number): Promise<GymLeader | null> {
  const { data: leader, error } = await supabase
    .from('gym_leaders')
    .select('*')
    .eq('zone_id', zoneId)
    .eq('is_active', true)
    .single()

  if (error || !leader) {
    return null
  }

  // Get the gym leader's team
  const { data: teamData } = await supabase
    .from('gym_leader_pokemon')
    .select(`
      species_id,
      level,
      slot,
      species:pokemon_species(id, name, type1, type2, base_hp, base_attack, base_defense, base_sp_attack, base_sp_defense, base_speed, base_catch_rate, base_xp_yield)
    `)
    .eq('gym_leader_id', leader.id)
    .order('slot')

  const team: GymLeaderPokemon[] = (teamData || []).map(p => ({
    species_id: p.species_id,
    species_name: (p.species as unknown as PokemonSpecies)?.name || 'Unknown',
    level: p.level,
    slot: p.slot,
    type1: (p.species as unknown as PokemonSpecies)?.type1 || 'Normal',
    type2: (p.species as unknown as PokemonSpecies)?.type2 || null,
    species: p.species as unknown as PokemonSpecies
  }))

  return {
    id: leader.id,
    name: leader.name,
    title: leader.title,
    badge_id: leader.badge_id,
    badge_name: leader.badge_name,
    specialty_type: leader.specialty_type,
    zone_id: leader.zone_id,
    dialog_intro: leader.dialog_intro,
    dialog_win: leader.dialog_win,
    dialog_lose: leader.dialog_lose,
    reward_money: leader.reward_money,
    reward_badge_points: leader.reward_badge_points,
    required_badges: leader.required_badges || [],
    team
  }
}

// Check if player has already beaten a gym
export async function hasPlayerDefeatedGym(playerId: string, gymLeaderId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('player_gym_progress')
    .select('defeated_at')
    .eq('player_id', playerId)
    .eq('gym_leader_id', gymLeaderId)
    .single()

  return !error && !!data
}

// Record gym victory
export async function recordGymVictory(
  playerId: string,
  gymLeaderId: string,
  bestPokemonLevel: number
): Promise<void> {
  // Check if already defeated
  const alreadyDefeated = await hasPlayerDefeatedGym(playerId, gymLeaderId)

  if (alreadyDefeated) {
    // Just increment attempts
    await supabase
      .from('player_gym_progress')
      .update({ attempts: supabase.rpc('increment_attempts') })
      .eq('player_id', playerId)
      .eq('gym_leader_id', gymLeaderId)
  } else {
    // Record first victory
    await supabase
      .from('player_gym_progress')
      .insert({
        player_id: playerId,
        gym_leader_id: gymLeaderId,
        best_pokemon_level: bestPokemonLevel,
        attempts: 1
      })
  }
}

// Add badge to player
export async function addBadgeToPlayer(playerId: string, badgeId: string): Promise<void> {
  // First get current badges
  const { data: player } = await supabase
    .from('players')
    .select('badges')
    .eq('id', playerId)
    .single()

  const currentBadges: string[] = player?.badges || []

  if (!currentBadges.includes(badgeId)) {
    await supabase
      .from('players')
      .update({ badges: [...currentBadges, badgeId] })
      .eq('id', playerId)
  }
}

// Get player badges
export async function getPlayerBadges(playerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('players')
    .select('badges')
    .eq('id', playerId)
    .single()

  if (error) return []
  return data?.badges || []
}

// ============================================
// FRIEND QUERIES
// ============================================

// Get player by username (for friend requests)
export async function getPlayerByUsername(username: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .ilike('username', username)
    .single()

  if (error) return null
  return {
    ...data,
    badges: data.badges || []
  }
}

// Send a friend request
export async function sendFriendRequest(
  playerId: string,
  friendPlayerId: string
): Promise<{ success: boolean; error?: string; friend_id?: string }> {
  // Check for existing relationship (in either direction) using two separate queries
  // to avoid string interpolation in .or() clause
  const [{ data: sentByMe }, { data: sentByThem }] = await Promise.all([
    supabase
      .from('friends')
      .select('friend_id, status, player_id')
      .eq('player_id', playerId)
      .eq('friend_player_id', friendPlayerId),
    supabase
      .from('friends')
      .select('friend_id, status, player_id')
      .eq('player_id', friendPlayerId)
      .eq('friend_player_id', playerId)
  ])

  const existing = [...(sentByMe || []), ...(sentByThem || [])]

  if (existing && existing.length > 0) {
    const record = existing[0]
    if (record.status === 'accepted') {
      return { success: false, error: 'Already friends' }
    }
    if (record.status === 'pending') {
      // If the other player sent us a request, auto-accept it
      // Note: In rare cases of simultaneous requests, this creates a race condition.
      // The unique_friend_pair constraint prevents duplicate records, so the worst case
      // is that one request fails with "already sent" error - the user can retry.
      if (record.player_id === friendPlayerId) {
        const { error } = await supabase
          .from('friends')
          .update({ status: 'accepted' })
          .eq('friend_id', record.friend_id)

        if (error) return { success: false, error: 'Failed to accept request' }
        return { success: true, friend_id: record.friend_id }
      }
      return { success: false, error: 'Friend request already sent' }
    }
    if (record.status === 'blocked') {
      return { success: false, error: 'Cannot send request' }
    }
  }

  // Create new friend request
  const { data, error } = await supabase
    .from('friends')
    .insert({
      player_id: playerId,
      friend_player_id: friendPlayerId,
      status: 'pending'
    })
    .select('friend_id')
    .single()

  if (error) {
    console.error('Failed to send friend request:', error)
    return { success: false, error: 'Failed to send request' }
  }

  return { success: true, friend_id: data.friend_id }
}

// Accept a friend request
export async function acceptFriendRequest(
  playerId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  // Verify the request exists and is for this player
  const { data: request, error: fetchError } = await supabase
    .from('friends')
    .select('*')
    .eq('friend_id', friendId)
    .eq('friend_player_id', playerId)
    .eq('status', 'pending')
    .single()

  if (fetchError || !request) {
    return { success: false, error: 'Friend request not found' }
  }

  // Update with all conditions for defense in depth
  const { data, error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('friend_id', friendId)
    .eq('friend_player_id', playerId)
    .eq('status', 'pending')
    .select()

  if (error) {
    console.error('Failed to accept friend request:', error)
    return { success: false, error: 'Failed to accept request' }
  }

  if (!data || data.length === 0) {
    return { success: false, error: 'Friend request not found or already processed' }
  }

  return { success: true }
}

// Decline or cancel a friend request
export async function declineFriendRequest(
  playerId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  // First verify the request exists and player is involved
  const { data: request, error: fetchError } = await supabase
    .from('friends')
    .select('friend_id, player_id, friend_player_id')
    .eq('friend_id', friendId)
    .eq('status', 'pending')
    .single()

  if (fetchError || !request) {
    console.error('Decline friend request - not found:', fetchError)
    return { success: false, error: 'Friend request not found' }
  }

  // Verify player is part of this relationship
  if (request.player_id !== playerId && request.friend_player_id !== playerId) {
    return { success: false, error: 'Friend request not found' }
  }

  // Delete the request
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('friend_id', friendId)

  if (error) {
    console.error('Failed to decline friend request:', error)
    return { success: false, error: 'Failed to decline request' }
  }

  return { success: true }
}

// Helper to extract username from Supabase join result
function extractUsernameFromJoin(player: unknown): string {
  if (!player) return 'Unknown'
  if (Array.isArray(player)) {
    return (player[0] as { username?: string })?.username || 'Unknown'
  }
  return (player as { username?: string }).username || 'Unknown'
}

// Get incoming friend requests
export async function getIncomingFriendRequests(playerId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friends')
    .select(`
      friend_id,
      player_id,
      created_at,
      sender:players!friends_player_id_fkey(username)
    `)
    .eq('friend_player_id', playerId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get incoming friend requests:', error)
    return []
  }

  if (!data) return []

  return data.map(row => ({
    friend_id: row.friend_id,
    from_player_id: row.player_id,
    from_username: extractUsernameFromJoin(row.sender),
    created_at: row.created_at
  }))
}

// Get outgoing friend requests
export async function getOutgoingFriendRequests(playerId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friends')
    .select(`
      friend_id,
      friend_player_id,
      created_at,
      recipient:players!friends_friend_player_id_fkey(username)
    `)
    .eq('player_id', playerId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get outgoing friend requests:', error)
    return []
  }

  if (!data) return []

  return data.map(row => ({
    friend_id: row.friend_id,
    from_player_id: row.friend_player_id,
    from_username: extractUsernameFromJoin(row.recipient),
    created_at: row.created_at
  }))
}

// Helper to extract player data from Supabase join result (includes zone info for Issue #14)
// Type for joined player data including zone
interface JoinedPlayerData {
  username?: string
  last_online?: string
  current_zone_id?: number
  zone?: { name?: string } | { name?: string }[]
}

function extractPlayerFromJoin(player: unknown): JoinedPlayerData | null {
  if (!player) return null
  if (Array.isArray(player)) {
    return (player[0] as JoinedPlayerData) || null
  }
  return player as JoinedPlayerData
}

// Extract zone name from joined data (handles both object and array forms)
function extractZoneName(playerData: JoinedPlayerData | null): string | undefined {
  if (!playerData?.zone) return undefined
  const zone = playerData.zone
  if (Array.isArray(zone)) {
    return zone[0]?.name
  }
  return zone.name
}

// Get accepted friends list - uses JOIN for single query optimization
// Includes zone info for Issue #14 (friend zone visibility)
export async function getFriendsList(playerId: string): Promise<Friend[]> {
  // Query friends where player is either the requester or recipient
  // Use two queries to avoid string interpolation in OR clause
  // Include current_zone_id from players and join zone name
  const [{ data: sentByMe, error: err1 }, { data: sentToMe, error: err2 }] = await Promise.all([
    supabase
      .from('friends')
      .select(`
        friend_id,
        player_id,
        friend_player_id,
        status,
        created_at,
        friend:players!friends_friend_player_id_fkey(username, last_online, current_zone_id, zone:zones(name))
      `)
      .eq('status', 'accepted')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('friends')
      .select(`
        friend_id,
        player_id,
        friend_player_id,
        status,
        created_at,
        friend:players!friends_player_id_fkey(username, last_online, current_zone_id, zone:zones(name))
      `)
      .eq('status', 'accepted')
      .eq('friend_player_id', playerId)
      .order('created_at', { ascending: false })
  ])

  if (err1) console.error('Failed to get friends list (sent):', err1)
  if (err2) console.error('Failed to get friends list (received):', err2)

  // Debug: Log the raw results to help diagnose asymmetric friend issues
  console.log(`getFriendsList(${playerId}): sentByMe=${sentByMe?.length || 0}, sentToMe=${sentToMe?.length || 0}`)
  if (sentByMe && sentByMe.length > 0) {
    console.log(`  sentByMe[0]:`, JSON.stringify(sentByMe[0], null, 2))
  }
  if (sentToMe && sentToMe.length > 0) {
    console.log(`  sentToMe[0]:`, JSON.stringify(sentToMe[0], null, 2))
  }

  const allFriends = [...(sentByMe || []), ...(sentToMe || [])]

  return allFriends.map(row => {
    const friendData = extractPlayerFromJoin(row.friend)

    return {
      friend_id: row.friend_id,
      player_id: row.player_id,
      friend_player_id: row.friend_player_id,
      status: row.status as FriendStatus,
      created_at: row.created_at,
      friend_username: friendData?.username,
      friend_last_online: friendData?.last_online,
      zone_id: friendData?.current_zone_id,
      zone_name: extractZoneName(friendData)
    }
  })
}

// Remove a friend
export async function removeFriend(
  playerId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  // First verify the friendship exists and player is involved
  const { data: friendship, error: fetchError } = await supabase
    .from('friends')
    .select('friend_id, player_id, friend_player_id')
    .eq('friend_id', friendId)
    .eq('status', 'accepted')
    .single()

  if (fetchError || !friendship) {
    console.error('Remove friend - not found:', fetchError)
    return { success: false, error: 'Friend not found' }
  }

  // Verify player is part of this friendship
  if (friendship.player_id !== playerId && friendship.friend_player_id !== playerId) {
    return { success: false, error: 'Friend not found' }
  }

  // Delete the friendship
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('friend_id', friendId)

  if (error) {
    console.error('Failed to remove friend:', error)
    return { success: false, error: 'Failed to remove friend' }
  }

  return { success: true }
}

// Get players in a specific zone who were online recently
export async function getPlayersInZone(
  zoneId: number,
  excludePlayerId?: string,
  minutesAgo: number = 2
): Promise<{ id: string; username: string }[]> {
  const cutoff = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()

  let query = supabase
    .from('players')
    .select('id, username')
    .eq('current_zone_id', zoneId)
    .gte('last_online', cutoff)

  if (excludePlayerId) {
    query = query.neq('id', excludePlayerId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to get players in zone:', error)
    return []
  }

  return data || []
}

// ============================================
// TRADE QUERIES
// ============================================

// Check if two players are friends
export async function arePlayersFriends(
  playerId: string,
  otherPlayerId: string
): Promise<boolean> {
  const [{ data: sentByMe }, { data: sentByThem }] = await Promise.all([
    supabase
      .from('friends')
      .select('friend_id')
      .eq('player_id', playerId)
      .eq('friend_player_id', otherPlayerId)
      .eq('status', 'accepted'),
    supabase
      .from('friends')
      .select('friend_id')
      .eq('player_id', otherPlayerId)
      .eq('friend_player_id', playerId)
      .eq('status', 'accepted')
  ])

  return Boolean((sentByMe && sentByMe.length > 0) || (sentByThem && sentByThem.length > 0))
}

// Create a trade request
export async function createTradeRequest(
  senderId: string,
  receiverId: string
): Promise<{ success: boolean; error?: string; trade_id?: string }> {
  // Skip the pre-check for existing trades - rely on the unique index constraint
  // This avoids SQL injection risk from string interpolation in .or() and eliminates
  // the race condition between check and insert.
  // The unique partial index idx_unique_pending_trade will reject duplicates.

  const { data, error } = await supabase
    .from('trades')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending'
    })
    .select('trade_id')
    .single()

  if (error) {
    console.error('Failed to create trade request:', error)
    // Check for unique constraint violation (duplicate pending trade)
    if (error.code === '23505') {
      return { success: false, error: 'Trade already pending with this player' }
    }
    return { success: false, error: 'Failed to create trade request' }
  }

  return { success: true, trade_id: data.trade_id }
}

// Get a trade by ID with validation that player is part of it
export async function getTrade(
  tradeId: string,
  playerId: string
): Promise<Trade | null> {
  // Use two separate queries to avoid string interpolation in .or() clause
  // This prevents SQL injection vulnerability
  const [{ data: asSender }, { data: asReceiver }] = await Promise.all([
    supabase
      .from('trades')
      .select(`
        trade_id,
        sender_id,
        receiver_id,
        status,
        created_at,
        updated_at,
        sender:players!trades_sender_id_fkey(username),
        receiver:players!trades_receiver_id_fkey(username)
      `)
      .eq('trade_id', tradeId)
      .eq('sender_id', playerId)
      .maybeSingle(),
    supabase
      .from('trades')
      .select(`
        trade_id,
        sender_id,
        receiver_id,
        status,
        created_at,
        updated_at,
        sender:players!trades_sender_id_fkey(username),
        receiver:players!trades_receiver_id_fkey(username)
      `)
      .eq('trade_id', tradeId)
      .eq('receiver_id', playerId)
      .maybeSingle()
  ])

  const data = asSender || asReceiver
  if (!data) return null

  return {
    trade_id: data.trade_id,
    sender_id: data.sender_id,
    receiver_id: data.receiver_id,
    status: data.status as TradeStatus,
    created_at: data.created_at,
    updated_at: data.updated_at,
    sender_username: extractUsernameFromJoin(data.sender),
    receiver_username: extractUsernameFromJoin(data.receiver)
  }
}

// Get incoming trade requests for a player (includes pending and accepted)
export async function getIncomingTradeRequests(playerId: string): Promise<TradeRequest[]> {
  const { data, error } = await supabase
    .from('trades')
    .select(`
      trade_id,
      sender_id,
      status,
      created_at,
      sender:players!trades_sender_id_fkey(username)
    `)
    .eq('receiver_id', playerId)
    .in('status', ['pending', 'accepted'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get incoming trade requests:', error)
    return []
  }

  if (!data) return []

  return data.map(row => ({
    trade_id: row.trade_id,
    from_player_id: row.sender_id,
    from_username: extractUsernameFromJoin(row.sender),
    status: row.status as TradeStatus,
    created_at: row.created_at
  }))
}

// Get outgoing trade requests for a player (includes pending and accepted)
export async function getOutgoingTradeRequests(playerId: string): Promise<OutgoingTradeRequest[]> {
  const { data, error } = await supabase
    .from('trades')
    .select(`
      trade_id,
      receiver_id,
      status,
      created_at,
      receiver:players!trades_receiver_id_fkey(username)
    `)
    .eq('sender_id', playerId)
    .in('status', ['pending', 'accepted'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get outgoing trade requests:', error)
    return []
  }

  if (!data) return []

  return data.map(row => ({
    trade_id: row.trade_id,
    to_player_id: row.receiver_id,
    to_username: extractUsernameFromJoin(row.receiver),
    status: row.status as TradeStatus,
    created_at: row.created_at
  }))
}

// Get all active trade IDs for a player (for cleanup on disconnect)
export async function getActiveTradeIds(playerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('trade_id')
    .or(`sender_id.eq.${playerId},receiver_id.eq.${playerId}`)
    .in('status', ['pending', 'accepted'])

  if (error) {
    console.error('Failed to get active trade IDs:', error)
    return []
  }

  return data?.map(row => row.trade_id) || []
}

// Update trade status
export async function updateTradeStatus(
  tradeId: string,
  playerId: string,
  newStatus: TradeStatus
): Promise<{ success: boolean; error?: string }> {
  // Verify player is part of this trade
  const { data: trade, error: fetchError } = await supabase
    .from('trades')
    .select('trade_id, sender_id, receiver_id, status')
    .eq('trade_id', tradeId)
    .single()

  if (fetchError || !trade) {
    return { success: false, error: 'Trade not found' }
  }

  // Verify player is part of this trade
  if (trade.sender_id !== playerId && trade.receiver_id !== playerId) {
    return { success: false, error: 'Trade not found' }
  }

  // Verify trade is still pending
  if (trade.status !== 'pending') {
    return { success: false, error: 'Trade is no longer pending' }
  }

  // Validate status transitions:
  // - Sender can cancel
  // - Receiver can accept or decline
  if (newStatus === 'cancelled' && trade.sender_id !== playerId) {
    return { success: false, error: 'Only sender can cancel trade' }
  }

  if ((newStatus === 'accepted' || newStatus === 'declined') && trade.receiver_id !== playerId) {
    return { success: false, error: 'Only receiver can accept or decline trade' }
  }

  // Update with optimistic lock and verify the update succeeded
  const { data, error } = await supabase
    .from('trades')
    .update({ status: newStatus })
    .eq('trade_id', tradeId)
    .eq('status', 'pending') // Optimistic lock - only update if still pending
    .select()

  if (error) {
    console.error('Failed to update trade status:', error)
    return { success: false, error: 'Failed to update trade' }
  }

  // If no rows were updated, the trade was modified by another operation
  // (e.g., already cancelled, accepted, or declined)
  if (!data || data.length === 0) {
    return { success: false, error: 'Trade was already processed or modified' }
  }

  return { success: true }
}

// Cancel a trade request (sender only)
export async function cancelTradeRequest(
  tradeId: string,
  playerId: string
): Promise<{ success: boolean; error?: string }> {
  return updateTradeStatus(tradeId, playerId, 'cancelled')
}

// Accept a trade request (receiver only)
export async function acceptTradeRequest(
  tradeId: string,
  playerId: string
): Promise<{ success: boolean; error?: string }> {
  return updateTradeStatus(tradeId, playerId, 'accepted')
}

// Decline a trade request (receiver only)
export async function declineTradeRequest(
  tradeId: string,
  playerId: string
): Promise<{ success: boolean; error?: string }> {
  return updateTradeStatus(tradeId, playerId, 'declined')
}

// Complete a trade - transfers Pokemon ownership atomically
// This calls the database function that handles the actual transfer
export async function completeTrade(
  tradeId: string
): Promise<{ success: boolean; error?: string; transferred_count?: number }> {
  const { data, error } = await supabase
    .rpc('complete_trade', { p_trade_id: tradeId })

  if (error) {
    console.error('Failed to complete trade:', error.message, error.code, error.details, error.hint)
    // Return the actual Supabase error message for debugging
    return { success: false, error: error.message || 'Failed to complete trade' }
  }

  // The function returns a JSON object
  const result = data as { success: boolean; error?: string; transferred_count?: number }
  return result
}

// Add a Pokemon offer to a trade
// SECURITY: Verifies trade participation first, then Pokemon ownership
// NOTE: Party warnings returned from this function are ADVISORY ONLY.
// The queries to count party Pokemon are not transactional, so the warning
// may be inaccurate if concurrent modifications occur. The real validation
// happens in complete_trade() with proper row locking.
export async function addTradeOffer(
  tradeId: string,
  pokemonId: string,
  playerId: string
): Promise<{ success: boolean; error?: string; warning?: string }> {
  // SECURITY: First verify player is part of this trade (before revealing any Pokemon info)
  const { data: trade, error: tradeError } = await supabase
    .from('trades')
    .select('sender_id, receiver_id, status')
    .eq('trade_id', tradeId)
    .single()

  if (tradeError || !trade) {
    return { success: false, error: 'Trade not found' }
  }

  if (trade.sender_id !== playerId && trade.receiver_id !== playerId) {
    return { success: false, error: 'Trade not found' } // Generic message to avoid info leak
  }

  // Allow adding offers to both pending and accepted trades
  if (trade.status !== 'pending' && trade.status !== 'accepted') {
    return { success: false, error: 'Trade is no longer active' }
  }

  // Now verify the Pokemon belongs to the player
  const { data: pokemon, error: pokemonError } = await supabase
    .from('pokemon')
    .select('id, owner_id, party_slot')
    .eq('id', pokemonId)
    .eq('owner_id', playerId)
    .single()

  if (pokemonError || !pokemon) {
    // Generic message to avoid revealing whether Pokemon exists but is owned by someone else
    return { success: false, error: 'Invalid Pokemon' }
  }

  // Check if this is a party Pokemon and warn about party safety
  let warning: string | undefined
  if (pokemon.party_slot !== null) {
    // Count how many party Pokemon the player has
    const { count: partyCount } = await supabase
      .from('pokemon')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', playerId)
      .not('party_slot', 'is', null)

    // Count how many party Pokemon are already in this trade
    const { data: existingOffers } = await supabase
      .from('trade_offers')
      .select('pokemon_id')
      .eq('trade_id', tradeId)
      .eq('offered_by', playerId)

    const offeredPokemonIds = (existingOffers || []).map(o => o.pokemon_id)

    // Count how many of those are party Pokemon (only if we have existing offers)
    let alreadyOfferedPartyCount = 0
    if (offeredPokemonIds.length > 0) {
      const { count } = await supabase
        .from('pokemon')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', playerId)
        .not('party_slot', 'is', null)
        .in('id', offeredPokemonIds)
      alreadyOfferedPartyCount = count || 0
    }

    const totalPartyOffered = alreadyOfferedPartyCount + 1 // +1 for the one we're adding now

    if (partyCount && totalPartyOffered >= partyCount) {
      warning = 'Warning: This would offer all your party Pokemon. Trade will fail if completed.'
    } else if (partyCount && totalPartyOffered === partyCount - 1) {
      warning = 'Warning: You would only have 1 party Pokemon left if this trade completes.'
    }
  }

  // Add the offer
  const { error } = await supabase
    .from('trade_offers')
    .insert({
      trade_id: tradeId,
      pokemon_id: pokemonId,
      offered_by: playerId
    })

  if (error) {
    console.error('Failed to add trade offer:', error)
    if (error.code === '23505') {
      return { success: false, error: 'Pokemon already offered in this trade' }
    }
    return { success: false, error: 'Failed to add offer' }
  }

  return { success: true, warning }
}

// Remove a Pokemon offer from a trade
export async function removeTradeOffer(
  tradeId: string,
  pokemonId: string,
  playerId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('trade_offers')
    .delete()
    .eq('trade_id', tradeId)
    .eq('pokemon_id', pokemonId)
    .eq('offered_by', playerId)
    .select()

  if (error) {
    console.error('Failed to remove trade offer:', error)
    return { success: false, error: 'Failed to remove offer' }
  }

  if (!data || data.length === 0) {
    return { success: false, error: 'Offer not found' }
  }

  return { success: true }
}

// Get all offers for a trade
export async function getTradeOffers(
  tradeId: string
): Promise<TradeOffer[]> {
  const { data, error } = await supabase
    .from('trade_offers')
    .select(`
      offer_id,
      trade_id,
      pokemon_id,
      offered_by,
      created_at,
      pokemon:pokemon(id, species_id, nickname, level, is_shiny, species:pokemon_species(name))
    `)
    .eq('trade_id', tradeId)

  if (error) {
    console.error('Failed to get trade offers:', error)
    return []
  }

  return (data || []).map(row => {
    // Supabase returns joined data in various formats depending on relation
    // Safely extract Pokemon data handling both object and array returns
    const pokemonRaw = row.pokemon
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pokemonData: any = Array.isArray(pokemonRaw) ? pokemonRaw[0] : pokemonRaw

    if (!pokemonData) {
      return {
        offer_id: row.offer_id,
        trade_id: row.trade_id,
        pokemon_id: row.pokemon_id,
        offered_by: row.offered_by,
        created_at: row.created_at,
        pokemon: undefined
      }
    }

    // Extract species name from nested join (could be array or object)
    const speciesRaw = pokemonData.species
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const speciesData: any = Array.isArray(speciesRaw) ? speciesRaw[0] : speciesRaw

    return {
      offer_id: row.offer_id,
      trade_id: row.trade_id,
      pokemon_id: row.pokemon_id,
      offered_by: row.offered_by,
      created_at: row.created_at,
      pokemon: {
        id: pokemonData.id,
        species_id: pokemonData.species_id,
        nickname: pokemonData.nickname,
        level: pokemonData.level,
        is_shiny: pokemonData.is_shiny,
        species: speciesData ? { name: speciesData.name } : undefined
      }
    }
  })
}

// ============================================
// TRADE HISTORY QUERIES
// ============================================

/**
 * Get trade history for a player
 * @param playerId - The player's ID
 * @param limit - Max number of records (default 50)
 * @param partnerUsername - Optional filter by trade partner username
 */
export async function getTradeHistory(
  playerId: string,
  limit: number = 50,
  partnerUsername?: string
): Promise<TradeHistoryEntry[]> {
  // Fetch trades where player is either party
  // We fetch more than limit when filtering to ensure we get enough results after filtering
  const fetchLimit = partnerUsername ? limit * 3 : limit

  const { data, error } = await supabase
    .from('trade_history')
    .select('*')
    .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
    .order('completed_at', { ascending: false })
    .limit(fetchLimit)

  if (error) {
    console.error('Failed to get trade history:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let results = (data || []).map((row: any) => ({
    id: row.id,
    trade_id: row.trade_id,
    player1_id: row.player1_id,
    player1_username: row.player1_username,
    player2_id: row.player2_id,
    player2_username: row.player2_username,
    player1_pokemon: row.player1_pokemon as TradeHistoryPokemon[],
    player2_pokemon: row.player2_pokemon as TradeHistoryPokemon[],
    completed_at: row.completed_at
  }))

  // Filter by partner username in application code to prevent SQL injection
  // The partner is the OTHER player in each trade
  if (partnerUsername) {
    const searchTerm = partnerUsername.trim().toLowerCase()
    results = results.filter(entry => {
      const isPlayer1 = entry.player1_id === playerId
      const partnerName = isPlayer1 ? entry.player2_username : entry.player1_username
      return partnerName.toLowerCase().includes(searchTerm)
    })
  }

  // Apply limit after filtering
  return results.slice(0, limit)
}

// ============================================
// MUSEUM QUERIES
// ============================================

// Check if player has museum membership
export async function getMuseumMembership(playerId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('players')
    .select('museum_member')
    .eq('id', playerId)
    .single()

  if (error) {
    console.error('Failed to get museum membership:', error)
    return false
  }

  return data?.museum_member || false
}

// Purchase museum membership (one-time 50 currency fee)
// Uses optimistic locking to prevent race conditions - only updates if not already a member
export async function purchaseMuseumMembership(
  playerId: string,
  currentMoney: number
): Promise<{ success: boolean; newMoney: number; error?: string }> {
  const MEMBERSHIP_COST = 50

  if (currentMoney < MEMBERSHIP_COST) {
    return { success: false, newMoney: currentMoney, error: 'Not enough money' }
  }

  const newMoney = currentMoney - MEMBERSHIP_COST

  // Update player: deduct money and grant membership
  // Guard with museum_member = false to prevent race condition where two concurrent
  // requests both see "not a member" and both deduct currency
  const { data, error } = await supabase
    .from('players')
    .update({
      pokedollars: newMoney,
      museum_member: true
    })
    .eq('id', playerId)
    .eq('museum_member', false) // Optimistic lock - only update if not already a member
    .select()

  if (error) {
    console.error('Failed to purchase museum membership:', error)
    return { success: false, newMoney: currentMoney, error: 'Failed to purchase membership' }
  }

  // If no rows were updated, player is already a member (race condition prevented)
  if (!data || data.length === 0) {
    return { success: false, newMoney: currentMoney, error: 'Already a member' }
  }

  return { success: true, newMoney }
}
