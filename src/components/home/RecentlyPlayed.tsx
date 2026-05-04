import { usePlayer } from '../../context/PlayerContext'
import type { SpotifyTrack } from '../../types/spotify'

interface RecentlyPlayedProps {
  tracks: SpotifyTrack[]
}

export function RecentlyPlayed({ tracks }: RecentlyPlayedProps) {
  const { play } = usePlayer()

  if (tracks.length === 0) return null

  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-4">Recently played</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => play(track.uri)}
            className="flex-shrink-0 flex items-center gap-3 w-56 bg-surface hover:bg-elevated transition-colors rounded-md overflow-hidden pr-4 text-left group"
          >
            {track.album.images?.[0]?.url ? (
              <img
                src={track.album.images[0].url}
                alt={track.album.name}
                className="w-14 h-14 object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 bg-elevated flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{track.name}</p>
              <p className="text-xs text-secondary truncate">
                {track.artists.map((a) => a.name).join(', ')}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
