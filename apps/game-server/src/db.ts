import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Player, Pokemon, Zone, EncounterTableEntry, PokemonSpecies, ChatChannel, ChatMessageEntry } from './types.js'

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
  return data
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
  player?: { username?: string }[]
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
    player_name: row.player?.[0]?.username || 'System',
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
    player_name: data.player?.[0]?.username || 'System',
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
