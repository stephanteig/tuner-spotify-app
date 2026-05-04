import { useEffect, useState, useCallback } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getQueue } from '../../api/player'
import { usePlayer } from '../../context/PlayerContext'
import { useAddToPlaylist } from '../../context/PlaylistAdderContext'
import { Spinner } from '../ui/Spinner'
import type { SpotifyTrack } from '../../types/spotify'

interface QueuePanelProps {
  isOpen: boolean
  onClose: () => void
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function SortableQueueItem({
  track,
  onPlay,
  onAddToQueue,
  onAddToPlaylist,
}: {
  track: SpotifyTrack
  onPlay: () => void
  onAddToQueue: () => void
  onAddToPlaylist: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-2 px-3 py-2 hover:bg-elevated transition-colors group"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 text-muted hover:text-secondary cursor-grab active:cursor-grabbing p-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
        </svg>
      </div>

      <button onClick={onPlay} className="flex items-center gap-2 flex-1 min-w-0 text-left">
        {track.album?.images?.[0]?.url ? (
          <img src={track.album.images[0].url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded bg-elevated flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{track.name}</p>
          <p className="text-xs text-secondary truncate">{track.artists?.map((a) => a.name).join(', ')}</p>
        </div>
      </button>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onAddToQueue} className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-white p-1 rounded" title="Add to queue">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="19" y1="9" x2="19" y2="15"/><line x1="16" y1="12" x2="22" y2="12"/>
          </svg>
        </button>
        <button onClick={onAddToPlaylist} className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-white p-1 rounded" title="Add to playlist">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            <line x1="6" y1="12" x2="6" y2="6"/><line x1="3" y1="9" x2="9" y2="9"/>
          </svg>
        </button>
        <span className="text-xs text-muted w-8 text-right">{formatTime(track.duration_ms)}</span>
      </div>
    </div>
  )
}

export function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const { play, addToQueue, currentTrack } = usePlayer()
  const openAddToPlaylist = useAddToPlaylist()
  const [queue, setQueue] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isReordered, setIsReordered] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    if (!isOpen) return
    setIsReordered(false)
    setIsLoading(true)
    getQueue()
      .then((data) => setQueue(data.queue))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [isOpen, currentTrack?.id])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = queue.findIndex((t) => t.id === active.id)
    const newIndex = queue.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    setQueue((prev) => arrayMove(prev, oldIndex, newIndex))
    setIsReordered(true)
  }, [queue])

  const applyOrder = useCallback(async () => {
    if (queue.length === 0) return
    setIsApplying(true)
    try {
      await play(queue[0].uri)
      for (let i = 1; i < queue.length; i++) {
        await addToQueue(queue[i].uri)
      }
      setIsReordered(false)
    } catch (err) {
      console.error('[QueuePanel] Apply order failed:', err)
    } finally {
      setIsApplying(false)
    }
  }, [queue, play, addToQueue])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="fixed bottom-20 right-4 z-40 w-80 bg-surface border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[60vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Queue</h3>
          <div className="flex items-center gap-2">
            {isReordered && (
              <button
                onClick={applyOrder}
                disabled={isApplying}
                className="flex items-center gap-1 text-xs bg-primary hover:bg-primary-hover text-black font-semibold px-3 py-1 rounded-full transition-colors disabled:opacity-50"
              >
                {isApplying && <Spinner size={10} />}
                Apply order
              </button>
            )}
            <button onClick={onClose} className="text-secondary hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner size={20} /></div>
          ) : queue.length === 0 ? (
            <p className="text-secondary text-sm text-center py-8">Queue is empty</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={queue.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col py-1">
                  {queue.map((track) => (
                    <SortableQueueItem
                      key={track.id}
                      track={track}
                      onPlay={() => play(track.uri)}
                      onAddToQueue={() => addToQueue(track.uri)}
                      onAddToPlaylist={() => openAddToPlaylist(track.uri)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </>
  )
}
