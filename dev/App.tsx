import { useEffect } from 'react'
import SCList from '@/components/ScList'
import { superChatFixture } from '@/fixtures/superChat'
import { processData } from '@/utils'

/**
 * @description: dev环境测试SCList
 * @return {*}
 */
export default function App() {
  useEffect(() => {
    let count = 0
    let timeout: NodeJS.Timeout
    const timeoutCallback = () => {
      processData({ ...superChatFixture, ...{ data: { ...superChatFixture.data, id: Math.floor(Math.random() * 10000), time: [60, 60, 30, 60, 200, 30, 60, 30, 60, 200, 60, 60, 30, 60, 200, 30, 60, 30, 60, 200][count], message: String(count) } } })
      count++
      if (count > 20)
        clearTimeout(timeout)
      else
        timeout = setTimeout(timeoutCallback, 100)
    }
    timeout = setTimeout(timeoutCallback, 100)

    processData({ ...superChatFixture, ...{ data: { ...superChatFixture.data, id: Math.floor(Math.random() * 10000) } } })

    return () => {
      clearTimeout(timeout)
    }
  }, [])
  return <SCList />
}
