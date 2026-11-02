import observePageFullScreen from './observePageFullScreen'
import { processPosition, processSize } from '@/utils'
import { normalizePosition, normalizeSize } from '@/utils/settings'

const fullScreenContentScript = defineContentScript({
  matches: ['https://live.bilibili.com/*'],
  main(ctx) {
    const observer = observePageFullScreen()
    const listener = (message: unknown) => {
      if (!message || typeof message !== 'object')
        return
      if ('size' in message)
        processSize(normalizeSize(message.size))
      if ('position' in message)
        processPosition(normalizePosition(message.position))
    }
    browser.runtime.onMessage.addListener(listener)
    ctx.addEventListener(window, 'wxt:locationchange', observer.refresh)
    ctx.onInvalidated(() => {
      observer.stop()
      browser.runtime.onMessage.removeListener(listener)
    })
  },
})

export default fullScreenContentScript
