import type { ScInfo } from '@/components/ScList/type'
import { WS_SC_EVENT } from '@/constant'

type SuperChatEvent = Omit<ScInfo, 'addedTime' | 'nodeRef'>
type SuperChatListener = (payload: SuperChatEvent) => void

class EventBus {
  private readonly superChatListeners = new Set<SuperChatListener>()

  subscribe(event: typeof WS_SC_EVENT, callback: SuperChatListener) {
    if (event === WS_SC_EVENT)
      this.superChatListeners.add(callback)
  }

  unsubscribe(event: typeof WS_SC_EVENT, callback: SuperChatListener) {
    if (event === WS_SC_EVENT)
      this.superChatListeners.delete(callback)
  }

  emit(event: typeof WS_SC_EVENT, payload: SuperChatEvent) {
    if (event !== WS_SC_EVENT)
      return

    this.superChatListeners.forEach(listener => listener(payload))
  }
}

const eventBus = new EventBus()

export type { SuperChatEvent }
export { eventBus }
