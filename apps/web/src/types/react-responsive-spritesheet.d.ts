declare module 'react-responsive-spritesheet' {
  import { Component, CSSProperties, RefObject } from 'react'

  export interface SpritesheetInstance {
    play: () => void
    pause: () => void
    goToAndPlay: (frame: number) => void
    goToAndPause: (frame: number) => void
    setStartAt: (frame: number) => void
    setEndAt: (frame: number) => void
    setFps: (fps: number) => void
    setDirection: (direction: 'forward' | 'rewind') => void
    getInfo: (type: 'frame' | 'fps' | 'steps' | 'width' | 'height' | 'scale' | 'direction' | 'isPlaying' | 'isPaused' | 'completeLoopCycles') => number | string | boolean
  }

  export interface SpritesheetProps {
    /** Sprite sheet image URL */
    image: string
    /** Width of each frame in pixels */
    widthFrame: number
    /** Height of each frame in pixels */
    heightFrame: number
    /** Total number of animation frames */
    steps: number
    /** Frames per second */
    fps: number
    /** Auto-start animation (default: true) */
    autoplay?: boolean
    /** Loop animation (default: true) */
    loop?: boolean
    /** Starting frame (default: 0) */
    startAt?: number
    /** Ending frame (default: steps - 1) */
    endAt?: number
    /** Animation direction */
    direction?: 'forward' | 'rewind'
    /** Callback to get spritesheet instance */
    getInstance?: (instance: SpritesheetInstance) => void
    /** Callback when image loads */
    onLoad?: (spritesheet: SpritesheetInstance) => void
    /** Callback when image fails to load */
    onError?: (error: Error) => void
    /** Callback on loop complete */
    onLoopComplete?: (spritesheet: SpritesheetInstance) => void
    /** Callback on each frame */
    onEnterFrame?: (currentFrame: number, spritesheet: SpritesheetInstance) => void
    /** Callback on animation pause */
    onPause?: (spritesheet: SpritesheetInstance) => void
    /** Callback on animation play */
    onPlay?: (spritesheet: SpritesheetInstance) => void
    /** Container className */
    className?: string
    /** Container style */
    style?: CSSProperties
    /** Background size */
    backgroundSize?: string
    /** Background position */
    backgroundPosition?: string
    /** Background repeat */
    backgroundRepeat?: string
    /** Timeout before autoplay starts */
    timeout?: number
    /** Whether using retina display */
    isResponsive?: boolean
    /** Click handler */
    onClick?: (spritesheet: SpritesheetInstance) => void
    /** Double click handler */
    onDoubleClick?: (spritesheet: SpritesheetInstance) => void
    /** Mouse enter handler */
    onMouseEnter?: (spritesheet: SpritesheetInstance) => void
    /** Mouse leave handler */
    onMouseLeave?: (spritesheet: SpritesheetInstance) => void
    /** Mouse move handler */
    onMouseMove?: (spritesheet: SpritesheetInstance) => void
    /** Mouse down handler */
    onMouseDown?: (spritesheet: SpritesheetInstance) => void
    /** Mouse up handler */
    onMouseUp?: (spritesheet: SpritesheetInstance) => void
  }

  export default class Spritesheet extends Component<SpritesheetProps> {
    play: () => void
    pause: () => void
    goToAndPlay: (frame: number) => void
    goToAndPause: (frame: number) => void
    setStartAt: (frame: number) => void
    setEndAt: (frame: number) => void
    setFps: (fps: number) => void
    setDirection: (direction: 'forward' | 'rewind') => void
    getInfo: (type: 'frame' | 'fps' | 'steps' | 'width' | 'height' | 'scale' | 'direction' | 'isPlaying' | 'isPaused' | 'completeLoopCycles') => number | string | boolean
  }
}
