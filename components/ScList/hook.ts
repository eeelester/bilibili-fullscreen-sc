import type { CSSProperties, Dispatch, RefObject, SetStateAction } from 'react'
import type { ScInfo } from './type'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PositionEnum } from '@/constant'

interface Point {
  x: number
  y: number
}

const VIEWPORT_MARGIN = 10
const BOTTOM_CONTROL_OFFSET = 140

function useMove(ref: RefObject<HTMLDivElement>, scDocument: Document, initialPosition: PositionEnum = PositionEnum.BOTTOM_LEFT) {
  const [point, setPoint] = useState<Point>({ x: VIEWPORT_MARGIN, y: VIEWPORT_MARGIN })
  const draggingRef = useRef<{ pointerId: number, x: number, y: number } | null>(null)

  const getViewport = useCallback(() => ({
    width: scDocument.documentElement.clientWidth,
    height: scDocument.documentElement.clientHeight,
  }), [scDocument])

  const clampPoint = useCallback((next: Point): Point => {
    const { width, height } = getViewport()
    const rect = ref.current?.getBoundingClientRect()
    const elementWidth = rect?.width ?? 0
    const elementHeight = rect?.height ?? 0

    return {
      x: Math.min(Math.max(VIEWPORT_MARGIN, next.x), Math.max(VIEWPORT_MARGIN, width - elementWidth - VIEWPORT_MARGIN)),
      y: Math.min(Math.max(VIEWPORT_MARGIN, next.y), Math.max(VIEWPORT_MARGIN, height - Math.min(elementHeight, height - VIEWPORT_MARGIN * 2) - VIEWPORT_MARGIN)),
    }
  }, [getViewport, ref])

  const resetPosition = useCallback(() => {
    const { width, height } = getViewport()
    const rect = ref.current?.getBoundingClientRect()
    const elementWidth = rect?.width ?? 0
    const elementHeight = rect?.height ?? 0
    const right = width - elementWidth - VIEWPORT_MARGIN
    const bottom = height - elementHeight - BOTTOM_CONTROL_OFFSET

    const next = (() => {
      switch (initialPosition) {
        case PositionEnum.TOP_RIGHT:
          return { x: right, y: VIEWPORT_MARGIN }
        case PositionEnum.BOTTOM_RIGHT:
          return { x: right, y: bottom }
        case PositionEnum.BOTTOM_LEFT:
          return { x: VIEWPORT_MARGIN, y: bottom }
        case PositionEnum.TOP_LEFT:
        default:
          return { x: VIEWPORT_MARGIN, y: VIEWPORT_MARGIN }
      }
    })()

    setPoint(clampPoint(next))
  }, [clampPoint, getViewport, initialPosition, ref])

  useEffect(() => {
    resetPosition()
  }, [resetPosition])

  useEffect(() => {
    const targetWindow = scDocument.defaultView
    if (!targetWindow)
      return

    const handleResize = () => setPoint(current => clampPoint(current))
    targetWindow.addEventListener('resize', handleResize)
    return () => targetWindow.removeEventListener('resize', handleResize)
  }, [clampPoint, scDocument])

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const dragging = draggingRef.current
    if (!dragging || dragging.pointerId !== event.pointerId)
      return

    event.preventDefault()
    const dx = event.clientX - dragging.x
    const dy = event.clientY - dragging.y
    draggingRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    setPoint(current => clampPoint({ x: current.x + dx, y: current.y + dy }))
  }, [clampPoint])

  const stopDragging = useCallback((event: PointerEvent) => {
    if (draggingRef.current?.pointerId === event.pointerId)
      draggingRef.current = null
  }, [])

  useEffect(() => {
    scDocument.addEventListener('pointermove', handlePointerMove, { passive: false })
    scDocument.addEventListener('pointerup', stopDragging)
    scDocument.addEventListener('pointercancel', stopDragging)

    return () => {
      scDocument.removeEventListener('pointermove', handlePointerMove)
      scDocument.removeEventListener('pointerup', stopDragging)
      scDocument.removeEventListener('pointercancel', stopDragging)
    }
  }, [handlePointerMove, scDocument, stopDragging])

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button !== 0)
      return

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    draggingRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
  }, [])

  const style: CSSProperties = {
    left: point.x,
    top: point.y,
    maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
  }

  return { dragHandleProps: { onPointerDown }, style }
}

function useExpiryTimer(scList: ScInfo[], setScList: Dispatch<SetStateAction<ScInfo[]>>, scDocument: Document) {
  useEffect(() => {
    if (!scList.length)
      return

    const now = Date.now()
    const nextExpiresAt = Math.min(...scList.map(item => item.addedTime + getDisplayDurationMs(item)))
    const timeout = window.setTimeout(() => {
      setScList(prev => removeExpiredSc(prev, Date.now()))
    }, Math.max(0, nextExpiresAt - now))

    const handleVisibilityChange = () => {
      if (scDocument.visibilityState === 'visible')
        setScList(prev => removeExpiredSc(prev, Date.now()))
    }

    scDocument.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.clearTimeout(timeout)
      scDocument.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [scDocument, scList, setScList])
}

function getDisplayDurationMs(item: Pick<ScInfo, 'delay' | 'time'>) {
  return Math.max(0, item.time - item.delay) * 1000
}

function removeExpiredSc(scList: ScInfo[], now: number) {
  const next = scList.filter(item => now - item.addedTime < getDisplayDurationMs(item))
  return next.length === scList.length ? scList : next
}

export { getDisplayDurationMs, removeExpiredSc, useExpiryTimer, useMove }
