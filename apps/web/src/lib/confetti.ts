import confetti from 'canvas-confetti'

/**
 * Fire celebration confetti
 * Used when guild quests are completed
 */
export function fireConfetti(): void {
  // Fire from both sides
  const duration = 2000
  const end = Date.now() + duration

  const colors = ['#ffd700', '#ffb347', '#ff6961', '#77dd77', '#aec6cf']

  ;(function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}

/**
 * Fire a burst of confetti at a specific element
 */
export function fireConfettiAtElement(element: HTMLElement): void {
  const rect = element.getBoundingClientRect()
  const x = (rect.left + rect.width / 2) / window.innerWidth
  const y = (rect.top + rect.height / 2) / window.innerHeight

  confetti({
    particleCount: 50,
    spread: 60,
    origin: { x, y },
    colors: ['#ffd700', '#ffb347', '#ff6961', '#77dd77', '#aec6cf'],
  })
}
