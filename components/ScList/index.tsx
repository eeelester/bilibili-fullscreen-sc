import type { ScInfo, SCListProps } from './type'
import type { sizeEnum } from '@/constant'
import type { SuperChatEvent } from '@/utils/event'
import { createRef, useCallback, useEffect, useRef, useState } from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { DEFAULT_SIZE, PositionEnum, WS_SC_EVENT } from '@/constant'
import { getDeletedScStorageKey, readDeletedScIds, writeDeletedScIds } from '@/utils/deletedSc'
import { eventBus } from '@/utils/event'
import { normalizePosition, normalizeSize, uiPositionStorage, uiSizeStorage } from '@/utils/settings'
import closeIcon from '~/assets/close.svg'
import { useExpiryTimer, useMove } from './hook'

import './index.less'

function SCList(props: SCListProps) {
  const { scDocument = document } = props
  const [scList, setScList] = useState<ScInfo[]>([])
  const [size, setSize] = useState<sizeEnum>(DEFAULT_SIZE)
  const [position, setPosition] = useState<PositionEnum>(PositionEnum.BOTTOM_LEFT)
  const scListRef = useRef<HTMLDivElement>(null)
  const deletedStorageKey = getDeletedScStorageKey(location.pathname)
  const deletedIdsRef = useRef<Set<number>>()
  deletedIdsRef.current ??= new Set(readDeletedScIds(sessionStorage, deletedStorageKey))
  const { dragHandleProps, style: positionStyle } = useMove(scListRef, scDocument, position)
  useExpiryTimer(scList, setScList, scDocument)

  const Listener = useCallback((scInfo: SuperChatEvent) => {
    if (deletedIdsRef.current?.has(scInfo.id))
      return

    setScList((prev) => {
      if (prev.some(item => item.id === scInfo.id))
        return prev

      return prev.concat({ ...scInfo, nodeRef: createRef<HTMLDivElement>(), addedTime: Date.now() })
    })
  }, [])

  useEffect(() => {
    let active = true
    void Promise.all([
      uiSizeStorage.getValue(),
      uiPositionStorage.getValue(),
    ]).then(([savedSize, savedPosition]) => {
      if (!active)
        return

      setSize(normalizeSize(savedSize))
      setPosition(normalizePosition(savedPosition))
    }).catch(() => {})

    const unwatchSize = uiSizeStorage.watch(nextSize => setSize(normalizeSize(nextSize)))
    const unwatchPosition = uiPositionStorage.watch(nextPosition => setPosition(normalizePosition(nextPosition)))

    return () => {
      active = false
      unwatchSize()
      unwatchPosition()
    }
  }, [])

  useEffect(() => {
    eventBus.subscribe(WS_SC_EVENT, Listener)
    return () => {
      eventBus.unsubscribe(WS_SC_EVENT, Listener)
    }
  }, [Listener])

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    e.stopPropagation()
    setScList(prev => prev.filter(item => item.id !== id))
    deletedIdsRef.current?.add(id)
    writeDeletedScIds(sessionStorage, deletedStorageKey, deletedIdsRef.current ?? [])
  }

  return (
    <div className={`bfs-sc-root ${size}`}>
      <div className="bfs-sc-overlay" ref={scListRef} style={positionStyle}>
        <button
          type="button"
          className="bfs-sc-drag-handle"
          aria-label="拖动醒目留言列表"
          title="拖动醒目留言列表"
          {...dragHandleProps}
        >
          <span aria-hidden="true">⠿</span>
        </button>
        <TransitionGroup className="bfs-sc-list">
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
              <CSSTransition
                classNames="sc"
                key={id}
                timeout={500}
                nodeRef={nodeRef}
              >
                <div ref={nodeRef}>
                  <div className="bfs-sc-card">
                    <div
                      className="bfs-sc-header"
                      style={{
                        backgroundColor: background_color,
                        borderColor: background_bottom_color,
                      }}
                    >
                      <div className="bfs-sc-avatar-wrap">
                        <div
                          className="bfs-sc-avatar"
                          style={{
                            backgroundImage: `url(${face})`,
                          }}
                        />
                        <div
                          className="bfs-sc-avatar bfs-sc-avatar-frame"
                          style={{
                            backgroundImage: `url(${face_frame})`,
                          }}
                        />
                      </div>
                      <div className="bfs-sc-meta">
                        <span className="bfs-sc-name" style={{ '--sc-name-color': name_color } as React.CSSProperties}>
                          {uname}
                        </span>
                        <span className="bfs-sc-price">
                          {price}
                          元
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label={`关闭 ${uname} 的醒目留言`}
                        className="bfs-sc-close"
                        onClick={e => handleDelete(e, id)}
                      >
                        <img src={closeIcon} alt="" />
                      </button>
                    </div>
                    <div
                      className="bfs-sc-content"
                      style={{
                        color: message_font_color,
                        backgroundColor: background_bottom_color,
                      }}
                    >
                      {message}
                    </div>
                  </div>
                  <div className="bfs-sc-progress">
                    <div
                      className="bfs-sc-progress-bar"
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
    </div>
  )
}

export default SCList
