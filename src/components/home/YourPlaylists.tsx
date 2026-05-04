import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreatePlaylistModal } from '../playlist/CreatePlaylistModal'
import type { SpotifyPlaylist } from '../../types/spotify'

interface YourPlaylistsProps {
  playlists: SpotifyPlaylist[]
}

export function YourPlaylists({ playlists }: YourPlaylistsProps) {
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Your playlists</h2>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 text-xs text-secondary hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New playlist
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {playlists.length === 0 && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex-shrink-0 w-44 bg-surface hover:bg-elevated transition-colors rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <p className="text-xs text-secondary text-center">Create your first playlist</p>
          </button>
        )}
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            onClick={() => navigate(`/playlist/${playlist.id}`)}
            className="flex-shrink-0 w-44 bg-surface hover:bg-elevated transition-colors rounded-lg p-3 cursor-pointer flex flex-col gap-2"
          >
            {playlist.images?.[0]?.url ? (
              <img src={playlist.images[0].url} alt={playlist.name} className="w-full aspect-square rounded object-cover" />
            ) : (
              <div className="w-full aspect-square rounded bg-elevated flex items-center justify-center text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-white truncate">{playlist.name}</p>
              <p className="text-xs text-secondary">{playlist.tracks.total} tracks</p>
            </div>
          </div>
        ))}
      </div>

      <CreatePlaylistModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </section>
  )
}
