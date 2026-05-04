import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { SearchInput } from '../search/SearchInput'

interface NavbarProps {
  searchQuery?: string
  onSearchChange?: (value: string) => void
  onOpenGenerator?: () => void
}

export function Navbar({ searchQuery = '', onSearchChange, onOpenGenerator }: NavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.display_name
    ? user.display_name.charAt(0).toUpperCase()
    : '?'

  return (
    <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-8 bg-surface border-b border-border">
      {/* Logo — clicking navigates home */}
      <button
        onClick={() => navigate('/')}
        className="text-xl font-bold text-white tracking-tight hover:text-primary transition-colors flex-shrink-0"
      >
        Tuner
      </button>

      {/* Center — home icon + search bar */}
      <div className="flex-1 max-w-xl mx-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-elevated hover:bg-border transition-colors text-white"
          title="Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </button>
        {onSearchChange && (
          <SearchInput value={searchQuery} onChange={onSearchChange} />
        )}
      </div>

      {/* Right — Claude button + user avatar + logout */}
      <div className="flex items-center gap-3">
        {user && (
          <>
            {onOpenGenerator && (
              <button
                onClick={onOpenGenerator}
                title="Claude Playlist Generator"
                className="flex items-center gap-2 text-xs text-secondary hover:text-white border border-border hover:border-primary/50 px-3 py-1.5 rounded-full hover:bg-elevated transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
                Claude
              </button>
            )}
            <div className="flex items-center gap-2">
              {user.images?.[0]?.url ? (
                <img
                  src={user.images[0].url}
                  alt={user.display_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black text-sm font-semibold">
                  {initials}
                </div>
              )}
              <span className="text-sm text-secondary hidden sm:block">
                {user.display_name}
              </span>
            </div>

            <button
              onClick={logout}
              className="text-xs text-secondary hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-elevated border border-border"
            >
              Log out
            </button>
          </>
        )}
      </div>
    </header>
  )
}
