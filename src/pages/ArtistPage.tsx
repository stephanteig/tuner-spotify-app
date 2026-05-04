import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchArtist, fetchArtistTopTracks } from '../api/artists'
import { usePlayer } from '../context/PlayerContext'
import { useAddToPlaylist } from '../context/PlaylistAdderContext'
import { TrackRow } from '../components/ui/TrackRow'
import { Spinner } from '../components/ui/Spinner'
import type { SpotifyArtist, SpotifyTrack } from '../types/spotify'

export function ArtistPage() {
  const { id } = useParams<{ id: string }>()
  const { play, addToQueue, currentTrack, isPlaying } = usePlayer()
  const openAddToPlaylist = useAddToPlaylist()

  const [artist, setArtist] = useState<SpotifyArtist | null>(null)
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    setError(null)

    Promise.all([fetchArtist(id), fetchArtistTopTracks(id)])
      .then(([artistData, tracksData]) => {
        setArtist(artistData)
        setTracks(tracksData)
      })
      .catch((err) => {
        console.error('[ArtistPage]', err)
        setError('Failed to load artist')
      })
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={32} />
      </div>
    )
  }

  if (error || !artist) {
    return (
      <div className="flex justify-center py-24">
        <p className="text-secondary text-sm">{error ?? 'Artist not found'}</p>
      </div>
    )
  }

  const heroImage = artist.images?.[0]?.url

  return (
    <div className="flex flex-col gap-8 -mx-8 -mt-6">
      {/* Hero header */}
      <div className="relative h-72 overflow-hidden">
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
        <div className="relative h-full flex items-end px-8 pb-6 gap-6">
          {heroImage ? (
            <img
              src={heroImage}
              alt={artist.name}
              className="w-44 h-44 rounded-full object-cover shadow-2xl flex-shrink-0"
            />
          ) : (
            <div className="w-44 h-44 rounded-full bg-elevated flex items-center justify-center text-5xl font-bold text-white flex-shrink-0">
              {artist.name.charAt(0)}
            </div>
          )}
          <div className="flex flex-col gap-1 pb-2">
            <p className="text-xs text-secondary uppercase tracking-widest font-medium">Artist</p>
            <h1 className="text-4xl font-bold text-white leading-tight">{artist.name}</h1>
            <p className="text-secondary text-sm mt-1">
              {artist.followers?.total?.toLocaleString()} followers
              {artist.genres?.length > 0 && (
                <span className="ml-3 text-muted">{artist.genres.slice(0, 2).join(', ')}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="px-8">
        <h2 className="text-lg font-semibold text-white mb-3">Popular</h2>
        <div className="flex flex-col">
          {tracks.map((track, i) => (
            <TrackRow
              key={track.id}
              index={i + 1}
              title={track.name}
              artist={track.artists.map((a) => a.name).join(', ')}
              albumImageUrl={track.album.images?.[0]?.url}
              durationMs={track.duration_ms}
              isPlaying={currentTrack?.id === track.id && isPlaying}
              onClick={() => play(track.uri)}
              onAddToQueue={() => addToQueue(track.uri)}
              onAddToPlaylist={() => openAddToPlaylist(track.uri)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
