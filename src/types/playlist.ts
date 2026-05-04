export interface PlaylistTrack {
  title: string
  artist: string
  album: string
  duration_ms: number
}

export type PlaylistJSON = PlaylistTrack[]
