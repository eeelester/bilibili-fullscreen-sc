import { useEffect, useRef } from 'react'

function usePrevious(data) {
  const ref = useRef(true)
  useEffect(() => {
    // eslint-disable-next-line ts/no-unsafe-assignment
    ref.current = data
  }, [data])
  return ref.current
}

export { usePrevious }
