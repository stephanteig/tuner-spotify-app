import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTrackResolver } from '../../hooks/useTrackResolver'
import { createPlaylist, addTracksToPlaylist, fetchUserPlaylists, fetchPlaylistTracks } from '../../api/playlists'
import { Modal } from '../ui/Modal'
import { Spinner } from '../ui/Spinner'
import { TrackPreview } from './TrackPreview'
import { ImportInput } from './ImportInput'
import type { PlaylistTrack } from '../../types/playlist'
import type { SpotifyPlaylist } from '../../types/spotify'

interface GeneratorModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 'input' | 'preview' | 'success'
type TargetMode = 'new' | 'existing'

const SKILL_CONTENT = `Generate a Spotify playlist based on this description: $ARGUMENTS

Output ONLY a raw JSON array with no markdown fences, no explanation, no prose — just the JSON.

Schema: [{ "title": string, "artist": string, "album": string, "duration_ms": number }]

Rules:
- Generate 15–25 tracks unless a count is specified in the description
- Only include real tracks that actually exist on Spotify
- Consider mood, tempo, genre, era, and smooth transitions between tracks
- If the description includes a list of existing tracks (prefixed with "Avoid duplicating these tracks"), do not include any of those tracks in the output
- Output raw JSON only — the first character must be [ and the last must be ]`

function SkillInstaller() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDownload = () => {
    const blob = new Blob([SKILL_CONTENT], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'spotify-playlist-generator.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const shellCmd = `mkdir -p .claude/commands && cat > .claude/commands/spotify-playlist-generator.md << 'EOF'\n${SKILL_CONTENT}\nEOF`

  const handleCopyCmd = async () => {
    await navigator.clipboard.writeText(shellCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-elevated transition-colors"
      >
        <div className="flex items-center gap-2 text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <span>Install Claude skill</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4 flex flex-col gap-3 bg-elevated/40">
          <p className="text-xs text-secondary">
            The <code className="text-primary font-mono">/spotify-playlist-generator</code> skill lets Claude generate track lists directly in Claude Code. Install it once per project.
          </p>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted uppercase tracking-wider font-medium">Option 1 — download</p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 text-sm text-white bg-elevated border border-border hover:border-primary hover:text-primary px-4 py-2 rounded-lg transition-colors w-fit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download spotify-playlist-generator.md
            </button>
            <p className="text-xs text-muted">Move the downloaded file to <code className="text-secondary font-mono">.claude/commands/</code> in your project root, then restart Claude Code.</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted uppercase tracking-wider font-medium">Option 2 — terminal</p>
            <div className="flex items-center gap-2 bg-bg border border-border rounded-lg px-3 py-2">
              <code className="flex-1 text-xs text-secondary font-mono truncate">Run the install command in your project root</code>
              <button onClick={handleCopyCmd} className="flex-shrink-0 text-xs text-secondary hover:text-white transition-colors px-2 py-1 rounded hover:bg-border">
                {copied ? '✓' : 'Copy cmd'}
              </button>
            </div>
            <p className="text-xs text-muted">Paste and run in your terminal from the project root, then restart Claude Code.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function GeneratorModal({ isOpen, onClose }: GeneratorModalProps) {
  const { user } = useAuth()
  const { resolvedTracks, isResolving, resolve, reset } = useTrackResolver()

  const [description, setDescription] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('input')
  const [playlistName, setPlaylistName] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [successName, setSuccessName] = useState('')

  // Target mode — shown in input step
  const [targetMode, setTargetMode] = useState<TargetMode>('new')
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('')
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [existingTracks, setExistingTracks] = useState<{ title: string; artist: string }[]>([])
  const [loadingExisting, setLoadingExisting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLoadingPlaylists(true)
    fetchUserPlaylists()
      .then((p) => { setPlaylists(p); if (p[0]) setSelectedPlaylistId(p[0].id) })
      .catch(console.error)
      .finally(() => setLoadingPlaylists(false))
  }, [isOpen])

  // Fetch existing tracks whenever selected playlist changes in 'existing' mode
  useEffect(() => {
    if (targetMode !== 'existing' || !selectedPlaylistId) { setExistingTracks([]); return }
    setLoadingExisting(true)
    fetchPlaylistTracks(selectedPlaylistId)
      .then((tracks) => setExistingTracks(tracks.map((t) => ({ title: t.name, artist: t.artists[0]?.name ?? '' }))))
      .catch(() => setExistingTracks([]))
      .finally(() => setLoadingExisting(false))
  }, [targetMode, selectedPlaylistId])

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId)

  const generatedPrompt = useCallback(() => {
    if (!description.trim()) return ''
    let prompt = `/spotify-playlist-generator ${description.trim()}`
    if (targetMode === 'existing' && existingTracks.length > 0) {
      const trackList = existingTracks.map((t) => `- "${t.title}" by ${t.artist}`).join('\n')
      prompt += `\n\nThis is for an existing playlist called "${selectedPlaylist?.name ?? 'My Playlist'}". Avoid duplicating these tracks already in it:\n${trackList}`
    }
    return prompt
  }, [description, targetMode, existingTracks, selectedPlaylist])

  const prompt = generatedPrompt()

  const handleCopy = useCallback(async () => {
    if (!prompt) return
    await navigator.clipboard.writeText(prompt)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }, [prompt])

  const handleImport = useCallback(async (raw: string) => {
    setJsonError(null)
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch {
      setJsonError('Invalid format. Expected a JSON array of tracks.')
      return
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      setJsonError('No tracks found in the JSON.')
      return
    }
    const isValid = parsed.every(
      (item) => typeof item === 'object' && item !== null &&
        typeof (item as Record<string, unknown>).title === 'string' &&
        typeof (item as Record<string, unknown>).artist === 'string',
    )
    if (!isValid) { setJsonError('Invalid format. Expected a JSON array of tracks.'); return }

    const seen = new Set<string>()
    const tracks = (parsed as PlaylistTrack[]).filter((t) => {
      const key = `${t.title.toLowerCase()}|${t.artist.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    setPlaylistName(description.trim().slice(0, 40) || 'My Tuner Playlist')
    await resolve(tracks)
    setStep('preview')
  }, [description, resolve])

  const handleCreate = useCallback(async () => {
    if (!user) return
    const uris = resolvedTracks.filter((r) => r.resolved && r.spotifyTrack).map((r) => r.spotifyTrack!.uri)
    if (uris.length === 0) return

    setIsCreating(true)
    setCreateError(null)
    try {
      if (targetMode === 'new') {
        const playlist = await createPlaylist(user.id, playlistName || 'My Tuner Playlist')
        await addTracksToPlaylist(playlist.id, uris)
        setSuccessName(playlist.name)
      } else {
        const target = playlists.find((p) => p.id === selectedPlaylistId)
        await addTracksToPlaylist(selectedPlaylistId, uris)
        setSuccessName(target?.name ?? 'playlist')
      }
      setStep('success')
    } catch (err) {
      console.error('[GeneratorModal]', err)
      setCreateError('Failed to save playlist. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }, [user, resolvedTracks, playlistName, targetMode, selectedPlaylistId, playlists])

  const handleClose = useCallback(() => {
    setDescription('')
    setJsonError(null)
    setStep('input')
    setPlaylistName('')
    setCreateError(null)
    setTargetMode('new')
    setExistingTracks([])
    reset()
    onClose()
  }, [onClose, reset])

  const resolvedCount = resolvedTracks.filter((r) => r.resolved).length
  const actionLabel = targetMode === 'new'
    ? `Create playlist (${resolvedCount} tracks)`
    : `Add to playlist (${resolvedCount} tracks)`

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Claude Playlist Generator">
      {step === 'input' && (
        <div className="flex flex-col gap-5">
          {/* Target mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => setTargetMode('new')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${targetMode === 'new' ? 'bg-primary text-black' : 'text-secondary hover:text-white'}`}
            >
              New playlist
            </button>
            <button
              onClick={() => setTargetMode('existing')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${targetMode === 'existing' ? 'bg-primary text-black' : 'text-secondary hover:text-white'}`}
            >
              Add to existing
            </button>
          </div>

          {/* Existing playlist selector */}
          {targetMode === 'existing' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm text-secondary">Choose playlist</label>
              {loadingPlaylists ? (
                <div className="flex justify-center py-3"><Spinner size={18} /></div>
              ) : (
                <select
                  value={selectedPlaylistId}
                  onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                >
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
              {loadingExisting && (
                <p className="text-xs text-secondary flex items-center gap-1.5">
                  <Spinner size={11} /> Loading existing tracks…
                </p>
              )}
              {!loadingExisting && existingTracks.length > 0 && (
                <p className="text-xs text-secondary">{existingTracks.length} existing tracks will be included in the prompt so Claude avoids duplicates.</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm text-secondary">Describe your playlist</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. rainy day lo-fi study music, 20 songs"
              rows={3}
              className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {prompt && (
            <div className="flex flex-col gap-2">
              <label className="text-sm text-secondary">Copy this prompt and run it in Claude Code</label>
              <div className="flex items-start gap-2 bg-elevated border border-border rounded-lg px-4 py-3">
                <code className="flex-1 text-sm text-primary font-mono whitespace-pre-wrap break-words">{prompt}</code>
                <button onClick={handleCopy} className="flex-shrink-0 text-xs text-secondary hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-border mt-0.5">
                  {isCopied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          <ImportInput onImport={handleImport} error={jsonError} />

          <SkillInstaller />
        </div>
      )}

      {step === 'preview' && (
        <div className="flex flex-col gap-5">
          {isResolving ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Spinner size={28} />
              <p className="text-sm text-secondary">Resolving tracks…</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-secondary">{resolvedCount}/{resolvedTracks.length} tracks matched</p>
                <button onClick={() => { reset(); setStep('input') }} className="text-xs text-secondary hover:text-white transition-colors">← Back</button>
              </div>

              {resolvedCount === 0 && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                  None of the tracks could be matched. Check the JSON format.
                </p>
              )}

              <TrackPreview tracks={resolvedTracks} />

              {targetMode === 'new' && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-secondary">Playlist name</label>
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              )}

              {targetMode === 'existing' && selectedPlaylist && (
                <p className="text-sm text-secondary border-t border-border pt-3">
                  Adding to <span className="text-white font-medium">"{selectedPlaylist.name}"</span>
                </p>
              )}

              {createError && <p className="text-sm text-red-400">{createError}</p>}

              <button
                onClick={handleCreate}
                disabled={resolvedCount === 0 || isCreating || (targetMode === 'existing' && !selectedPlaylistId)}
                className="w-full bg-primary hover:bg-primary-hover text-black font-semibold py-2.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating && <Spinner size={16} />}
                {isCreating ? 'Saving…' : actionLabel}
              </button>
            </>
          )}
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1DB954" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-lg">
              {targetMode === 'new' ? 'Playlist created!' : 'Tracks added!'}
            </p>
            <p className="text-secondary text-sm mt-1">
              {targetMode === 'new'
                ? `"${successName}" has been added to your Spotify library.`
                : `${resolvedCount} tracks added to "${successName}".`}
            </p>
          </div>
          <button onClick={handleClose} className="bg-primary hover:bg-primary-hover text-black font-semibold px-8 py-2.5 rounded-full transition-colors">
            Done
          </button>
        </div>
      )}
    </Modal>
  )
}
