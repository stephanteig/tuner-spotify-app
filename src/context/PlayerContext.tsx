import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { getAccessToken } from '../utils/tokenStorage'
import { setShuffle as apiSetShuffle, setRepeat, addToQueue as apiAddToQueue } from '../api/player'
import type { RepeatMode } from '../api/player'

export type { RepeatMode }

interface CurrentTrack {
  id: string
  uri: string
  name: string
  durationMs: number
  artistName: string
  albumName: string
  albumImageUrl: string
}

interface PlayerContextValue {
  currentTrack: CurrentTrack | null
  isPlaying: boolean
  position: number
  volume: number
  deviceId: string | null
  premiumRequired: boolean
  shuffle: boolean
  repeatMode: RepeatMode
  play: (trackUri: string, contextUri?: string) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  next: () => Promise<void>
  prev: () => Promise<void>
  seek: (ms: number) => Promise<void>
  setVolume: (vol: number) => Promise<void>
  toggleShuffle: () => Promise<void>
  cycleRepeat: () => Promise<void>
  addToQueue: (trackUri: string) => Promise<void>
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume?: number
      }) => SpotifySDKPlayer
    }
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

interface SpotifySDKPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  togglePlay(): Promise<void>
  nextTrack(): Promise<void>
  previousTrack(): Promise<void>
  seek(positionMs: number): Promise<void>
  setVolume(volume: number): Promise<void>
  getCurrentState(): Promise<SpotifySDKState | null>
  addListener(event: string, cb: (data: unknown) => void): boolean
  removeListener(event: string, cb?: (data: unknown) => void): boolean
}

interface SpotifySDKState {
  track_window: {
    current_track: {
      id: string
      uri: string
      name: string
      duration_ms: number
      artists: Array<{ name: string; uri: string }>
      album: { name: string; images: Array<{ url: string }> }
    }
  }
  paused: boolean
  position: number
  shuffle: boolean
  repeat_mode: 0 | 1 | 2
}

const REPEAT_CYCLE: RepeatMode[] = ['off', 'context', 'track']

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const playerRef = useRef<SpotifySDKPlayer | null>(null)
  const shufflePendingRef = useRef(false)
  const repeatPendingRef = useRef(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [volume, setVolumeState] = useState(0.8)
  const [premiumRequired, setPremiumRequired] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off')

  useEffect(() => {
    if (!isAuthenticated) return
    if (document.getElementById('spotify-sdk')) {
      if (window.Spotify) setSdkReady(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'spotify-sdk'
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.head.appendChild(script)
    window.onSpotifyWebPlaybackSDKReady = () => setSdkReady(true)
  }, [isAuthenticated])

  useEffect(() => {
    if (!sdkReady || !isAuthenticated || playerRef.current) return

    const player = new window.Spotify.Player({
      name: 'Tuner',
      getOAuthToken: (cb) => { const t = getAccessToken(); if (t) cb(t) },
      volume,
    })

    playerRef.current = player

    player.addListener('ready', (data) => {
      const { device_id } = data as { device_id: string }
      setDeviceId(device_id)
    })

    player.addListener('not_ready', () => {
      player.connect()
    })

    player.addListener('player_state_changed', (state) => {
      if (!state) return
      const s = state as SpotifySDKState
      const track = s.track_window.current_track
      setCurrentTrack({
        id: track.id,
        uri: track.uri,
        name: track.name,
        durationMs: track.duration_ms,
        artistName: track.artists.map((a) => a.name).join(', '),
        albumName: track.album.name,
        albumImageUrl: track.album.images[0]?.url ?? '',
      })
      setIsPlaying(!s.paused)
      setPosition(s.position)
      if (!shufflePendingRef.current) setShuffle(s.shuffle)
      if (!repeatPendingRef.current) setRepeatMode(REPEAT_CYCLE[s.repeat_mode] ?? 'off')
    })

    player.addListener('authentication_error', (data) => {
      const { message } = data as { message: string }
      if (message.toLowerCase().includes('premium') || message.toLowerCase().includes('authentication')) {
        setPremiumRequired(true)
      }
    })

    player.addListener('account_error', (data) => {
      const { message } = data as { message: string }
      if (message.toLowerCase().includes('premium')) setPremiumRequired(true)
    })

    player.addListener('initialization_error', (data) => {
      console.error('[Player] Init error:', (data as { message: string }).message)
    })

    player.connect()
    return () => { player.disconnect(); playerRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady, isAuthenticated])

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => setPosition((p) => p + 500), 500)
    return () => clearInterval(interval)
  }, [isPlaying])

  const play = useCallback(async (trackUri: string, contextUri?: string) => {
    if (!deviceId) return
    const token = getAccessToken()
    if (!token) return

    const body = contextUri
      ? { context_uri: contextUri, offset: { uri: trackUri } }
      : { uris: [trackUri] }

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }, [deviceId])

  const pause = useCallback(async () => { await playerRef.current?.togglePlay() }, [])
  const resume = useCallback(async () => { await playerRef.current?.togglePlay() }, [])
  const next = useCallback(async () => { await playerRef.current?.nextTrack() }, [])
  const prev = useCallback(async () => { await playerRef.current?.previousTrack() }, [])

  const seek = useCallback(async (ms: number) => {
    await playerRef.current?.seek(ms)
    setPosition(ms)
  }, [])

  const setVolume = useCallback(async (vol: number) => {
    await playerRef.current?.setVolume(vol)
    setVolumeState(vol)
  }, [])

  const toggleShuffle = useCallback(async () => {
    if (!deviceId) return
    const next = !shuffle
    shufflePendingRef.current = true
    setShuffle(next)
    await apiSetShuffle(next, deviceId)
    setTimeout(() => { shufflePendingRef.current = false }, 1500)
  }, [shuffle, deviceId])

  const cycleRepeat = useCallback(async () => {
    if (!deviceId) return
    const idx = REPEAT_CYCLE.indexOf(repeatMode)
    const next = REPEAT_CYCLE[(idx + 1) % REPEAT_CYCLE.length]
    repeatPendingRef.current = true
    setRepeatMode(next)
    await setRepeat(next, deviceId)
    setTimeout(() => { repeatPendingRef.current = false }, 1500)
  }, [repeatMode, deviceId])

  const addToQueue = useCallback(async (trackUri: string) => {
    if (!deviceId) return
    await apiAddToQueue(trackUri, deviceId)
  }, [deviceId])

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, position, volume, deviceId,
      premiumRequired, shuffle, repeatMode,
      play, pause, resume, next, prev, seek, setVolume,
      toggleShuffle, cycleRepeat, addToQueue,
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
