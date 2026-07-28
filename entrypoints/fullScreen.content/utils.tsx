import type { Root } from 'react-dom/client'
import type { FullscreenMode } from './fullscreenState'
import type { VideoContext } from './observePageFullScreen'
import type { DanmuInfo, RoomDetailInfo, RoomInfo } from './types'
import type { DanmuDataProps } from '@/utils'
import type { LiveRoomSocket } from '@/utils/liveWs'
import { createRoot } from 'react-dom/client'
import SCList from '@/components/ScList'
import { processData } from '@/utils'
import { createLiveRoomSocket } from '@/utils/liveWs'
import { wbi } from './wbi'

let isMount = false
let mountId = 0
let root: Root | null
let keepLiveWS: LiveRoomSocket | null
let initializationController: AbortController | null

let existElement: HTMLElement | null

type MountResult = 'mounted' | 'already-mounted' | 'no-target' | 'failed'

export function hasMountElement() {
  return Boolean(isMount && existElement?.isConnected && root)
}

export function mount(target: VideoContext, _mode: Exclude<FullscreenMode, 'normal'>): MountResult {
  if (hasMountElement())
    return 'already-mounted'

  if (isMount)
    unmount()

  const mountParent = target.video.parentNode
  if (!mountParent)
    return 'no-target'

  const nextElement = target.document.createElement('div')
  nextElement.dataset.bilibiliFullscreenScRoot = ''

  try {
    injectIframeCss(target.document)
    mountParent.appendChild(nextElement)
    const nextRoot = createRoot(nextElement)
    nextRoot.render(<SCList scDocument={target.document} />)

    existElement = nextElement
    root = nextRoot
    isMount = true
    const currentMountId = ++mountId
    initializationController?.abort()
    initializationController = new AbortController()
    void getInfo(currentMountId, initializationController.signal)
    return 'mounted'
  }
  catch (error) {
    nextElement.remove()
    isMount = false
    existElement = null
    root = null
    console.error('挂载全屏 SC 失败:', error)
    return 'failed'
  }
}

export function unmount() {
  if (!isMount && !root && !existElement)
    return

  isMount = false
  mountId += 1
  root?.unmount()
  root = null
  existElement?.remove()
  existElement = null
  keepLiveWS?.close()
  keepLiveWS = null
  initializationController?.abort()
  initializationController = null
}

// 有时候video在iframe里面，content-script.css的样式没法应用到里面去，所以将其应用到iframe head中
function injectIframeCss(targetDocument: Document) {
  if (targetDocument.querySelector('[data-bilibili-fullscreen-sc-style]'))
    return

  const link = targetDocument.createElement('link')
  link.dataset.bilibiliFullscreenScStyle = ''
  link.rel = 'stylesheet'
  const runtime = browser.runtime as { getURL: (path: string) => string }
  link.href = runtime.getURL('/content-scripts/fullScreenRuntime.css')
  targetDocument.head?.appendChild(link)
}

async function getInfo(currentMountId: number, signal: AbortSignal) {
  try {
    const shortId = location.pathname.match(/^\/(\d+)/)?.[1]
    if (!shortId)
      return

    const roomInfo = await fetchJson<RoomInfo>(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${shortId}`, { signal })
    const roomId = roomInfo?.data?.room_id ?? 0
    if (!roomId || !isCurrentMount(currentMountId))
      return

    const roomDetailPromise = fetchJson<RoomDetailInfo>(`https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${roomId}`, {
      credentials: 'include',
      signal,
    }).then((roomDetailInfo) => {
      processExistingSuperChats(roomDetailInfo, currentMountId)
    })
    const danmuInfoPromise = fetchDanmuInfo(roomId, signal)
    const [, danmuInfo] = await Promise.all([roomDetailPromise, danmuInfoPromise])
    const key = danmuInfo?.data?.token || ''
    if (!key || !isCurrentMount(currentMountId))
      return

    const nextKeepLiveWS = createLiveRoomSocket({
      key,
      onError: () => {
        if (isCurrentMount(currentMountId))
          console.warn('直播 SC 连接暂时中断，正在重连。')
      },
      onSuperChat: (res: DanmuDataProps) => {
        if (!isCurrentMount(currentMountId))
          return

        processData(res)
      },
      roomId,
    })

    if (!isCurrentMount(currentMountId)) {
      nextKeepLiveWS.close()
      return
    }

    keepLiveWS?.close()
    keepLiveWS = nextKeepLiveWS
  }
  catch (error) {
    if (isCurrentMount(currentMountId) && !isAbortError(error))
      console.error('初始化直播SC连接失败:', error)
  }
}

function processExistingSuperChats(roomDetailInfo: RoomDetailInfo, currentMountId: number) {
  const existingSCList = roomDetailInfo?.data?.super_chat_info?.message_list || []
  if (!Array.isArray(existingSCList))
    return

  for (const item of existingSCList) {
    if (!isCurrentMount(currentMountId))
      return

    const time = item.end_time - item.start_time
    const delay = Math.max(0, time - item.time)
    if (Number.isFinite(time) && time > 0)
      processData({ data: { ...item, time, delay } })
  }
}

async function fetchDanmuInfo(roomId: number, signal: AbortSignal) {
  let lastError: unknown

  for (const forceRefresh of [false, true]) {
    try {
      const paramsWithWbi = await wbi({ id: roomId }, { forceRefresh, signal })
      return await fetchJson<DanmuInfo>(`https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?${paramsWithWbi}`, {
        credentials: 'include',
        signal,
      })
    }
    catch (error) {
      if (isAbortError(error))
        throw error
      lastError = error
    }
  }

  throw lastError
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const maxAttempts = 3

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let response: Response
    try {
      response = await fetch(input, init)
    }
    catch (error) {
      if (isAbortError(error) || attempt === maxAttempts - 1)
        throw error

      await waitForRetry(attempt, init?.signal)
      continue
    }

    if (response.status >= 500 && attempt < maxAttempts - 1) {
      await waitForRetry(attempt, init?.signal)
      continue
    }

    if (!response.ok)
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)

    let data: T
    try {
      data = await response.json() as T
    }
    catch {
      throw new Error('Bilibili API returned invalid JSON')
    }

    if (isBilibiliErrorResponse(data))
      throw new Error(`Bilibili API failed: ${data.code} ${data.message ?? ''}`)

    return data
  }

  throw new Error('Request failed after retries')
}

function isBilibiliErrorResponse(value: unknown): value is { code: number, message?: string } {
  return Boolean(
    value
    && typeof value === 'object'
    && 'code' in value
    && typeof value.code === 'number'
    && value.code !== 0,
  )
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function waitForRetry(attempt: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Request aborted', 'AbortError'))
      return
    }

    let timeout = 0
    const handleAbort = () => {
      window.clearTimeout(timeout)
      reject(new DOMException('Request aborted', 'AbortError'))
    }
    timeout = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }, 250 * 2 ** attempt)
    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

function isCurrentMount(currentMountId: number) {
  return isMount && currentMountId === mountId
}
