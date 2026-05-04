import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createPlaylist } from '../../api/playlists'
import { Modal } from '../ui/Modal'
import { Spinner } from '../ui/Spinner'

interface CreatePlaylistModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreatePlaylistModal({ isOpen, onClose }: CreatePlaylistModalProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = useCallback(async () => {
    if (!user || !name.trim()) return
    setIsCreating(true)
    setError(null)
    try {
      const playlist = await createPlaylist(user.id, name.trim(), description.trim())
      setName('')
      setDescription('')
      onClose()
      navigate(`/playlist/${playlist.id}`)
    } catch (err) {
      console.error('[CreatePlaylist]', err)
      setError('Failed to create playlist. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }, [user, name, description, onClose, navigate])

  const handleClose = () => {
    setName('')
    setDescription('')
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create playlist">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-secondary">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="My playlist"
            autoFocus
            className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-secondary">Description <span className="text-muted">(optional)</span></label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add an optional description"
            className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || isCreating}
          className="w-full bg-primary hover:bg-primary-hover text-black font-semibold py-2.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isCreating && <Spinner size={16} />}
          {isCreating ? 'Creating…' : 'Create'}
        </button>
      </div>
    </Modal>
  )
}
