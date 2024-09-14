class EventBus {
  events: { [propName: string]: Function[] }

  constructor() {
    this.events = {}
  }

  subscribe(event: string, callback: Function) {
    (this.events[event] ? this.events[event] : this.events[event] = []).push(callback)
  }

  unsubscribe(event: string, callback: Function) {
    const subscribedEvents = this.events[event]

    if (subscribedEvents && subscribedEvents.length)
      this.events[event] = this.events[event].filter(cb => cb !== callback)
  }

  emit(event: string, ...rest) {
    // 取出所有订阅者的回调执行
    const subscribedEvents = this.events[event]

    if (subscribedEvents && subscribedEvents.length) {
      subscribedEvents.forEach((callback) => {
        callback.apply(this, rest)
      })
    }
  }
}

// esmodule有缓存，已经是单例模式了，不需要再另外写代码处理
const eventBus = new EventBus()

export { eventBus }
