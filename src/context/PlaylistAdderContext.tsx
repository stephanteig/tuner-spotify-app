import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { AddToPlaylistModal } from '../components/playlist/AddToPlaylistModal'

interface PlaylistAdderContextValue {
  openAddToPlaylist: (trackUri: string) => void
}

const PlaylistAdderContext = createContext<PlaylistAdderContextValue | null>(null)

export function PlaylistAdderProvider({ children }: { children: ReactNode }) {
  const [trackUri, setTrackUri] = useState<string | null>(null)

  const openAddToPlaylist = useCallback((uri: string) => {
    setTrackUri(uri)
  }, [])

  return (
    <PlaylistAdderContext.Provider value={{ openAddToPlaylist }}>
      {children}
      <AddToPlaylistModal trackUri={trackUri} onClose={() => setTrackUri(null)} />
    </PlaylistAdderContext.Provider>
  )
}

export function useAddToPlaylist(): (trackUri: string) => void {
  const ctx = useContext(PlaylistAdderContext)
  if (!ctx) throw new Error('useAddToPlaylist must be used within PlaylistAdderProvider')
  return ctx.openAddToPlaylist
}
