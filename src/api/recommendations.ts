import { spotifyFetch } from '../utils/spotifyClient'
import type { SpotifyRecentlyPlayed, SpotifyRecommendations } from '../types/spotify'

export async function fetchRecentlyPlayed(): Promise<SpotifyRecentlyPlayed> {
  return spotifyFetch<SpotifyRecentlyPlayed>('/me/player/recently-played?limit=10')
}

export async function fetchRecommendations(
  seedTracks: string[],
): Promise<SpotifyRecommendations> {
  // Fall back to genre seeds if no track IDs provided
  if (seedTracks.length === 0) {
    return spotifyFetch<SpotifyRecommendations>(
      '/recommendations?seed_genres=pop,indie&limit=10',
    )
  }

  const seeds = seedTracks.slice(0, 3).join(',')
  return spotifyFetch<SpotifyRecommendations>(
    `/recommendations?seed_tracks=${seeds}&limit=10`,
  )
}
