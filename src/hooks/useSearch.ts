import { useState, useEffect, useRef } from 'react'
import { searchSpotify } from '../api/search'
import type { SpotifySearchResults } from '../types/spotify'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SpotifySearchResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!query.trim()) {
      setResults(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchSpotify(query)
        setResults(data)
        setError(null)
      } catch (err) {
        setError('Search failed')
        console.error('[Search]', err)
      } finally {
        setIsLoading(false)
      }
    }, 400)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  return { query, setQuery, results, isLoading, error }
}
