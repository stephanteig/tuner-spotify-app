import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../../context/PlayerContext'
import { useAddToPlaylist } from '../../context/PlaylistAdderContext'
import { TrackRow } from '../ui/TrackRow'
import { Spinner } from '../ui/Spinner'
import type { SpotifySearchResults } from '../../types/spotify'

interface SearchResultsProps {
  query: string
  results: SpotifySearchResults | null
  isLoading: boolean
}

export function SearchResults({ query, results, isLoading }: SearchResultsProps) {
  const navigate = useNavigate()
  const { play, addToQueue } = usePlayer()
  const openAddToPlaylist = useAddToPlaylist()

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    )
  }

  if (!results) return null

  const artists = results.artists?.items ?? []
  const tracks = results.tracks?.items ?? []
  const albums = results.albums?.items ?? []

  return (
    <div className="flex flex-col gap-10">
      {/* Artists */}
      {artists.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Artists</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {artists.map((artist) => (
              <button
                key={artist.id}
                onClick={() => navigate(`/artist/${artist.id}`)}
                className="flex-shrink-0 flex flex-col items-center gap-2 w-36 p-4 rounded-lg bg-surface hover:bg-elevated transition-colors text-center"
              >
                {artist.images?.[0]?.url ? (
                  <img
                    src={artist.images[0].url}
                    alt={artist.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-elevated flex items-center justify-center text-secondary text-3xl font-bold">
                    {artist.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-white truncate w-full">{artist.name}</span>
                <span className="text-xs text-secondary">Artist</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Artists</h2>
          <p className="text-secondary text-sm">No artists found for "{query}"</p>
        </section>
      )}

      {/* Top Tracks */}
      {tracks.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Top Tracks</h2>
          <div className="flex flex-col">
            {tracks.map((track, i) => (
              <TrackRow
                key={track.id}
                index={i + 1}
                title={track.name}
                artist={track.artists.map((a) => a.name).join(', ')}
                albumImageUrl={track.album.images?.[0]?.url}
                durationMs={track.duration_ms}
                onClick={() => play(track.uri)}
                onAddToQueue={() => addToQueue(track.uri)}
                onAddToPlaylist={() => openAddToPlaylist(track.uri)}
              />
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Top Tracks</h2>
          <p className="text-secondary text-sm">No tracks found for "{query}"</p>
        </section>
      )}

      {/* Albums */}
      {albums.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Albums</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {albums.map((album) => (
              <div
                key={album.id}
                className="flex-shrink-0 flex flex-col gap-2 w-36 p-3 rounded-lg bg-surface hover:bg-elevated transition-colors cursor-pointer"
              >
                {album.images?.[0]?.url ? (
                  <img
                    src={album.images[0].url}
                    alt={album.name}
                    className="w-full aspect-square rounded object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square rounded bg-elevated" />
                )}
                <span className="text-sm font-medium text-white truncate">{album.name}</span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Albums</h2>
          <p className="text-secondary text-sm">No albums found for "{query}"</p>
        </section>
      )}
    </div>
  )
}
