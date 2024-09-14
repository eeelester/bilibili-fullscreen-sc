import { useEffect, useRef } from 'react'

function usePrevious(data: boolean) {
  const ref = useRef(data)
  useEffect(() => {
    ref.current = data
  }, [data])
  return ref.current
}

export { usePrevious }
