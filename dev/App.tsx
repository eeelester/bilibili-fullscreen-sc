import { useEffect } from 'react'
import { testData } from './testData'
import SCList from '@/components/ScList'
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
      processData({ ...testData, ...{ data: { ...testData.data, id: Math.floor(Math.random() * 10000), time: [60, 60, 30, 60, 200, 30, 60, 30, 60, 200, 60, 60, 30, 60, 200, 30, 60, 30, 60, 200][count], message: String(count) } } })
      // processData({ ...testData, ...{ data: { ...testData.data, id: Math.floor(Math.random() * 10000) } } })
      count++
      if (count > 20)
        clearTimeout(timeout)
      else
        setTimeout(timeoutCallback, 100)
    }
    timeout = setTimeout(timeoutCallback, 100)

    processData({ ...testData, ...{ data: { ...testData.data, id: Math.floor(Math.random() * 10000) } } })

    return () => {
      clearTimeout(timeout)
    }
  }, [])
  return <SCList />
}
