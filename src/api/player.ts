import { spotifyFetch } from '../utils/spotifyClient'
import type { SpotifyTrack } from '../types/spotify'

export async function playTrack(trackUri: string, deviceId: string): Promise<void> {
  await spotifyFetch(`/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ uris: [trackUri] }),
  })
}

export async function playContext(
  contextUri: string,
  trackUri: string,
  deviceId: string,
): Promise<void> {
  await spotifyFetch(`/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ context_uri: contextUri, offset: { uri: trackUri } }),
  })
}

export async function pausePlayback(deviceId: string): Promise<void> {
  await spotifyFetch(`/me/player/pause?device_id=${deviceId}`, { method: 'PUT' })
}

export async function resumePlayback(deviceId: string): Promise<void> {
  await spotifyFetch(`/me/player/play?device_id=${deviceId}`, { method: 'PUT' })
}

export async function skipToNext(deviceId: string): Promise<void> {
  await spotifyFetch(`/me/player/next?device_id=${deviceId}`, { method: 'POST' })
}

export async function skipToPrevious(deviceId: string): Promise<void> {
  await spotifyFetch(`/me/player/previous?device_id=${deviceId}`, { method: 'POST' })
}

export async function seekToPosition(deviceId: string, positionMs: number): Promise<void> {
  await spotifyFetch(
    `/me/player/seek?device_id=${deviceId}&position_ms=${positionMs}`,
    { method: 'PUT' },
  )
}

export async function setShuffle(state: boolean, deviceId: string): Promise<void> {
  await spotifyFetch(`/me/player/shuffle?state=${state}&device_id=${deviceId}`, {
    method: 'PUT',
  })
}

export type RepeatMode = 'off' | 'context' | 'track'

export async function setRepeat(state: RepeatMode, deviceId: string): Promise<void> {
  await spotifyFetch(`/me/player/repeat?state=${state}&device_id=${deviceId}`, {
    method: 'PUT',
  })
}

export async function addToQueue(trackUri: string, deviceId: string): Promise<void> {
  await spotifyFetch(
    `/me/player/queue?uri=${encodeURIComponent(trackUri)}&device_id=${deviceId}`,
    { method: 'POST' },
  )
}

export interface SpotifyQueue {
  currently_playing: SpotifyTrack | null
  queue: SpotifyTrack[]
}

export async function getQueue(): Promise<SpotifyQueue> {
  return spotifyFetch<SpotifyQueue>('/me/player/queue')
}
