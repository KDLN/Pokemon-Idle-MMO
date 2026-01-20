'use client'

import {
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

/**
 * Configure drag sensors for party reordering
 * - Mouse: 8px movement threshold before drag starts
 * - Touch: 300ms hold before drag starts (prevents accidental drags)
 * - Keyboard: Arrow keys for accessibility
 */
export function useDragSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (mouse)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,     // 300ms hold before drag starts (per CONTEXT.md)
        tolerance: 5,   // 5px movement tolerance during hold
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
}
