import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { KeepLiveWS } from 'bilibili-live-ws'
import { ALREADY_HAVE_IT } from './const'
import type { DanmuInfo, RoomDetailInfo, RoomInfo } from './types'
import SCList from '@/components/ScList'
import type { DanmuDataProps } from '@/utils'
import { processData } from '@/utils'

// import { testData } from "@/dev/testData";

let isFirst = true
let isMount = false
let isInIframe = false
let root: Root | null
let keepLiveWS: KeepLiveWS | null

export let existElement: HTMLElement | null

export function mount(log: string) {
  if (isMount)
    return ALREADY_HAVE_IT

  isMount = true

  console.log(log)

  if (isFirst) {
    injectIframeCss()
    isFirst = false
  }

  existElement = document.createElement('div')

  const videoDom = getVideoDom()
  console.log('videoParent', videoDom?.parentNode)
  videoDom?.parentNode?.appendChild(existElement)
  root = createRoot(existElement)
  root.render(<SCList scDocument={isInIframe ? (getVideoDomFromIframe().contentDocument as Document) : document} />)

  // setTimeout(() => {
  //   processData({ ...testData, data: { ...testData.data, time: 1000, delay: 5 } });
  // }, 1000);
  void getInfo()
}

export function unmount(log: string) {
  if (!isMount)
    return
  isMount = false

  console.log(log)
  root?.unmount()
  root = null
  existElement?.parentNode?.removeChild(existElement)
  existElement = null
  keepLiveWS?.close()
  keepLiveWS = null
}

// 有时候video在iframe里面，content-script.css的样式没法应用到里面去，所以将其应用到iframe head中
function injectIframeCss() {
  const videoIframe = getVideoDomFromIframe()
  if (videoIframe?.contentDocument?.querySelector('video')) {
    console.log('--------video在iframe里面，需要手动在iframe中注入样式文件---------')

    console.log(
      `extension css文件路径：`,
      // @ts-expect-error: 实际是有的
      browser.runtime.getURL('/content-scripts/fullScreen.css'),
    )

    isInIframe = true
    const link = videoIframe.contentDocument.createElement('link')
    link.rel = 'stylesheet'

    link.href = browser.runtime.getURL(
      // @ts-expect-error: 实际是有的
      '/content-scripts/fullScreen.css',
    ) // 扩展中的 CSS 文件路径
    videoIframe.contentDocument.head.appendChild(link)
  }
}

async function getInfo() {
  const shortId = location.pathname.slice(1)
  const roomId = await fetch(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${shortId}`)
    .then(response => response.json())
    .then((res: RoomInfo) => {
      const { data: { room_id } = { room_id: 0 } } = res
      return room_id
    })

  const existingSCList = await fetch(`https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${roomId}`, {
    credentials: 'include',
  })
    .then(response => response.json())
    .then((res: RoomDetailInfo) => {
      return res?.data?.super_chat_info?.message_list || []
    })
  if (Array.isArray(existingSCList) && existingSCList.length) {
    console.log('existingSCList', existingSCList)
    for (const i of existingSCList) {
      const time = i.end_time - i.start_time
      const delay = time - i.time
      processData({ data: { ...i, time, delay } })
    }
  }
  const key = await fetch(`https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${roomId}`)
    .then(response => response.json())
    .then((res: DanmuInfo) => {
      const { data: { token } = { token: '' } } = res
      return token
    })
  keepLiveWS = new KeepLiveWS(roomId, {
    protover: 3,
    key,
  })
  keepLiveWS.on('SUPER_CHAT_MESSAGE', (res: DanmuDataProps) => {
    console.log('SC', res)
    processData(res)
  })
}

// 获取跟video的dom（B站video的父级dom结构老是变，有病的！）
export function getVideoDom() {
  return document.querySelector('video') || getVideoDomFromIframe()?.contentDocument?.querySelector('video')
}

function getVideoDomFromIframe() {
  return Array.from(document.querySelectorAll('iframe')).filter(item => item.allowFullscreen)[0]
}
