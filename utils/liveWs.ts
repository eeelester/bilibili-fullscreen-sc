import type { DanmuDataProps } from '@/utils'
import { KeepLiveWS } from 'bilibili-live-ws'

interface LiveRoomSocket {
  close: () => void
}

interface LiveRoomSocketOptions {
  key: string
  onError: () => void
  onSuperChat: (payload: DanmuDataProps) => void
  roomId: number
}

function createLiveRoomSocket(options: LiveRoomSocketOptions): LiveRoomSocket {
  const socket = new KeepLiveWS(options.roomId, {
    key: options.key,
    protover: 3,
    uid: 0,
  })

  socket.on('SUPER_CHAT_MESSAGE', options.onSuperChat)
  socket.on('e', options.onError)
  return socket
}

export type { LiveRoomSocket }
export { createLiveRoomSocket }
