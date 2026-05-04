import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableTrackRowProps {
  id: string
  index: number
  title: string
  artist: string
  albumImageUrl?: string
  durationMs: number
  isPlaying?: boolean
  editMode?: boolean
  onClick?: () => void
  onDelete?: () => void
  onAddToQueue?: () => void
  onAddToPlaylist?: () => void
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function SortableTrackRow({
  id,
  index,
  title,
  artist,
  albumImageUrl,
  durationMs,
  isPlaying = false,
  editMode = false,
  onClick,
  onDelete,
  onAddToQueue,
  onAddToPlaylist,
}: SortableTrackRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-elevated transition-colors ${isPlaying ? 'text-primary' : 'text-white'}`}
    >
      {/* Drag handle (edit mode) or index */}
      {editMode ? (
        <div
          {...attributes}
          {...listeners}
          className="w-6 flex-shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted hover:text-secondary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
          </svg>
        </div>
      ) : (
        <div className="w-6 text-center text-sm text-secondary flex-shrink-0 cursor-pointer" onClick={onClick}>
          <span className="group-hover:hidden">{index}</span>
          <svg className="hidden group-hover:block mx-auto text-white" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        </div>
      )}

      {/* Album art */}
      <div className="cursor-pointer flex-shrink-0" onClick={editMode ? undefined : onClick}>
        {albumImageUrl ? (
          <img src={albumImageUrl} alt="" className="w-10 h-10 rounded object-cover" />
        ) : (
          <div className="w-10 h-10 rounded bg-elevated" />
        )}
      </div>

      {/* Title + Artist */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={editMode ? undefined : onClick}>
        <p className={`text-sm font-medium truncate ${isPlaying ? 'text-primary' : 'text-white'}`}>{title}</p>
        <p className="text-xs text-secondary truncate">{artist}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {editMode ? (
          <button
            onClick={onDelete}
            className="text-secondary hover:text-red-400 transition-colors p-1 rounded"
            title="Remove from playlist"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        ) : (
          <>
            {onAddToQueue && (
              <button onClick={(e) => { e.stopPropagation(); onAddToQueue() }} className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-white p-1 rounded" title="Add to queue">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="19" y1="9" x2="19" y2="15"/><line x1="16" y1="12" x2="22" y2="12"/>
                </svg>
              </button>
            )}
            {onAddToPlaylist && (
              <button onClick={(e) => { e.stopPropagation(); onAddToPlaylist() }} className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-white p-1 rounded" title="Add to playlist">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  <line x1="6" y1="12" x2="6" y2="6"/><line x1="3" y1="9" x2="9" y2="9"/>
                </svg>
              </button>
            )}
          </>
        )}
        <span className="text-sm text-secondary ml-1">{formatDuration(durationMs)}</span>
      </div>
    </div>
  )
}
