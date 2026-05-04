export interface SpotifyImage {
  url: string
  height: number
  width: number
}

export interface SpotifyUser {
  id: string
  display_name: string
  images: SpotifyImage[]
}

export interface SpotifyArtist {
  id: string
  name: string
  images: SpotifyImage[]
  followers: { total: number }
  genres: string[]
}

export interface SpotifyAlbum {
  id: string
  name: string
  images: SpotifyImage[]
}

export interface SpotifyTrack {
  id: string
  uri: string
  name: string
  duration_ms: number
  artists: SpotifyArtist[]
  album: SpotifyAlbum
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description?: string
  images: SpotifyImage[]
  tracks: { total: number }
}

export interface SpotifySearchResults {
  artists?: {
    items: SpotifyArtist[]
  }
  tracks?: {
    items: SpotifyTrack[]
  }
  albums?: {
    items: SpotifyAlbum[]
  }
}

export interface SpotifyRecentlyPlayed {
  items: Array<{
    track: SpotifyTrack
    played_at: string
  }>
}

export interface SpotifyRecommendations {
  tracks: SpotifyTrack[]
}

export interface SpotifyPagingObject<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

// Spotify Web Playback SDK types
export interface SpotifyPlayerState {
  track_window: {
    current_track: {
      id: string
      uri: string
      name: string
      duration_ms: number
      artists: Array<{ name: string }>
      album: {
        name: string
        images: SpotifyImage[]
      }
    }
  }
  paused: boolean
  position: number
}
