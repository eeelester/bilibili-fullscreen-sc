import type { VideoContext } from './observePageFullScreen'
import { FullscreenStateController } from './fullscreenState'
import { observePageFullscreen } from './observePageFullScreen'
import { dispatchFullscreenRuntimeEvent, ENSURE_FULLSCREEN_RUNTIME_MESSAGE, isEnsureFullscreenRuntimeResponse } from './runtimeBridge'

let activationId = 0

const fullScreenContentScript = defineContentScript({
  matches: ['https://live.bilibili.com/*'],
  main() {
    const controller = new FullscreenStateController<VideoContext>({
      onActivate(target, mode) {
        const currentActivationId = ++activationId
        void browser.runtime.sendMessage({ type: ENSURE_FULLSCREEN_RUNTIME_MESSAGE }).then((response: unknown) => {
          if (!isEnsureFullscreenRuntimeResponse(response) || !response.ok)
            throw new Error('Fullscreen runtime injection was rejected')

          if (currentActivationId !== activationId || controller.activeTarget !== target)
            return

          dispatchFullscreenRuntimeEvent(mode)
        }).catch((error) => {
          console.error('加载全屏 SC 功能失败:', error)
        })
      },
      onDeactivate() {
        activationId += 1
        dispatchFullscreenRuntimeEvent('normal')
      },
    })

    const stopObserving = observePageFullscreen(({ mode, target }) => {
      controller.update(mode, target)
    })

    window.addEventListener('pagehide', () => {
      stopObserving()
      controller.deactivate()
    }, { once: true })
  },
})

export default fullScreenContentScript
