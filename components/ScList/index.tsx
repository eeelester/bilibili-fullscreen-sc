import { createRef, useCallback, useEffect, useRef, useState } from 'react'
import {
  CSSTransition,
  TransitionGroup,
} from 'react-transition-group'
import { useMove } from './hook'
import { eventBus } from '@/utils/event'
import { WS_SC_EVENT } from '@/constant'
import closeIcon from '~/assets/close.svg';
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
  const scListRef = useRef<HTMLDivElement>(null)
  const { left, bottom, maxHeight } = useMove(scListRef)
  const timeoutMap = useRef(new Map<number, NodeJS.Timeout>())

  const Listener = useCallback((scInfo: ScInfo) => {
    const existDeleteIdList = JSON.parse(sessionStorage.getItem('deleteId') ?? 'null')
    if (Array.isArray(existDeleteIdList) && existDeleteIdList.indexOf(scInfo.id) > -1) {
      console.log(`该id已被删除`)
      return
    } 
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

  const handleDelete = (e: React.MouseEvent<HTMLImageElement, MouseEvent>, id: number) => {
    e.stopPropagation()
    setScList(prev => prev.filter(item => item.id !== id))
    const existDeleteIdList = JSON.parse(sessionStorage.getItem('deleteId') ?? 'null')
    sessionStorage.setItem('deleteId', JSON.stringify(Array.isArray(existDeleteIdList) ? existDeleteIdList.concat([id]) : [id]))
  }

  return (
    <div className="container" ref={scListRef}>
      <TransitionGroup className="sc-list" style={{ left: `${left}px`, bottom: `${bottom}px`, maxHeight: `${maxHeight}px` }}>
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
                  <img src={closeIcon} alt="关闭" className="close-btn" onClick={(e) => handleDelete(e, id)} />
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
    </div>
  )
}

export default SCList
