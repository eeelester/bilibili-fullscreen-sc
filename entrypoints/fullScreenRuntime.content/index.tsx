import type { FullscreenMode } from '../fullScreen.content/fullscreenState'
import type { FullscreenRuntimeEventDetail } from '../fullScreen.content/runtimeBridge'
import { findVideoContext } from '../fullScreen.content/observePageFullScreen'
import { FULLSCREEN_RUNTIME_EVENT } from '../fullScreen.content/runtimeBridge'
import { mount, unmount } from '../fullScreen.content/utils'

const runtimeMarker = 'bilibiliFullscreenScRuntimeReady'

const fullScreenRuntimeContentScript = defineContentScript({
  matches: ['https://live.bilibili.com/*'],
  registration: 'runtime',
  cssInjectionMode: 'manual',
  main() {
    if (document.documentElement.dataset[runtimeMarker])
      return

    document.documentElement.dataset[runtimeMarker] = 'true'

    const handleFullscreenChange = (event: Event) => {
      const { mode } = (event as CustomEvent<FullscreenRuntimeEventDetail>).detail ?? {}
      if (!isFullscreenMode(mode))
        return

      if (mode === 'normal') {
        unmount()
        return
      }

      const target = findVideoContext()
      if (target)
        mount(target, mode)
    }

    document.addEventListener(FULLSCREEN_RUNTIME_EVENT, handleFullscreenChange)
    window.addEventListener('pagehide', () => {
      document.removeEventListener(FULLSCREEN_RUNTIME_EVENT, handleFullscreenChange)
      delete document.documentElement.dataset[runtimeMarker]
      unmount()
    }, { once: true })
  },
})

function isFullscreenMode(mode: unknown): mode is FullscreenMode {
  return mode === 'normal' || mode === 'page-fullscreen' || mode === 'native-fullscreen'
}

export default fullScreenRuntimeContentScript
