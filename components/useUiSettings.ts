import { useEffect, useState } from 'react'
import { DEFAULT_SIZE, POSITION_EVENT, SIZE_EVENT } from '@/constant'
import { eventBus } from '@/utils/event'
import type { UiSettings } from '@/utils/settings'
import { DEFAULT_POSITION, getUiSettings, watchUiSettings } from '@/utils/settings'

export function useUiSettings(enabled = true) {
  const [settings, setSettings] = useState<UiSettings>({ size: DEFAULT_SIZE, position: DEFAULT_POSITION })
  useEffect(() => {
    if (!enabled)
      return
    let active = true
    let sizeChanged = false
    let positionChanged = false
    const onSize = (size: UiSettings['size']) => {
      sizeChanged = true
      setSettings(prev => prev.size === size ? prev : { ...prev, size })
    }
    const onPosition = (position: UiSettings['position']) => {
      positionChanged = true
      setSettings(prev => prev.position === position ? prev : { ...prev, position })
    }
    eventBus.subscribe(SIZE_EVENT, onSize)
    eventBus.subscribe(POSITION_EVENT, onPosition)
    const unwatch = watchUiSettings(onSize, onPosition)
    void getUiSettings().then((saved) => {
      if (active) {
        setSettings(prev => ({
          size: sizeChanged ? prev.size : saved.size,
          position: positionChanged ? prev.position : saved.position,
        }))
      }
    }).catch((error) => {
      if (active)
        console.error('获取UI设置失败:', error)
    })
    return () => {
      active = false
      unwatch()
      eventBus.unsubscribe(SIZE_EVENT, onSize)
      eventBus.unsubscribe(POSITION_EVENT, onPosition)
    }
  }, [enabled])
  return settings
}
