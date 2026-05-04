import type { ResolvedTrack } from '../../hooks/useTrackResolver'

interface TrackPreviewProps {
  tracks: ResolvedTrack[]
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function TrackPreview({ tracks }: TrackPreviewProps) {
  return (
    <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
      {tracks.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-elevated"
        >
          {item.resolved && item.spotifyTrack ? (
            <img
              src={item.spotifyTrack.album.images?.[0]?.url}
              alt=""
              className="w-9 h-9 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded bg-border flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">
              {item.resolved && item.spotifyTrack
                ? item.spotifyTrack.name
                : item.input.title}
            </p>
            <p className="text-xs text-secondary truncate">
              {item.resolved && item.spotifyTrack
                ? item.spotifyTrack.artists.map((a) => a.name).join(', ')
                : item.input.artist}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {item.resolved ? (
              <>
                <span className="text-xs text-secondary">
                  {formatDuration(item.spotifyTrack!.duration_ms)}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1DB954" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </>
            ) : (
              <span className="text-xs text-red-400">Not found</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
