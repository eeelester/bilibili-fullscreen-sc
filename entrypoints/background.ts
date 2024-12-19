import { MATCH_URL } from '@/constant'
import { changeIcon } from '@/utils'

export default defineBackground(() => {
  let userSwitchState: boolean | null = null
  // tab处于活跃状态时获取当前tab的url，判断是否是b站直播页面，来显示icon的图标
  browser.tabs.onActivated.addListener(({ tabId }) => {
    void (async () => {
      const { url } = await browser.tabs.get(tabId)
      void processIcon(url)
    })()
  })

  // tab刷新及初次进来时获取当前tab的url，判断是否是b站直播页面，来显示icon的图标
  browser.tabs.onUpdated.addListener((_, { status }, { url }) => {
    if (status === 'complete')
      void processIcon(url)
  })

  browser.runtime.onMessage.addListener(({ switchState }: { switchState: boolean }) => {
    userSwitchState = switchState
  })

  /**
   * @description:
   *  url匹配，用户没动开关，true
        url匹配，用户开，true
        url匹配，用户关，false
        url不匹配，false
   * @return {*}
   */
  function processIcon(url: string | undefined) {
    url && MATCH_URL.test(url) && (userSwitchState || userSwitchState === null) ? void changeIcon(true) : void changeIcon(false)
  }
})
