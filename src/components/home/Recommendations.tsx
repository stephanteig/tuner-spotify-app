import { usePlayer } from '../../context/PlayerContext'
import type { SpotifyTrack } from '../../types/spotify'

interface RecommendationsProps {
  tracks: SpotifyTrack[]
}

export function Recommendations({ tracks }: RecommendationsProps) {
  const { play } = usePlayer()

  if (tracks.length === 0) return null

  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-4">Recommended</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => play(track.uri)}
            className="flex-shrink-0 w-44 bg-surface hover:bg-elevated transition-colors rounded-lg p-3 text-left flex flex-col gap-2 group"
          >
            <div className="relative">
              {track.album.images?.[0]?.url ? (
                <img
                  src={track.album.images[0].url}
                  alt={track.album.name}
                  className="w-full aspect-square rounded object-cover"
                />
              ) : (
                <div className="w-full aspect-square rounded bg-elevated" />
              )}
              <div className="absolute bottom-2 right-2 w-9 h-9 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg translate-y-1 group-hover:translate-y-0 duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="black">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
            </div>
            <div>
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
