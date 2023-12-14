import { useEffect, useRef } from 'react'
import { POPUP_INITIAL_STATE } from '@/constant'

function usePrevious(data) {
  const ref = useRef(POPUP_INITIAL_STATE)
  useEffect(() => {
    // eslint-disable-next-line ts/no-unsafe-assignment
    ref.current = data
  }, [data])
  return ref.current
}

export { usePrevious }
