import { useEffect, useState } from 'react'

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const m = window.matchMedia(query)
    const fn = (e) => setMatches(e.matches)
    m.addEventListener('change', fn)
    setMatches(m.matches)
    return () => m.removeEventListener('change', fn)
  }, [query])
  return matches
}
