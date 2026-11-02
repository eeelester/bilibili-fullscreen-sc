import { getVideoDom, mount, unmount } from './utils'

export default function observePageFullScreen() {
  let stopped = false
  let frame: number | undefined
  let video: HTMLVideoElement | undefined
  let videoDocument: Document | undefined
  const iframeObservers = new Map<Document, MutationObserver>()
  const iframeListeners = new Map<HTMLIFrameElement, () => void>()

  function schedule() {
    if (!stopped && frame === undefined)
      frame = window.requestAnimationFrame(reconcile)
  }

  const resizeObserver = new ResizeObserver(schedule)
  const documentObserver = new MutationObserver(schedule)

  function reconcile() {
    frame = undefined
    if (stopped)
      return
    const nextVideo = getVideoDom()
    if (nextVideo !== video) {
      resizeObserver.disconnect()
      video = nextVideo
      videoDocument = video?.ownerDocument
      if (video)
        resizeObserver.observe(video)
    }
    const iframes = new Set(document.querySelectorAll('iframe'))
    const iframeDocuments = new Set<Document>()
    for (const [iframe, listener] of iframeListeners) {
      if (!iframes.has(iframe)) {
        iframe.removeEventListener('load', listener)
        iframeListeners.delete(iframe)
      }
    }
    for (const iframe of iframes) {
      if (iframe.allowFullscreen && !iframeListeners.has(iframe)) {
        iframe.addEventListener('load', schedule)
        iframeListeners.set(iframe, schedule)
      }
      if (iframe.allowFullscreen) {
        try {
          const iframeDocument = iframe.contentDocument
          if (iframeDocument) {
            iframeDocuments.add(iframeDocument)
            if (!iframeObservers.has(iframeDocument)) {
              const observer = new MutationObserver(schedule)
              observer.observe(iframeDocument, { childList: true, subtree: true })
              iframeDocument.addEventListener('fullscreenchange', schedule)
              iframeObservers.set(iframeDocument, observer)
            }
          }
        }
        catch {
          // 跨域 iframe 不提供可访问的播放器 DOM。
        }
      }
    }
    for (const [iframeDocument, observer] of iframeObservers) {
      if (!iframeDocuments.has(iframeDocument)) {
        observer.disconnect()
        iframeDocument.removeEventListener('fullscreenchange', schedule)
        iframeObservers.delete(iframeDocument)
      }
    }
    const nativeFullscreen = Boolean(document.fullscreenElement || videoDocument?.fullscreenElement)
    const width = video?.clientWidth || video?.getBoundingClientRect().width || 0
    const webFullscreen = width > 0 && Math.abs(width - window.innerWidth) < 2
    if (video?.isConnected && (nativeFullscreen || webFullscreen))
      mount()
    else
      unmount()
  }

  documentObserver.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['allowfullscreen'] })
  document.addEventListener('fullscreenchange', schedule)
  window.addEventListener('resize', schedule)
  schedule()
  function stop() {
    stopped = true
    if (frame !== undefined)
      window.cancelAnimationFrame(frame)
    resizeObserver.disconnect()
    documentObserver.disconnect()
    for (const [iframeDocument, observer] of iframeObservers) {
      observer.disconnect()
      iframeDocument.removeEventListener('fullscreenchange', schedule)
    }
    iframeObservers.clear()
    document.removeEventListener('fullscreenchange', schedule)
    window.removeEventListener('resize', schedule)
    for (const [iframe, listener] of iframeListeners)
      iframe.removeEventListener('load', listener)
    iframeListeners.clear()
    unmount()
  }
  return { refresh: schedule, stop }
}
