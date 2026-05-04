import { spotifyFetch } from '../utils/spotifyClient'
import type { SpotifyArtist, SpotifyTrack } from '../types/spotify'

export async function fetchArtist(artistId: string): Promise<SpotifyArtist> {
  return spotifyFetch<SpotifyArtist>(`/artists/${artistId}`)
}

export async function fetchArtistTopTracks(artistId: string): Promise<SpotifyTrack[]> {
  const result = await spotifyFetch<{ tracks: SpotifyTrack[] }>(
    `/artists/${artistId}/top-tracks?market=from_token`,
  )
  return result.tracks
}
