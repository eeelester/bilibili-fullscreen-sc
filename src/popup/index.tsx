import { createRoot } from 'react-dom/client'
import Wrong from '@/components/Wrong'
import Popup from '@/components/Popup'
import { MATCH_URL, POPUP_INITIAL_STATE } from '@/constant'
import { changeIcon } from '@/utils'

void (async function () {
  const root = createRoot(document.getElementById('root') as Element)

  /* -- 判断是不是b站直播页面，不是就返回 -- */
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })

  const isMatch = MATCH_URL.test(tab.url as string)
  if (!isMatch) {
    changeIcon(false)
    root.render(<Wrong />)
    return
  }

  /* -- 是b站直播页面 -- */
  const { switchState = POPUP_INITIAL_STATE } = await chrome.storage.session.get(['switchState'])

  root.render(
    // eslint-disable-next-line ts/no-misused-promises
    <Popup onClose={() => onSwitch(false)} onOpen={() => onSwitch(true)} initialState={switchState as boolean} />,
  )

  /**
   * @description: switch改变后，传参给content-scripts，然后还要改变icon
   * @param {boolean} switchState
   * @return {*}
   */
  async function onSwitch(switchState: boolean) {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })
    void chrome.tabs.sendMessage(tab.id as number, {
      switchState,
    })

    // 存着，不然下次点击popup就没有了
    void chrome.storage.session.set({ switchState })

    // 发送给background，这个开关是用户操作，级别最高，background的根据url切换图标状态要在这之下
    void chrome.runtime.sendMessage({ switchState })

    changeIcon(switchState)
  }
})()
