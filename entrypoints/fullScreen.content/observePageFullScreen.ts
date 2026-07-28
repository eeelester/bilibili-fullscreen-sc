import type { FullscreenMode } from './fullscreenState'
import { determineFullscreenMode } from './fullscreenState'

interface VideoContext {
  document: Document
  iframe: HTMLIFrameElement | null
  video: HTMLVideoElement
}

interface FullscreenObservation {
  mode: FullscreenMode
  target: VideoContext | null
}

function findVideoContext(rootDocument: Document = document): VideoContext | null {
  const directVideo = rootDocument.querySelector('video')
  if (directVideo) {
    return {
      document: rootDocument,
      iframe: null,
      video: directVideo,
    }
  }

  for (const iframe of rootDocument.querySelectorAll('iframe')) {
    try {
      const iframeDocument = iframe.contentDocument
      const video = iframeDocument?.querySelector('video')
      if (iframeDocument && video) {
        return {
          document: iframeDocument,
          iframe,
          video,
        }
      }
    }
    catch {
      // Cross-origin iframes are not valid mount targets.
    }
  }

  return null
}

function observePageFullscreen(onChange: (observation: FullscreenObservation) => void) {
  const mutationObserver = new MutationObserver(scheduleSync)
  const observedDocuments = new Set<Document>()
  const iframeLoadListeners = new Map<HTMLIFrameElement, () => void>()
  let resizeObserver: ResizeObserver | null = null
  let currentVideo: HTMLVideoElement | null = null
  let currentTarget: VideoContext | null = null
  let syncScheduled = false
  let disposed = false

  function observeDocument(targetDocument: Document) {
    if (observedDocuments.has(targetDocument) || !targetDocument.documentElement)
      return

    observedDocuments.add(targetDocument)
    mutationObserver.observe(targetDocument.documentElement, {
      childList: true,
      subtree: true,
    })
    targetDocument.addEventListener('fullscreenchange', scheduleSync, true)
  }

  function refreshObservedDocuments() {
    observeDocument(document)

    for (const iframe of document.querySelectorAll('iframe')) {
      if (!iframeLoadListeners.has(iframe)) {
        const handleLoad = () => scheduleSync()
        iframe.addEventListener('load', handleLoad)
        iframeLoadListeners.set(iframe, handleLoad)
      }

      try {
        if (iframe.contentDocument)
          observeDocument(iframe.contentDocument)
      }
      catch {
        // Ignore cross-origin iframe documents.
      }
    }

    for (const [iframe, listener] of iframeLoadListeners) {
      if (!iframe.isConnected) {
        iframe.removeEventListener('load', listener)
        iframeLoadListeners.delete(iframe)
      }
    }
  }

  function sync() {
    if (disposed)
      return

    syncScheduled = false
    refreshObservedDocuments()
    const discoveredTarget = findVideoContext()
    const target = discoveredTarget
      && currentTarget?.video === discoveredTarget.video
      && currentTarget.document === discoveredTarget.document
      ? currentTarget
      : discoveredTarget

    currentTarget = target

    if (target?.video !== currentVideo) {
      resizeObserver?.disconnect()
      resizeObserver = null
      currentVideo = target?.video ?? null

      if (currentVideo) {
        resizeObserver = new ResizeObserver(scheduleSync)
        resizeObserver.observe(currentVideo)
      }
    }

    const mode = target
      ? determineFullscreenMode({
          hasNativeFullscreen: Boolean(document.fullscreenElement || target.document.fullscreenElement),
          videoWidth: target.video.getBoundingClientRect().width,
          viewportWidth: window.innerWidth,
        })
      : 'normal'

    onChange({ mode, target })
  }

  function scheduleSync() {
    if (disposed || syncScheduled)
      return

    syncScheduled = true
    queueMicrotask(sync)
  }

  window.addEventListener('resize', scheduleSync, { passive: true })
  scheduleSync()

  return () => {
    disposed = true
    resizeObserver?.disconnect()
    mutationObserver.disconnect()
    window.removeEventListener('resize', scheduleSync)

    for (const targetDocument of observedDocuments)
      targetDocument.removeEventListener('fullscreenchange', scheduleSync, true)

    for (const [iframe, listener] of iframeLoadListeners)
      iframe.removeEventListener('load', listener)

    observedDocuments.clear()
    iframeLoadListeners.clear()
  }
}

export type { FullscreenObservation, VideoContext }
export { findVideoContext, observePageFullscreen }
