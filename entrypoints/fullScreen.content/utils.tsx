import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { ALREADY_HAVE_IT } from './const'
import { connectRoom } from './liveConnection'
import SCList from '@/components/ScList'

let root: Root | undefined
let element: HTMLDivElement | undefined
let disconnectRoom: (() => void) | undefined
let roomPath: string | undefined

export function mount() {
  const video = getVideoDom()
  const parent = video?.parentElement
  if (!video || !parent)
    return
  const scDocument = video.ownerDocument
  if (element && root && element.ownerDocument === scDocument && roomPath === location.pathname) {
    if (element.parentElement !== parent)
      parent.appendChild(element)
    injectIframeCss(scDocument)
    return ALREADY_HAVE_IT
  }
  unmount()
  injectIframeCss(scDocument)
  element = scDocument.createElement('div')
  element.dataset.bilibiliFullscreenSc = ''
  parent.appendChild(element)
  const currentRoomPath = location.pathname
  roomPath = currentRoomPath
  root = createRoot(element)
  const currentElement = element
  root.render(
    <SCList
      scDocument={scDocument}
      onReady={() => {
        if (element === currentElement && location.pathname === currentRoomPath && !disconnectRoom)
          disconnectRoom = connectRoom(currentRoomPath.split('/').filter(Boolean)[0] || '')
      }}
    />,
  )
}

export function unmount() {
  disconnectRoom?.()
  disconnectRoom = undefined
  root?.unmount()
  root = undefined
  element?.remove()
  element = undefined
  roomPath = undefined
}

function injectIframeCss(scDocument: Document) {
  if (scDocument === document || scDocument.querySelector('link[data-bilibili-fullscreen-sc]'))
    return
  const link = scDocument.createElement('link')
  link.dataset.bilibiliFullscreenSc = ''
  link.rel = 'stylesheet'
  link.href = new URL('content-scripts/fullScreen.css', browser.runtime.getURL('/')).href
  ;(scDocument.head || scDocument.documentElement).appendChild(link)
}

export function getVideoDom(): HTMLVideoElement | undefined {
  const video = document.querySelector('video')
  if (video)
    return video
  for (const iframe of document.querySelectorAll('iframe')) {
    if (!iframe.allowFullscreen)
      continue
    try {
      const iframeVideo = iframe.contentDocument?.querySelector('video')
      if (iframeVideo)
        return iframeVideo
    }
    catch {
      // 跨域播放器无法读取 DOM，继续检查同源播放器。
    }
  }
}
