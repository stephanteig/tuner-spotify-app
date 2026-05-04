import { useState, useEffect } from 'react'
import { fetchUserPlaylists } from '../api/playlists'
import type { SpotifyPlaylist } from '../types/spotify'

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserPlaylists()
      .then(setPlaylists)
      .catch((err) => {
        console.error('[usePlaylists]', err)
        setError('Failed to load playlists')
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { playlists, isLoading, error }
}
