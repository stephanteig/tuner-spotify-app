import { useState, useCallback } from 'react'
import { searchSpotify } from '../api/search'
import type { PlaylistTrack } from '../types/playlist'
import type { SpotifyTrack } from '../types/spotify'

export interface ResolvedTrack {
  input: PlaylistTrack
  spotifyTrack: SpotifyTrack | null
  resolved: boolean
}

export function useTrackResolver() {
  const [resolvedTracks, setResolvedTracks] = useState<ResolvedTrack[]>([])
  const [isResolving, setIsResolving] = useState(false)

  const resolve = useCallback(async (tracks: PlaylistTrack[]) => {
    setIsResolving(true)
    setResolvedTracks([])

    const results: ResolvedTrack[] = []

    for (const track of tracks) {
      try {
        const q = `track:${track.title} artist:${track.artist}`
        const data = await searchSpotify(q)
        const candidates = data.tracks?.items ?? []

        let best: SpotifyTrack | null = null
        let bestScore = 0

        for (const candidate of candidates) {
          let score = 0
          if (candidate.name.toLowerCase() === track.title.toLowerCase()) score += 3
          const candidateArtist = candidate.artists[0]?.name.toLowerCase() ?? ''
          if (candidateArtist === track.artist.toLowerCase()) score += 3
          if (candidate.album.name.toLowerCase() === track.album.toLowerCase()) score += 1
          if (Math.abs(candidate.duration_ms - track.duration_ms) <= 5000) score += 2

          if (score > bestScore) {
            bestScore = score
            best = candidate
          }
        }

        results.push({
          input: track,
          spotifyTrack: bestScore >= 4 ? best : null,
          resolved: bestScore >= 4,
        })
      } catch {
        results.push({ input: track, spotifyTrack: null, resolved: false })
      }
    }

    setResolvedTracks(results)
    setIsResolving(false)
    return results
  }, [])

  const reset = useCallback(() => {
    setResolvedTracks([])
  }, [])

  return { resolvedTracks, isResolving, resolve, reset }
}
