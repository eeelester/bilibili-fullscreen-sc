import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ScInfo } from './type'
import { PositionEnum } from '@/constant'

type propRef = React.MutableRefObject<HTMLDivElement | undefined | null>

function useMove(ref: propRef, scDocument: Document, initialPosition: PositionEnum = PositionEnum.BOTTOM_LEFT) {
  const height = useMemo(() => scDocument.documentElement.clientHeight, [])
  // 根据初始位置设置初始坐标
  const getInitialPosition = useCallback(() => {
    switch (initialPosition) {
      case PositionEnum.TOP_LEFT:
        return { left: 10, top: 10, maxHeight: height - 30 }
      case PositionEnum.TOP_RIGHT:
        return { right: 10, top: 10, maxHeight: height - 30 }
      case PositionEnum.BOTTOM_RIGHT:
        return { right: 10, bottom: 140, maxHeight: height - 30 }
      case PositionEnum.BOTTOM_LEFT:
      default:
        return { left: 10, bottom: 140, maxHeight: height - 30 }
    }
  }, [height, initialPosition])

  const [position, setPosition] = useState(getInitialPosition())
  const movingRef = useRef(false)
  const lastPositionRef = useRef<{ lastX: number | null, lastY: number | null }>({ lastX: 0, lastY: 0 })

  useEffect(() => {
    setPosition(getInitialPosition())
  }, [getInitialPosition])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!movingRef.current)
      return
    const { lastX, lastY } = lastPositionRef.current
    if (lastX && lastY) {
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY

      setPosition((prev) => {
        const newPos = { ...prev }

        // 根据当前位置属性更新坐标
        if ('left' in prev)
          newPos.left = (prev.left as number) + dx
        if ('right' in prev)
          newPos.right = (prev.right as number) - dx
        if ('top' in prev)
          newPos.top = (prev.top as number) + dy
        if ('bottom' in prev)
          newPos.bottom = (prev.bottom as number) - dy

        // 更新最大高度
        if ('top' in prev)
          newPos.maxHeight = height - ((prev.top as number) + dy) - 30
        else if ('bottom' in prev)
          newPos.maxHeight = height - ((prev.bottom) - dy) - 30

        return newPos
      })
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
