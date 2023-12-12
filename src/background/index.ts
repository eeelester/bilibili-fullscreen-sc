import { MATCH_URL } from '@/constant'
import { changeIcon } from '@/utils'

// tab处于活跃状态时获取当前tab的url，判断是否是b站直播页面，来显示icon的图标
chrome.tabs.onActivated.addListener(({ tabId }) => {
  void (async () => {
    const { url } = await chrome.tabs.get(tabId)
    url && MATCH_URL.test(url) ? changeIcon(true) : changeIcon(false)
  })()
})
