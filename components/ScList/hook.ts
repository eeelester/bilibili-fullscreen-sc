import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, Dispatch, RefObject, SetStateAction } from 'react'
import type { ScInfo } from './type'
import { PositionEnum } from '@/constant'

interface Position {
  left?: number
  right?: number
  top?: number
  bottom?: number
  maxHeight: number
}

function useMove(ref: RefObject<HTMLDivElement>, scDocument: Document, initialPosition = PositionEnum.BOTTOM_LEFT, enabled = true) {
  const getInitialPosition = useCallback((): Position => {
    const height = scDocument.documentElement.clientHeight
    const maxHeight = Math.max(0, height - 30)
    switch (initialPosition) {
      case PositionEnum.TOP_LEFT:
        return { left: 10, top: 10, maxHeight }
      case PositionEnum.TOP_RIGHT:
        return { right: 10, top: 10, maxHeight }
      case PositionEnum.BOTTOM_RIGHT:
        return { right: 10, bottom: 140, maxHeight }
      default:
        return { left: 10, bottom: 140, maxHeight }
    }
  }, [scDocument, initialPosition])
  const [position, setPosition] = useState(getInitialPosition)
  const moving = useRef<{ id: number, x: number, y: number }>()

  useEffect(() => {
    setPosition(getInitialPosition())
  }, [getInitialPosition])

  useEffect(() => {
    const target = ref.current
    const view = scDocument.defaultView
    if (!enabled || !target || !view)
      return
    function clamp(prev: Position, dx = 0, dy = 0): Position {
      const box = target!.querySelector('.sc-list')?.getBoundingClientRect()
      const width = scDocument.documentElement.clientWidth
      const height = scDocument.documentElement.clientHeight
      const boxWidth = box?.width || 0
      const boxHeight = Math.min(box?.height || 0, Math.max(0, height - 30))
      const left = prev.left ?? width - (prev.right || 0) - boxWidth
      const top = prev.top ?? height - (prev.bottom || 0) - boxHeight
      const nextLeft = Math.min(Math.max(0, left + dx), Math.max(0, width - boxWidth))
      const nextTop = Math.min(Math.max(0, top + dy), Math.max(0, height - boxHeight))
      const next = { ...prev }
      if (prev.left !== undefined)
        next.left = nextLeft
      else
        next.right = width - nextLeft - boxWidth
      if (prev.top !== undefined) {
        next.top = nextTop
        next.maxHeight = Math.max(0, height - nextTop - 30)
      }
      else {
        next.bottom = height - nextTop - boxHeight
        next.maxHeight = Math.max(0, height - next.bottom - 30)
      }
      return next
    }
    const end = () => {
      moving.current = undefined
    }
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || (event.target as Element).closest('button, input, select, img'))
        return
      moving.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
      target.setPointerCapture(event.pointerId)
      event.preventDefault()
    }
    const move = (event: PointerEvent) => {
      const start = moving.current
      if (!start || start.id !== event.pointerId)
        return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      moving.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
      setPosition(prev => clamp(prev, dx, dy))
    }
    const resize = () => setPosition(prev => clamp(prev))
    target.addEventListener('pointerdown', down)
    target.addEventListener('lostpointercapture', end)
    scDocument.addEventListener('pointermove', move)
    scDocument.addEventListener('pointerup', end)
    scDocument.addEventListener('pointercancel', end)
    view.addEventListener('blur', end)
    view.addEventListener('resize', resize)
    return () => {
      end()
      target.removeEventListener('pointerdown', down)
      target.removeEventListener('lostpointercapture', end)
      scDocument.removeEventListener('pointermove', move)
      scDocument.removeEventListener('pointerup', end)
      scDocument.removeEventListener('pointercancel', end)
      view.removeEventListener('blur', end)
      view.removeEventListener('resize', resize)
    }
  }, [ref, scDocument, enabled])
  return enabled ? position as CSSProperties : {}
}

// 最近过期时间驱动的定时器调度：不做无意义的轮询，定时器只在需要处理过期元素时触发。
function useScExpiration(scList: ScInfo[], setScList: Dispatch<SetStateAction<ScInfo[]>>, scDocument: Document) {
  useEffect(() => {
    const view = scDocument.defaultView
    if (!view || !scList.length)
      return
    let timer: number | undefined
    const expiresAt = (item: ScInfo) => item.addedTime + (item.time - item.delay) * 1000
    const tick = () => {
      const now = Date.now()
      view.clearTimeout(timer)
      setScList((prev) => {
        const next = prev.filter(item => expiresAt(item) > now)
        return next.length === prev.length ? prev : next
      })
      const future = scList.map(expiresAt).filter(time => time > now)
      if (future.length)
        timer = view.setTimeout(tick, Math.min(2_147_483_647, Math.max(1, Math.min(...future) - now)))
    }
    tick()
    scDocument.addEventListener('visibilitychange', tick)
    view.addEventListener('pageshow', tick)
    view.addEventListener('focus', tick)
    return () => {
      view.clearTimeout(timer)
      scDocument.removeEventListener('visibilitychange', tick)
      view.removeEventListener('pageshow', tick)
      view.removeEventListener('focus', tick)
    }
  }, [scList, setScList, scDocument])
}

export { useMove, useScExpiration }
