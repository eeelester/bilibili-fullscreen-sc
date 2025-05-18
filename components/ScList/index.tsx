import { createRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { useMove, useRAF } from './hook'
import type { SCListProps, ScInfo } from './type'
import { eventBus } from '@/utils/event'
import { DEFAULT_SIZE, POSITION_EVENT, PositionEnum, SIZE_EVENT, WS_SC_EVENT, sizeEnum } from '@/constant'
import closeIcon from '~/assets/close.svg'

import './index.less'

function SCList(props: SCListProps) {
  const { scDocument } = props
  const [scList, setScList] = useState<ScInfo[]>([])
  const [size, setSize] = useState<sizeEnum>(DEFAULT_SIZE)
  const [position, setPosition] = useState<PositionEnum>(PositionEnum.BOTTOM_LEFT)
  const scListRef = useRef<HTMLDivElement>(null)
  const positionProps = useMove(scListRef, scDocument, position)
  useRAF(setScList)

  const Listener = useCallback((scInfo: ScInfo) => {
    const existDeleteIdList: unknown = JSON.parse(sessionStorage.getItem('deleteId') ?? 'null')
    if (Array.isArray(existDeleteIdList) && existDeleteIdList.includes(scInfo.id)) {
      console.log(`该id已被删除`)
      return
    }
    setScList(prev => prev.concat({ ...scInfo, nodeRef: createRef(), addedTime: Date.now() }))
  }, [])

  useLayoutEffect(() => {
    void (async () => {
      try {
        const savedSize = await storage.getItem('local:UISize')
        if (savedSize && Object.values(sizeEnum).includes(savedSize as sizeEnum))
          setSize(savedSize as sizeEnum)

        // 获取保存的位置设置
        const savedPosition = await storage.getItem('local:UIPosition')
        if (savedPosition && Object.values(PositionEnum).includes(savedPosition as PositionEnum))
          setPosition(savedPosition as PositionEnum)
      }
      catch (error) {
        console.error('获取UI设置失败:', error)
      }
    })()
  }, [])

  useEffect(() => {
    eventBus.subscribe(WS_SC_EVENT, Listener)
    eventBus.subscribe(SIZE_EVENT, setSize)
    // 订阅位置变更事件
    eventBus.subscribe(POSITION_EVENT, setPosition)

    return () => {
      eventBus.unsubscribe(WS_SC_EVENT, Listener)
      eventBus.unsubscribe(SIZE_EVENT, setSize)
      eventBus.unsubscribe(POSITION_EVENT, setPosition)
    }
  }, [Listener, setSize])

  const handleDelete = (e: React.MouseEvent<HTMLImageElement, MouseEvent>, id: number) => {
    e.stopPropagation()
    setScList(prev => prev.filter(item => item.id !== id))
    const existDeleteIdList: unknown = JSON.parse(sessionStorage.getItem('deleteId') ?? 'null')
    sessionStorage.setItem('deleteId', JSON.stringify(Array.isArray(existDeleteIdList) ? existDeleteIdList.concat([id]) : [id]))
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
              <div ref={nodeRef as React.RefObject<HTMLDivElement>}>
                <div className="sc">
                  <div
                    className="top-container"
                    style={{
                      backgroundColor: background_color,
                      borderColor: background_bottom_color,
                    }}
                    ref={nodeRef as React.RefObject<HTMLDivElement>}
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
                      <span className="name" style={{ color: name_color }}>
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
