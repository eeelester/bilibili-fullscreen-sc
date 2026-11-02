import { KeepLiveWS } from 'bilibili-live-ws'
import { fetchJson } from './api'
import type { DanmuInfo, RoomDetailInfo, RoomInfo, personInfo } from './types'
import { clearWbiKeys, wbi } from './wbi'
import { processData } from '@/utils'
import type { DanmuDataProps } from '@/utils'

class RoomSocket extends KeepLiveWS {
  override connect(reconnect = true) {
    if (!this.closed)
      super.connect(reconnect)
  }
}

export function connectRoom(shortId: string) {
  const controller = new AbortController()
  const { signal } = controller
  let socket: RoomSocket | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let retryCount = 0
  let historyRequest: Promise<void> | undefined

  async function loadHistory(roomId: number) {
    try {
      const response = await fetchJson<RoomDetailInfo>(
        `https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${roomId}`,
        { credentials: 'include', signal },
      )
      if (signal.aborted)
        return
      const messages = response.data?.super_chat_info?.message_list
      if (!Array.isArray(messages))
        return
      for (const message of messages) {
        if (!message || typeof message !== 'object')
          continue
        const time = message.end_time - message.start_time
        processData({ data: { ...message, time, delay: Math.max(0, time - message.time) } })
      }
    }
    catch (error) {
      if (!signal.aborted)
        console.warn('读取历史SC失败:', error)
    }
  }

  async function initialize() {
    if (signal.aborted)
      return
    const attempt = new AbortController()
    const abortAttempt = () => attempt.abort()
    signal.addEventListener('abort', abortAttempt, { once: true })
    try {
      const roomInfo = await fetchJson<RoomInfo>(
        `https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${encodeURIComponent(shortId)}`,
        { signal: attempt.signal },
      )
      const roomId = roomInfo.data?.room_id
      if (!Number.isSafeInteger(roomId) || roomId <= 0)
        throw new Error('Invalid room ID')
      if (signal.aborted)
        return
      if (!historyRequest)
        historyRequest = loadHistory(roomId)

      const [params, accountInfo] = await Promise.all([
        wbi({ id: roomId }, attempt.signal),
        fetchJson<personInfo>('https://api.bilibili.com/x/member/web/account', {
          credentials: 'include',
          signal: attempt.signal,
        }, [-101]),
      ])
      if (signal.aborted)
        return
      const danmuInfo = await fetchJson<DanmuInfo>(
        `https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?${params}`,
        { credentials: 'include', signal: attempt.signal },
      )
      const key = danmuInfo.data?.token
      if (typeof key !== 'string' || !key)
        throw new Error('Missing danmu token')
      if (signal.aborted)
        return
      socket = new RoomSocket(roomId, { protover: 3, key, uid: accountInfo.data?.mid || 0 })
      socket.on('SUPER_CHAT_MESSAGE', (message: DanmuDataProps) => {
        if (!signal.aborted)
          processData(message)
      })
      socket.once('live', () => {
        // 认证完成后重新读取快照，补齐初始化期间的消息。
        void historyRequest?.then(() => {
          if (!signal.aborted)
            return loadHistory(roomId)
        })
      })
    }
    catch (error) {
      attempt.abort()
      if (signal.aborted)
        return
      console.warn('初始化直播SC连接失败，将重试:', error)
      clearWbiKeys()
      const delays = [1000, 3000, 10_000, 30_000]
      retryTimer = setTimeout(() => {
        retryTimer = undefined
        void initialize()
      }, delays[Math.min(retryCount++, delays.length - 1)])
    }
    finally {
      signal.removeEventListener('abort', abortAttempt)
    }
  }

  void initialize()
  return () => {
    controller.abort()
    clearTimeout(retryTimer)
    socket?.close()
    socket?.removeAllListeners()
  }
}
