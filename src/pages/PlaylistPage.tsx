import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import {
  fetchPlaylist, fetchPlaylistTracks,
  addTracksToPlaylist, removeTracksFromPlaylist,
  reorderPlaylistTrack, updatePlaylistDetails, uploadPlaylistCover,
} from '../api/playlists'
import { compressImageToJpegBase64 } from '../utils/imageUtils'
import { searchSpotify } from '../api/search'
import { usePlayer } from '../context/PlayerContext'
import { useAddToPlaylist } from '../context/PlaylistAdderContext'
import { SortableTrackRow } from '../components/ui/SortableTrackRow'
import { Spinner } from '../components/ui/Spinner'
import type { SpotifyPlaylist, SpotifyTrack } from '../types/spotify'

export function PlaylistPage() {
  const { id } = useParams<{ id: string }>()
  const { play, addToQueue, currentTrack, isPlaying } = usePlayer()
  const openAddToPlaylist = useAddToPlaylist()

  const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null)
  const [editCoverBase64, setEditCoverBase64] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Search-to-add
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    Promise.all([fetchPlaylist(id), fetchPlaylistTracks(id)])
      .then(([p, t]) => { setPlaylist(p); setTracks(t) })
      .catch((err) => { console.error(err); setError('Failed to load playlist') })
      .finally(() => setIsLoading(false))
  }, [id])

  // Search debounce
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!searchQuery.trim()) { setSearchResults([]); return }
    setIsSearching(true)
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchSpotify(searchQuery)
        setSearchResults(res.tracks?.items ?? [])
      } catch { setSearchResults([]) }
      finally { setIsSearching(false) }
    }, 400)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [searchQuery])

  const enterEditMode = () => {
    setEditName(playlist?.name ?? '')
    setEditDesc(playlist?.description ?? '')
    setEditCoverPreview(playlist?.images?.[0]?.url ?? null)
    setEditCoverBase64(null)
    setSaveError(null)
    setSearchQuery('')
    setSearchResults([])
    setEditMode(true)
  }

  const cancelEdit = () => {
    setEditMode(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await compressImageToJpegBase64(file)
      setEditCoverPreview(URL.createObjectURL(file))
      setEditCoverBase64(base64)
      setSaveError(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to process image')
    }
  }

  const handleSave = useCallback(async () => {
    if (!id || !playlist) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await updatePlaylistDetails(id, editName || playlist.name, editDesc)
      setPlaylist((p) => p ? { ...p, name: editName || p.name, description: editDesc } : p)
      if (editCoverBase64) {
        await uploadPlaylistCover(id, editCoverBase64)
        setPlaylist((p) => p && editCoverPreview ? { ...p, images: [{ url: editCoverPreview, height: 300, width: 300 }] } : p)
      }
      setEditMode(false)
    } catch (err) {
      console.error('[PlaylistPage] Save failed:', err)
      setSaveError(err instanceof Error ? err.message : 'Save failed. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [id, playlist, editName, editDesc, editCoverBase64])

  const handleDeleteTrack = useCallback(async (trackUri: string, index: number) => {
    if (!id) return
    setTracks((prev) => prev.filter((_, i) => i !== index))
    try {
      await removeTracksFromPlaylist(id, [trackUri])
    } catch (err) {
      console.error('[PlaylistPage] Delete track failed:', err)
      // Refetch on failure
      const refetched = await fetchPlaylistTracks(id)
      setTracks(refetched)
    }
  }, [id])

  const handleAddTrack = useCallback(async (track: SpotifyTrack) => {
    if (!id) return
    if (tracks.some((t) => t.id === track.id)) return
    setTracks((prev) => [...prev, track])
    try {
      await addTracksToPlaylist(id, [track.uri])
    } catch (err) {
      console.error('[PlaylistPage] Add track failed:', err)
      setTracks((prev) => prev.filter((t) => t.id !== track.id))
    }
  }, [id, tracks])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !id) return

    const oldIndex = tracks.findIndex((t) => t.uri === active.id)
    const newIndex = tracks.findIndex((t) => t.uri === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    setTracks((prev) => arrayMove(prev, oldIndex, newIndex))
    try {
      await reorderPlaylistTrack(id, oldIndex, newIndex > oldIndex ? newIndex + 1 : newIndex)
    } catch (err) {
      console.error('[PlaylistPage] Reorder failed:', err)
      const refetched = await fetchPlaylistTracks(id)
      setTracks(refetched)
    }
  }, [id, tracks])

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size={32} /></div>
  if (error || !playlist) return <div className="flex justify-center py-24"><p className="text-secondary text-sm">{error ?? 'Playlist not found'}</p></div>

  const coverImage = editMode ? (editCoverPreview ?? playlist.images?.[0]?.url) : playlist.images?.[0]?.url

  return (
    <div className="flex flex-col gap-8 -mx-8 -mt-6">
      {/* Header */}
      <div className="relative overflow-hidden">
        {coverImage && (
          <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
        <div className="relative flex items-end gap-6 px-8 pt-12 pb-6">
          {/* Cover */}
          <div className="relative flex-shrink-0">
            {coverImage ? (
              <img src={coverImage} alt={playlist.name} className="w-44 h-44 rounded shadow-2xl object-cover" />
            ) : (
              <div className="w-44 h-44 rounded bg-elevated flex items-center justify-center text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
            )}
            {editMode && (
              <>
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute inset-0 rounded bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span className="text-white text-xs font-medium">Change photo</span>
                </button>
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleCoverSelect} />
              </>
            )}
          </div>

          {/* Info / edit fields */}
          <div className="flex flex-col gap-2 pb-2 flex-1 min-w-0">
            <p className="text-xs text-secondary uppercase tracking-widest font-medium">Playlist</p>
            {editMode ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-transparent text-4xl font-bold text-white leading-tight border-b border-border focus:border-primary outline-none w-full"
                  placeholder="Playlist name"
                />
                <input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="bg-transparent text-sm text-secondary border-b border-border focus:border-primary outline-none w-full"
                  placeholder="Add an optional description"
                />
              </>
            ) : (
              <h1 className="text-4xl font-bold text-white leading-tight">{playlist.name}</h1>
            )}
            <p className="text-secondary text-sm mt-1">{tracks.length} tracks</p>

            <div className="flex flex-col gap-2 mt-2">
              {saveError && (
                <p className="text-xs text-red-400">{saveError}</p>
              )}
              {editMode ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-black text-sm font-semibold px-5 py-2 rounded-full transition-colors disabled:opacity-50"
                  >
                    {isSaving && <Spinner size={14} />}
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={cancelEdit} className="text-sm text-secondary hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-elevated">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={enterEditMode}
                  className="flex items-center gap-2 text-sm text-secondary hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-elevated border border-border"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit playlist
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="px-8 flex flex-col gap-6">
        {tracks.length === 0 && !editMode ? (
          <p className="text-secondary text-sm">This playlist is empty.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tracks.map((t) => t.uri)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col">
                {tracks.map((track, i) => (
                  <SortableTrackRow
                    key={`${track.id}-${i}`}
                    id={track.uri}
                    index={i + 1}
                    title={track.name}
                    artist={track.artists.map((a) => a.name).join(', ')}
                    albumImageUrl={track.album.images?.[0]?.url}
                    durationMs={track.duration_ms}
                    isPlaying={currentTrack?.id === track.id && isPlaying}
                    editMode={editMode}
                    onClick={() => play(track.uri, `spotify:playlist:${id}`)}
                    onDelete={() => handleDeleteTrack(track.uri, i)}
                    onAddToQueue={() => addToQueue(track.uri)}
                    onAddToPlaylist={() => openAddToPlaylist(track.uri)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Search to add tracks (edit mode only) */}
        {editMode && (
          <div className="flex flex-col gap-3 pb-8">
            <h3 className="text-sm font-semibold text-white">Add tracks</h3>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for songs to add…"
                className="w-full bg-elevated border border-border rounded-full pl-9 pr-4 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size={14} /></div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="flex flex-col gap-1 bg-elevated rounded-xl overflow-hidden border border-border">
                {searchResults.map((track) => {
                  const alreadyAdded = tracks.some((t) => t.id === track.id)
                  return (
                    <div key={track.id} className="flex items-center gap-3 px-4 py-2 hover:bg-border transition-colors">
                      {track.album.images?.[0]?.url ? (
                        <img src={track.album.images[0].url} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded bg-border flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{track.name}</p>
                        <p className="text-xs text-secondary truncate">{track.artists.map((a) => a.name).join(', ')}</p>
                      </div>
                      <button
                        onClick={() => handleAddTrack(track)}
                        disabled={alreadyAdded}
                        className={`flex-shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${
                          alreadyAdded
                            ? 'border-primary text-primary cursor-default'
                            : 'border-secondary text-secondary hover:border-white hover:text-white'
                        }`}
                      >
                        {alreadyAdded ? 'Added' : 'Add'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
