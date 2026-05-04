import { spotifyFetch } from '../utils/spotifyClient'
import type { SpotifyUser } from '../types/spotify'

export async function fetchUserProfile(): Promise<SpotifyUser> {
  return spotifyFetch<SpotifyUser>('/me')
}
