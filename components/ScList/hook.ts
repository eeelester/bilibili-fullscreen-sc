import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type propRef = React.MutableRefObject<HTMLDivElement | undefined | null>

function useMove(ref: propRef) {
  const height = useMemo(() => document.documentElement.clientHeight, [])
  const [position, setPosition] = useState({ left: 10, bottom: 30, maxHeight: height - 30 })
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
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      refDom?.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [ref, handleMouseDown, handleMouseUp, handleMouseMove])

  return { ...position }
}

export { useMove }
