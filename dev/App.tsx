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
      processData({ ...testData, ...{ data: { ...testData.data, id: Math.floor(Math.random() * 10000), time: [10, 2, 3, 5, 4, 3, 7, 8, 9, 1, 2][count], message: String(count) } } })
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
