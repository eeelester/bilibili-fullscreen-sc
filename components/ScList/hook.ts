import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ScInfo } from './type'

type propRef = React.MutableRefObject<HTMLDivElement | undefined | null>

function useMove(ref: propRef, scDocument: Document) {
  const height = useMemo(() => scDocument.documentElement.clientHeight, [])
  const [position, setPosition] = useState({ left: 10, bottom: 140, maxHeight: height - 30 })
  const movingRef = useRef(false)
  const lastPositionRef = useRef<{ lastX: number | null, lastY: number | null }>({ lastX: 0, lastY: 0 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!movingRef.current)
      return
    const { lastX, lastY } = lastPositionRef.current
    if (lastX && lastY) {
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      setPosition(prev => ({
        left: prev.left + dx,
        bottom: prev.bottom - dy,
        maxHeight: height - (prev.bottom + dy),
      }))
    }
    lastPositionRef.current = {
      lastX: e.clientX,
      lastY: e.clientY,
    }
  }, [height])

  const handleMouseDown = useCallback(() => {
    movingRef.current = true
  }, [])

  const handleMouseUp = useCallback(() => {
    movingRef.current = false
    lastPositionRef.current = {
      lastX: null,
      lastY: null,
    }
  }, [])

  useEffect(() => {
    const refDom = ref.current
    refDom?.addEventListener('mousedown', handleMouseDown)
    scDocument.addEventListener('mouseup', handleMouseUp)
    scDocument.addEventListener('mousemove', handleMouseMove)

    return () => {
      refDom?.removeEventListener('mousedown', handleMouseDown)
      scDocument.removeEventListener('mouseup', handleMouseUp)
      scDocument.removeEventListener('mousemove', handleMouseMove)
    }
  }, [ref, handleMouseDown, handleMouseUp, handleMouseMove])

  return { ...position }
}

function useRAF(setScList: React.Dispatch<React.SetStateAction<ScInfo[]>>) {
  const animationId = useRef<number>()

  useEffect(() => {
    const loop = () => {
      const currentTime = Date.now() // 当前时间
      setScList(prev =>
        prev.filter(item => currentTime - item.addedTime < (item.time - item.delay) * 1000), // 过滤掉超时的项
      )

      animationId.current = requestAnimationFrame(loop)
    }

    animationId.current = requestAnimationFrame(loop)
    return () => {
      animationId.current && cancelAnimationFrame(animationId.current)
    }
  }, [])
}

export { useMove, useRAF }
