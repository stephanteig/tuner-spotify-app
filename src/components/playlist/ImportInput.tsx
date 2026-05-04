import { useState } from 'react'

interface ImportInputProps {
  onImport: (raw: string) => void
  error: string | null
}

export function ImportInput({ onImport, error }: ImportInputProps) {
  const [value, setValue] = useState('')

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-secondary">Paste the JSON from Claude Code</label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={'[\n  { "title": "Song Name", "artist": "Artist", "album": "Album", "duration_ms": 200000 },\n  ...\n]'}
        rows={6}
        className="w-full bg-elevated border border-border rounded-lg px-4 py-3 text-sm text-white placeholder-muted font-mono focus:outline-none focus:border-primary transition-colors resize-none"
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      <button
        onClick={() => onImport(value)}
        disabled={!value.trim()}
        className="w-full bg-primary hover:bg-primary-hover text-black font-semibold py-2.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Resolve Tracks
      </button>
    </div>
  )
}
