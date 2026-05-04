interface TrackRowProps {
  index: number
  title: string
  artist: string
  albumImageUrl?: string
  durationMs: number
  isPlaying?: boolean
  onClick?: () => void
  onAddToQueue?: () => void
  onAddToPlaylist?: () => void
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function TrackRow({
  index,
  title,
  artist,
  albumImageUrl,
  durationMs,
  isPlaying = false,
  onClick,
  onAddToQueue,
  onAddToPlaylist,
}: TrackRowProps) {
  return (
    <div
      className={`group flex items-center gap-4 px-4 py-2 rounded-lg hover:bg-elevated transition-colors cursor-pointer ${isPlaying ? 'text-primary' : 'text-white'}`}
      onClick={onClick}
    >
      {/* Index / play icon on hover */}
      <div className="w-6 text-center text-sm text-secondary flex-shrink-0">
        <span className="group-hover:hidden">{index}</span>
        <svg className="hidden group-hover:block mx-auto text-white" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
      </div>

      {/* Album art */}
      {albumImageUrl ? (
        <img src={albumImageUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded bg-elevated flex-shrink-0" />
      )}

      {/* Title + Artist */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isPlaying ? 'text-primary' : 'text-white'}`}>{title}</p>
        <p className="text-xs text-secondary truncate">{artist}</p>
      </div>

      {/* Duration + hover actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {onAddToQueue && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToQueue() }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-white p-1 rounded"
            title="Add to queue"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              <line x1="19" y1="9" x2="19" y2="15"/><line x1="16" y1="12" x2="22" y2="12"/>
            </svg>
          </button>
        )}
        {onAddToPlaylist && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToPlaylist() }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-white p-1 rounded"
            title="Add to playlist"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              <line x1="6" y1="12" x2="6" y2="6"/><line x1="3" y1="9" x2="9" y2="9"/>
            </svg>
          </button>
        )}
        <span className="text-sm text-secondary ml-1">{formatDuration(durationMs)}</span>
      </div>
    </div>
  )
}
