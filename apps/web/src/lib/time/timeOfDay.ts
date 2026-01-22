export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

export interface TimeColors {
  primary: string
  overlay: string
  gradient: string
  skyTop: string
  skyBottom: string
}

export const TIME_COLORS: Record<TimeOfDay, TimeColors> = {
  dawn: {
    primary: '#FFE4B5',
    overlay: 'rgba(255, 228, 181, 0.12)',
    gradient: 'linear-gradient(180deg, rgba(255, 200, 150, 0.15) 0%, transparent 100%)',
    skyTop: '#87CEEB',
    skyBottom: '#FFE4B5',
  },
  day: {
    primary: '#87CEEB',
    overlay: 'transparent',
    gradient: 'linear-gradient(180deg, rgba(135, 206, 235, 0.08) 0%, transparent 100%)',
    skyTop: '#4A90D9',
    skyBottom: '#87CEEB',
  },
  dusk: {
    primary: '#FF8C00',
    overlay: 'rgba(255, 140, 0, 0.15)',
    gradient: 'linear-gradient(180deg, rgba(255, 100, 50, 0.2) 0%, rgba(255, 180, 100, 0.1) 100%)',
    skyTop: '#FF6B35',
    skyBottom: '#FFB347',
  },
  night: {
    primary: '#191970',
    overlay: 'rgba(25, 25, 112, 0.35)',
    gradient: 'linear-gradient(180deg, rgba(10, 10, 50, 0.4) 0%, rgba(30, 30, 80, 0.2) 100%)',
    skyTop: '#0a0a32',
    skyBottom: '#1a1a50',
  },
}

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours()

  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'dusk'
  return 'night'
}

export function getTimeProgress(date: Date = new Date()): number {
  // Returns 0-1 representing progress through the current time period
  const hour = date.getHours()
  const minute = date.getMinutes()
  const totalMinutes = hour * 60 + minute

  if (hour >= 5 && hour < 8) {
    // Dawn: 5:00 - 8:00 (180 minutes)
    return (totalMinutes - 300) / 180
  }
  if (hour >= 8 && hour < 17) {
    // Day: 8:00 - 17:00 (540 minutes)
    return (totalMinutes - 480) / 540
  }
  if (hour >= 17 && hour < 20) {
    // Dusk: 17:00 - 20:00 (180 minutes)
    return (totalMinutes - 1020) / 180
  }
  // Night: 20:00 - 5:00 (540 minutes)
  if (hour >= 20) {
    return (totalMinutes - 1200) / 540
  }
  return (totalMinutes + 240) / 540
}

export function formatGameTime(date: Date = new Date()): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function getAmbientLightIntensity(timeOfDay: TimeOfDay): number {
  switch (timeOfDay) {
    case 'dawn':
      return 0.85
    case 'day':
      return 1.0
    case 'dusk':
      return 0.7
    case 'night':
      return 0.4
  }
}
