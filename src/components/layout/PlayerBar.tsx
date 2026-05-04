import { useRef, useCallback, useState } from 'react'
import { usePlayer } from '../../context/PlayerContext'
import { useAddToPlaylist } from '../../context/PlaylistAdderContext'
import { QueuePanel } from '../player/QueuePanel'

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function PlayerBar() {
  const {
    currentTrack, isPlaying, position, volume, premiumRequired,
    shuffle, repeatMode,
    pause, resume, next, prev, seek, setVolume,
    toggleShuffle, cycleRepeat,
  } = usePlayer()

  const openAddToPlaylist = useAddToPlaylist()
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [queueOpen, setQueueOpen] = useState(false)

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !currentTrack) return
    const rect = progressBarRef.current.getBoundingClientRect()
    seek(Math.floor(((e.clientX - rect.left) / rect.width) * currentTrack.durationMs))
  }, [currentTrack, seek])

  const progress = currentTrack && currentTrack.durationMs > 0
    ? (position / currentTrack.durationMs) * 100 : 0

  const repeatIcon = repeatMode === 'track' ? (
    // repeat-1
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      <text x="11" y="13" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">1</text>
    </svg>
  ) : (
    // repeat
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  )

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 h-20 bg-surface border-t border-border flex items-center px-6 gap-4">
        {premiumRequired ? (
          <div className="flex-1 text-center text-sm text-secondary">
            Spotify Premium is required for playback.
          </div>
        ) : !currentTrack ? (
          <div className="flex-1 text-center text-sm text-muted">No track playing</div>
        ) : (
          <>
            {/* Track info */}
            <div className="flex items-center gap-3 w-56 min-w-0 flex-shrink-0">
              {currentTrack.albumImageUrl ? (
                <img src={currentTrack.albumImageUrl} alt={currentTrack.albumName} className="w-12 h-12 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded bg-elevated flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentTrack.name}</p>
                <p className="text-xs text-secondary truncate">{currentTrack.artistName}</p>
              </div>
              <button
                onClick={() => openAddToPlaylist(currentTrack.uri)}
                className="flex-shrink-0 text-secondary hover:text-primary transition-colors p-1"
                title="Add to playlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  <line x1="6" y1="12" x2="6" y2="6"/><line x1="3" y1="9" x2="9" y2="9"/>
                </svg>
              </button>
            </div>

            {/* Controls + progress */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-center gap-4">
                {/* Shuffle */}
                <button
                  onClick={toggleShuffle}
                  className={`transition-colors relative ${shuffle ? 'text-primary' : 'text-secondary hover:text-white'}`}
                  aria-label="Shuffle"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                    <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                    <line x1="4" y1="4" x2="9" y2="9"/>
                  </svg>
                  {shuffle && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
                </button>

                {/* Prev */}
                <button onClick={prev} className="text-secondary hover:text-white transition-colors" aria-label="Previous">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* Play/Pause */}
                <button
                  onClick={isPlaying ? pause : resume}
                  className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21"/>
                    </svg>
                  )}
                </button>

                {/* Next */}
                <button onClick={next} className="text-secondary hover:text-white transition-colors" aria-label="Next">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* Repeat */}
                <button
                  onClick={cycleRepeat}
                  className={`transition-colors relative ${repeatMode !== 'off' ? 'text-primary' : 'text-secondary hover:text-white'}`}
                  aria-label="Repeat"
                >
                  {repeatIcon}
                  {repeatMode !== 'off' && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
                </button>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2 w-full max-w-lg">
                <span className="text-xs text-muted w-8 text-right flex-shrink-0">{formatTime(position)}</span>
                <div
                  ref={progressBarRef}
                  className="flex-1 h-1 bg-border rounded-full cursor-pointer group"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-secondary group-hover:bg-primary rounded-full transition-colors relative"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="text-xs text-muted w-8 flex-shrink-0">{formatTime(currentTrack.durationMs)}</span>
              </div>
            </div>

            {/* Right side — queue + volume */}
            <div className="flex items-center gap-3 w-44 flex-shrink-0 justify-end">
              {/* Queue button */}
              <button
                onClick={() => setQueueOpen((o) => !o)}
                className={`transition-colors ${queueOpen ? 'text-primary' : 'text-secondary hover:text-white'}`}
                aria-label="Queue"
                title="Queue"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/>
                </svg>
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <svg className="text-secondary flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/>
                  {volume > 0 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>}
                  {volume > 0.5 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}
                </svg>
                <input
                  type="range" min="0" max="1" step="0.01" value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 accent-primary"
                  aria-label="Volume"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <QueuePanel isOpen={queueOpen} onClose={() => setQueueOpen(false)} />
    </>
  )
}
