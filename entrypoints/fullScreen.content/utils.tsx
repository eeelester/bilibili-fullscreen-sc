import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { KeepLiveWS } from 'bilibili-live-ws'
import { ALREADY_HAVE_IT } from './const'
import type { DanmuInfo, RoomDetailInfo, RoomInfo, personInfo } from './types'
import { wbi } from './wbi'
import SCList from '@/components/ScList'
import type { DanmuDataProps } from '@/utils'
import { processData } from '@/utils'

// import { testData } from "@/dev/testData";

let isFirst = true
let isMount = false
let isInIframe = false
let mountId = 0
let root: Root | null
let keepLiveWS: KeepLiveWS | null

let existElement: HTMLElement | null

export function hasMountElement() {
  return Boolean(existElement)
}

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
  const currentMountId = ++mountId

  const videoDom = getVideoDom()
  console.log('videoParent', videoDom?.parentNode)
  videoDom?.parentNode?.appendChild(existElement)
  root = createRoot(existElement)
  root.render(<SCList scDocument={isInIframe ? (getVideoDomFromIframe().contentDocument as Document) : document} />)

  // setTimeout(() => {
  //   processData({ ...testData, data: { ...testData.data, time: 1000, delay: 5 } });
  // }, 1000);
  void getInfo(currentMountId)
}

export function unmount(log: string) {
  if (!isMount)
    return
  isMount = false
  mountId += 1

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

async function getInfo(currentMountId: number) {
  try {
    const shortId = location.pathname.slice(1)
    const roomInfo = await fetchJson<RoomInfo>(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${shortId}`)
    const roomId = roomInfo?.data?.room_id || 0
    if (!roomId || !isCurrentMount(currentMountId))
      return

    const roomDetailInfo = await fetchJson<RoomDetailInfo>(`https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${roomId}`, {
      credentials: 'include',
    })
    const existingSCList = roomDetailInfo?.data?.super_chat_info?.message_list || []
    if (Array.isArray(existingSCList) && existingSCList.length && isCurrentMount(currentMountId)) {
      console.log('existingSCList', existingSCList)
      for (const i of existingSCList) {
        if (!isCurrentMount(currentMountId))
          return

        const time = i.end_time - i.start_time
        const delay = time - i.time
        processData({ data: { ...i, time, delay } })
      }
    }

    const paramsWithWbi = await wbi({
      id: roomId,
    })
    if (!isCurrentMount(currentMountId))
      return

    const danmuInfo = await fetchJson<DanmuInfo>(`https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?${paramsWithWbi}`, {
      credentials: 'include',
    })
    const key = danmuInfo?.data?.token || ''
    if (!key || !isCurrentMount(currentMountId))
      return

    console.log('token', key)
    const accountInfo = await fetchJson<personInfo>('https://api.bilibili.com/x/member/web/account', {
      credentials: 'include',
    })
    const mid = accountInfo?.data?.mid || 0
    if (!isCurrentMount(currentMountId))
      return

    console.log('mid', mid)
    const nextKeepLiveWS = new KeepLiveWS(roomId, {
      protover: 3,
      key: String(key),
      uid: mid,
    })

    if (!isCurrentMount(currentMountId)) {
      nextKeepLiveWS.close()
      return
    }

    keepLiveWS?.close()
    keepLiveWS = nextKeepLiveWS
    keepLiveWS.on('SUPER_CHAT_MESSAGE', (res: DanmuDataProps) => {
      if (!isCurrentMount(currentMountId))
        return

      console.log('SC', res)
      processData(res)
    })
  }
  catch (error) {
    if (isCurrentMount(currentMountId))
      console.error('初始化直播SC连接失败:', error)
  }
}

// 获取跟video的dom（B站video的父级dom结构老是变，有病的！）
export function getVideoDom() {
  return document.querySelector('video') || getVideoDomFromIframe()?.contentDocument?.querySelector('video')
}

function getVideoDomFromIframe() {
  return Array.from(document.querySelectorAll('iframe')).filter(item => item.allowFullscreen)[0]
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  if (!response.ok)
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)

  return response.json() as Promise<T>
}

function isCurrentMount(currentMountId: number) {
  return isMount && currentMountId === mountId
}
