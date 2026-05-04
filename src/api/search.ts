import { spotifyFetch } from '../utils/spotifyClient'
import type { SpotifySearchResults } from '../types/spotify'

export async function searchSpotify(query: string): Promise<SpotifySearchResults> {
  const params = new URLSearchParams({
    q: query,
    type: 'artist,album,track',
    limit: '10',
    market: 'from_token',
  })
  return spotifyFetch<SpotifySearchResults>(`/search?${params.toString()}`)
}
