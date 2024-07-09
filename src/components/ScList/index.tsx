import { createRef, useCallback, useEffect, useRef, useState } from 'react'
import {
  CSSTransition,
  TransitionGroup,
} from 'react-transition-group'
import { useMove } from './hook'
import { eventBus } from '@/utils/event'
import { WS_SC_EVENT } from '@/constant'
import './index.less'

interface ScInfo {
  face: string
  face_frame: string
  uname: string
  name_color: string
  price: number
  message: string
  message_font_color: string
  background_bottom_color: string
  background_color: string
  id: number
  time: number
  nodeRef: React.RefObject<HTMLDivElement | unknown>
}

function SCList() {
  const [scList, setScList] = useState<ScInfo[]>([])
  const scListRef = useRef<HTMLDialogElement>(null)
  const { left, top, maxHeight } = useMove(scListRef)
  const timeoutMap = useRef(new Map<number, NodeJS.Timeout>())

  const Listener = useCallback((scInfo: ScInfo) => {
    setScList(prev => prev.concat({ ...scInfo, nodeRef: createRef() }))
    const { id, time } = scInfo
    if (!timeoutMap.current.has(id)) {
      const timeout = setTimeout(() => {
        setScList(prev => prev.filter(item => item.id !== id))
      }, time * 1000)

      timeoutMap.current.set(id, timeout)
    }
  }, [])

  useEffect(() => {
    eventBus.subscribe(WS_SC_EVENT, Listener)

    let timeoutMapRefValue: Map<number, NodeJS.Timeout> | null = null

    if (timeoutMap.current)
      timeoutMapRefValue = timeoutMap.current

    return () => {
      eventBus.unsubscribe(WS_SC_EVENT, Listener)
      if (timeoutMapRefValue?.size && timeoutMapRefValue.size > 0) {
        for (const [_, value] of timeoutMapRefValue.entries())
          clearTimeout(value)
      }
    }
  }, [Listener])

  useEffect(() => {
    if (typeof scListRef.current?.showModal === 'function')
      scListRef.current.showModal()
    else
    // eslint-disable-next-line no-alert
      alert('谷歌浏览器版本过低，请更新！')
  }, [])

  return (
    <dialog
      ref={scListRef}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        maxHeight: `${maxHeight}px`,
      }}
    >
      <TransitionGroup className="sc-list">
        {scList.map(({ face, face_frame, uname, name_color, price, message, message_font_color, background_bottom_color, background_color, id, nodeRef, time }) =>
          (
            <CSSTransition classNames="sc" key={id} timeout={500} nodeRef={nodeRef}>
              <div ref={nodeRef as React.RefObject<HTMLDivElement>}>
                <div className="sc">
                  <div className="top-container" style={{ backgroundColor: background_color, borderColor: background_bottom_color }} ref={nodeRef as React.RefObject<HTMLDivElement>}>
                    <div className="avatar-container">
                      <div className="avatar" style={{ backgroundImage: `url(${face})` }} />
                      <div className="avatar frame" style={{ backgroundImage: `url(${face_frame})` }} />
                    </div>
                    <div className="top-right-container">
                      <span className="name" style={{ color: name_color }}>{uname}</span>
                      <span className="price">
                        {price}
                        元
                      </span>
                    </div>
                  </div>
                  <div className="content" style={{ color: message_font_color, backgroundColor: background_bottom_color }}>{message}</div>
                </div>
                <div className="progress-inner">
                  <div className="progress-bg" style={{ backgroundColor: background_bottom_color, animationDuration: `${time}s` }}></div>
                </div>
              </div>
            </CSSTransition>
          ),
        )}
      </TransitionGroup>
    </dialog>
  )
}

export default SCList
