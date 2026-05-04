import { useState, useEffect } from 'react'
import { fetchRecentlyPlayed, fetchRecommendations } from '../api/recommendations'
import type { SpotifyTrack } from '../types/spotify'

export function useHomeData() {
  const [recentTracks, setRecentTracks] = useState<SpotifyTrack[]>([])
  const [recommendations, setRecommendations] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const recent = await fetchRecentlyPlayed()
        const tracks = recent.items.map((i) => i.track)
        setRecentTracks(tracks)

        const seedIds = tracks.slice(0, 3).map((t) => t.id)
        const recs = await fetchRecommendations(seedIds)
        setRecommendations(recs.tracks)
      } catch (err) {
        console.error('[useHomeData]', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return { recentTracks, recommendations, isLoading }
}
