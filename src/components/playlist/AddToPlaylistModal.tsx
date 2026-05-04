import { useEffect, useState, useCallback } from 'react'
import { fetchUserPlaylists, addTracksToPlaylist } from '../../api/playlists'
import { Modal } from '../ui/Modal'
import { Spinner } from '../ui/Spinner'
import type { SpotifyPlaylist } from '../../types/spotify'

interface AddToPlaylistModalProps {
  trackUri: string | null
  onClose: () => void
}

export function AddToPlaylistModal({ trackUri, onClose }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  useEffect(() => {
    if (!trackUri) return
    setSuccessId(null)
    setIsLoading(true)
    fetchUserPlaylists()
      .then(setPlaylists)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [trackUri])

  const handleAdd = useCallback(async (playlistId: string) => {
    if (!trackUri || addingId) return
    setAddingId(playlistId)
    try {
      await addTracksToPlaylist(playlistId, [trackUri])
      setSuccessId(playlistId)
      setTimeout(() => setSuccessId(null), 2000)
    } catch (err) {
      console.error('[AddToPlaylist]', err)
    } finally {
      setAddingId(null)
    }
  }, [trackUri, addingId])

  return (
    <Modal isOpen={!!trackUri} onClose={onClose} title="Add to playlist">
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner size={24} /></div>
      ) : (
        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto -mx-2">
          {playlists.length === 0 && (
            <p className="text-secondary text-sm text-center py-6">No playlists found</p>
          )}
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => handleAdd(playlist.id)}
              disabled={!!addingId}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-elevated transition-colors text-left w-full disabled:opacity-60"
            >
              {playlist.images?.[0]?.url ? (
                <img src={playlist.images[0].url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded bg-elevated flex items-center justify-center text-secondary flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{playlist.name}</p>
                <p className="text-xs text-secondary">{playlist.tracks.total} tracks</p>
              </div>
              <div className="flex-shrink-0 w-6 flex items-center justify-center">
                {addingId === playlist.id ? (
                  <Spinner size={14} />
                ) : successId === playlist.id ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1DB954" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg className="text-secondary group-hover:text-white" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
