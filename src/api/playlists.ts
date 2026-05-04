import { spotifyFetch } from '../utils/spotifyClient'
import type { SpotifyPlaylist, SpotifyPagingObject, SpotifyTrack } from '../types/spotify'

export async function fetchPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
  return spotifyFetch<SpotifyPlaylist>(`/playlists/${playlistId}`)
}

export async function fetchPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
  const result = await spotifyFetch<SpotifyPagingObject<{ track: SpotifyTrack }>>(
    `/playlists/${playlistId}/tracks?limit=50&fields=items(track(id,uri,name,duration_ms,artists,album))`,
  )
  return result.items.map((i) => i.track).filter(Boolean)
}

export async function fetchUserPlaylists(): Promise<SpotifyPlaylist[]> {
  const result = await spotifyFetch<SpotifyPagingObject<SpotifyPlaylist>>(
    '/me/playlists?limit=20',
  )
  return result.items
}

export async function createPlaylist(
  userId: string,
  name: string,
  description?: string,
): Promise<SpotifyPlaylist> {
  return spotifyFetch<SpotifyPlaylist>(`/users/${userId}/playlists`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      description: description ?? '',
      public: false,
    }),
  })
}

export async function addTracksToPlaylist(
  playlistId: string,
  trackUris: string[],
): Promise<void> {
  await spotifyFetch(`/playlists/${playlistId}/tracks`, {
    method: 'POST',
    body: JSON.stringify({ uris: trackUris }),
  })
}

export async function removeTracksFromPlaylist(
  playlistId: string,
  trackUris: string[],
): Promise<void> {
  await spotifyFetch(`/playlists/${playlistId}/tracks`, {
    method: 'DELETE',
    body: JSON.stringify({ tracks: trackUris.map((uri) => ({ uri })) }),
  })
}

export async function reorderPlaylistTrack(
  playlistId: string,
  rangeStart: number,
  insertBefore: number,
): Promise<void> {
  await spotifyFetch(`/playlists/${playlistId}/tracks`, {
    method: 'PUT',
    body: JSON.stringify({ range_start: rangeStart, insert_before: insertBefore, range_length: 1 }),
  })
}

export async function updatePlaylistDetails(
  playlistId: string,
  name: string,
  description: string,
): Promise<void> {
  await spotifyFetch(`/playlists/${playlistId}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description }),
  })
}

export async function uploadPlaylistCover(playlistId: string, base64Jpeg: string): Promise<void> {
  await spotifyFetch(`/playlists/${playlistId}/images`, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: base64Jpeg,
  })
}
