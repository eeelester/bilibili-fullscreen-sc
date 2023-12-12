/* eslint-disable ts/no-unsafe-assignment */
import { useEffect } from 'react'
import testData from './test'
import SCList from '@/components/ScList'
import { eventBus } from '@/utils/event'
import { WS_SC_EVENT } from '@/constant'

/**
 * @description: dev环境测试SCList
 * @return {*}
 */
export default function App() {
  useEffect(() => {
    let count = 0
    let timeout: NodeJS.Timeout
    const timeoutCallback = () => {
      processData({ ...testData, ...{ data: { ...testData.data, id: Math.floor(Math.random() * 10000), time: [10, 2, 3, 5, 4, 3, 7, 8, 9, 1, 2][count], message: count } } })
      // processData({ ...testData, ...{ data: { ...testData.data, id: Math.floor(Math.random() * 10000) } } })
      count++
      if (count > 10)
        clearTimeout(timeout)
      else
        setTimeout(timeoutCallback, 1000)
    }
    timeout = setTimeout(timeoutCallback, 1000)

    processData({ ...testData, ...{ data: { ...testData.data, id: Math.floor(Math.random() * 10000) } } })

    return () => {
      clearTimeout(timeout)
    }
  }, [])
  return <SCList />
}

function processData(res) {
  const {
    data: {
      user_info: {
        face,
        face_frame,
        uname,
        name_color,
      },
      price,
      message,
      message_font_color,
      background_bottom_color,
      background_color,
      time,
      id,
    },
  } = res

  eventBus.emit(WS_SC_EVENT, {
    face,
    face_frame,
    uname,
    name_color,
    price,
    message,
    message_font_color,
    background_bottom_color,
    background_color,
    time,
    id,
  })
}
