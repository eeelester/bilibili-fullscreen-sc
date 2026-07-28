export type FullscreenMode = 'normal' | 'page-fullscreen' | 'native-fullscreen'

interface FullscreenSnapshot {
  hasNativeFullscreen: boolean
  videoWidth: number
  viewportWidth: number
}

interface FullscreenStateHandlers<T> {
  onActivate: (target: T, mode: Exclude<FullscreenMode, 'normal'>) => void
  onDeactivate: () => void
}

function determineFullscreenMode(snapshot: FullscreenSnapshot): FullscreenMode {
  if (snapshot.hasNativeFullscreen)
    return 'native-fullscreen'

  if (snapshot.videoWidth > 0 && Math.abs(snapshot.videoWidth - snapshot.viewportWidth) < 2)
    return 'page-fullscreen'

  return 'normal'
}

class FullscreenStateController<T> {
  private mode: FullscreenMode = 'normal'
  private target: T | null = null

  constructor(private readonly handlers: FullscreenStateHandlers<T>) {}

  update(mode: FullscreenMode, target: T | null) {
    if (mode === 'normal' || !target) {
      if (this.mode !== 'normal')
        this.handlers.onDeactivate()

      this.mode = 'normal'
      this.target = null
      return
    }

    if (this.mode === 'normal') {
      this.mode = mode
      this.target = target
      this.handlers.onActivate(target, mode)
      return
    }

    if (this.target !== target) {
      this.handlers.onDeactivate()
      this.mode = mode
      this.target = target
      this.handlers.onActivate(target, mode)
      return
    }

    this.mode = mode
  }

  deactivate() {
    this.update('normal', null)
  }

  get activeTarget() {
    return this.target
  }
}

export { determineFullscreenMode, FullscreenStateController }
