import { createRef, useCallback, useEffect, useRef, useState } from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { useMove, useScExpiration } from './hook'
import type { SCListProps, ScInfo, ScMessage } from './type'
import { eventBus } from '@/utils/event'
import { WS_SC_EVENT } from '@/constant'
import { readDeletedScIds, rememberDeletedSc } from '@/utils/deletedSc'
import { useUiSettings } from '@/components/useUiSettings'
import closeIcon from '~/assets/close.svg'

import './index.less'

function SCList(props: SCListProps) {
  const { scDocument = document, onReady, uiSettings, preview = false } = props
  const [scList, setScList] = useState<ScInfo[]>([])
  const savedSettings = useUiSettings(!uiSettings)
  const { size, position } = uiSettings || savedSettings
  const scListRef = useRef<HTMLDivElement>(null)
  const positionProps = useMove(scListRef, scDocument, position, !preview)
  useScExpiration(scList, setScList, scDocument)

  const Listener = useCallback((scInfo: ScMessage) => {
    if (readDeletedScIds().has(scInfo.id))
      return
    setScList(prev => prev.some(item => item.id === scInfo.id)
      ? prev
      : prev.concat({ ...scInfo, nodeRef: createRef<HTMLDivElement>(), addedTime: Date.now() }))
  }, [])

  useEffect(() => {
    eventBus.subscribe(WS_SC_EVENT, Listener)
    onReady?.()

    return () => {
      eventBus.unsubscribe(WS_SC_EVENT, Listener)
    }
  }, [Listener, onReady])

  const handleDelete = (e: React.MouseEvent<HTMLImageElement, MouseEvent>, id: number) => {
    e.stopPropagation()
    setScList(prev => prev.filter(item => item.id !== id))
    const item = scList.find(item => item.id === id)
    if (item)
      rememberDeletedSc(id, item.addedTime + (item.time - item.delay) * 1000)
  }

  return (
    <div className={`container ${size}`} ref={scListRef}>
      <TransitionGroup
        className="sc-list"
        style={{
          ...positionProps,
        }}
      >
        {scList.map(
          ({
            face,
            face_frame,
            uname,
            name_color,
            price,
            message,
            message_font_color,
            background_bottom_color,
            background_color,
            id,
            nodeRef,
            time,
            delay,
          }) => (
            <CSSTransition classNames="sc" key={id} timeout={500} nodeRef={nodeRef}>
              <div ref={nodeRef}>
                <div className="sc">
                  <div
                    className="top-container"
                    style={{
                      backgroundColor: background_color,
                      borderColor: background_bottom_color,
                    }}
                  >
                    <div className="avatar-container">
                      <div
                        className="avatar"
                        style={{
                          backgroundImage: `url(${face})`,
                        }}
                      />
                      <div
                        className="avatar frame"
                        style={{
                          backgroundImage: `url(${face_frame})`,
                        }}
                      />
                    </div>
                    <div className="top-right-container">
                      <span className="name" style={{ '--sc-name-color': name_color } as React.CSSProperties}>
                        {uname}
                      </span>
                      <span className="price">
                        {price}
                        元
                      </span>
                    </div>
                    <img src={closeIcon} alt="关闭" className="close-btn" onClick={e => handleDelete(e, id)} />
                  </div>
                  <div
                    className="content"
                    style={{
                      color: message_font_color,
                      backgroundColor: background_bottom_color,
                    }}
                  >
                    {message}
                  </div>
                </div>
                <div className="progress-inner">
                  <div
                    className="progress-bg"
                    style={{
                      backgroundColor: background_bottom_color,
                      animationDuration: `${time}s`,
                      animationDelay: `-${delay}s`,
                    }}
                  >
                  </div>
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
