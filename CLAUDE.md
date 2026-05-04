# CLAUDE.md — Tuner App

A desktop-first, browser-based Spotify frontend with a Claude-powered playlist generator. Built with React + TypeScript + Vite + Tailwind CSS. This document is the single source of truth for architecture, design, conventions, and verification.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Design System](#design-system)
3. [Naming Conventions](#naming-conventions)
4. [Feature Specifications](#feature-specifications)
5. [Edge Cases](#edge-cases)
6. [Self-Verification Plan](#self-verification-plan)
7. [Git Checkpoints](#git-checkpoints)
8. [Development Workflow](#development-workflow)

---

## Architecture

### Reference Implementation

https://github.com/stephanteig/spotify-clone — existing working Spotify API integration. Use as reference for API call patterns and auth logic, but do not copy the UI.

### Folder Structure

```
tuner/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/                    # Spotify API call functions (one file per domain)
│   │   ├── auth.ts             # Token exchange, refresh, logout
│   │   ├── search.ts           # /search endpoint
│   │   ├── artists.ts          # /artists endpoints
│   │   ├── player.ts           # /me/player endpoints + Web Playback SDK init
│   │   ├── playlists.ts        # /me/playlists, /playlists, create/add tracks
│   │   └── recommendations.ts  # /recommendations, /me/player/recently-played
│   ├── components/             # Reusable UI components (not page-specific)
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx   # Root layout: nav + main content + player bar
│   │   │   ├── Navbar.tsx      # Top nav: logo, search bar, user avatar
│   │   │   └── PlayerBar.tsx   # Persistent bottom player
│   │   ├── search/
│   │   │   ├── SearchInput.tsx
│   │   │   └── SearchResults.tsx
│   │   ├── artist/
│   │   │   ├── ArtistHeader.tsx
│   │   │   └── TrackList.tsx
│   │   ├── home/
│   │   │   ├── RecentlyPlayed.tsx
│   │   │   ├── YourPlaylists.tsx
│   │   │   └── Recommendations.tsx
│   │   ├── playlist/
│   │   │   ├── GeneratorModal.tsx   # Claude playlist generator modal
│   │   │   ├── TrackPreview.tsx     # Preview resolved tracks before creating
│   │   │   └── ImportInput.tsx      # JSON paste input
│   │   └── ui/                 # Primitive components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Spinner.tsx
│   │       └── TrackRow.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # Auth state, login/logout, token access
│   │   ├── usePlayer.ts        # Playback state, controls, SDK device
│   │   ├── useSearch.ts        # Debounced search query + results
│   │   ├── usePlaylists.ts     # User playlists fetch + create
│   │   └── useTrackResolver.ts # JSON → Spotify URI resolution logic
│   ├── context/
│   │   ├── AuthContext.tsx     # Provides auth token + user profile app-wide
│   │   └── PlayerContext.tsx   # Provides player state + controls app-wide
│   ├── pages/
│   │   ├── LoginPage.tsx       # Unauthenticated landing page
│   │   ├── CallbackPage.tsx    # OAuth callback handler
│   │   ├── HomePage.tsx        # Logged-in home (search + sections)
│   │   └── ArtistPage.tsx      # Artist detail page
│   ├── types/
│   │   ├── spotify.ts          # Spotify API response types
│   │   └── playlist.ts         # Claude playlist JSON schema types
│   ├── utils/
│   │   ├── spotifyClient.ts    # Axios/fetch wrapper with auth headers + refresh
│   │   ├── tokenStorage.ts     # localStorage helpers for tokens
│   │   └── pkce.ts             # PKCE code verifier/challenge generation
│   ├── App.tsx                 # Route definitions
│   └── main.tsx                # Vite entry point, context providers
├── api/                        # Vercel serverless functions
│   └── callback.ts             # OAuth token exchange (server-side, hides client secret)
├── .env.local                  # Local secrets (gitignored)
├── .env.example                # Template for required env vars
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

### State Management

**React Context** (no external library). The app has two global state domains:

- `AuthContext` — access token, refresh token, user profile, loading state, login/logout functions
- `PlayerContext` — current track, playback state (playing/paused), position, volume, SDK device ID, player controls

Everything else (search results, artist data, playlists) is local state inside hooks, fetched on demand. This avoids unnecessary global state for data that is always scoped to a single page or interaction.

### Auth Token Flow

```
1. User clicks Login → redirect to Spotify with PKCE challenge
2. Spotify redirects to /callback?code=XXX
3. CallbackPage sends code + verifier to Vercel serverless /api/callback
4. Vercel function exchanges code for { access_token, refresh_token, expires_in }
5. Tokens stored in localStorage via tokenStorage.ts
6. spotifyClient.ts reads token on every request
7. On 401 response: spotifyClient automatically calls /api/refresh, updates storage, retries
8. Logout: clears localStorage, redirects to LoginPage
```

### Spotify Web Playback SDK

Initialized once in `PlayerContext` after auth is confirmed. The SDK `player` instance is created with `window.onSpotifyWebPlaybackSDKReady`. The SDK device ID is captured from the `ready` event and stored in context. All playback calls (play, pause, next, prev, seek, volume) use the REST API (`/me/player/*`) with the device ID, not the SDK directly — the SDK only handles the audio stream.

---

## Design System

### Color Palette

```
Background:       #0a0a0a  (near-black, main bg)
Surface:          #141414  (cards, modals, player bar)
Surface elevated: #1e1e1e  (hover states, dropdowns)
Border:           #2a2a2a  (subtle dividers)
Primary:          #1DB954  (Spotify green — CTAs, active states, progress)
Primary hover:    #1ed760
Text primary:     #ffffff
Text secondary:   #a3a3a3
Text muted:       #525252
Destructive:      #ef4444
```

In Tailwind config, map these as custom colors:

```ts
// tailwind.config.ts
colors: {
  bg: '#0a0a0a',
  surface: '#141414',
  elevated: '#1e1e1e',
  border: '#2a2a2a',
  primary: '#1DB954',
  'primary-hover': '#1ed760',
  secondary: '#a3a3a3',
  muted: '#525252',
}
```

### Typography

- Font family: `Inter` (Google Fonts), fallback `system-ui, sans-serif`
- Load via `index.html` `<link>` tag, not CSS import
- Scale (use Tailwind defaults):
  - Page titles: `text-2xl font-bold`
  - Section headers: `text-lg font-semibold`
  - Body: `text-sm` (14px)
  - Captions/metadata: `text-xs text-secondary`

### Spacing

Use Tailwind's default 4px-base scale. Key layout values:
- Player bar height: `h-20` (80px), fixed to bottom
- Navbar height: `h-14` (56px), sticky to top
- Page content padding: `px-8 py-6`
- Card padding: `p-4`
- Section gap: `gap-4` between cards, `gap-8` between sections

### Component Patterns

**Card** (`Card.tsx`) — used for albums, playlists, artists:
```tsx
<div className="bg-surface rounded-lg p-4 hover:bg-elevated transition-colors cursor-pointer">
```

**Button variants:**
```tsx
// Primary (green)
className="bg-primary hover:bg-primary-hover text-black font-semibold px-6 py-2 rounded-full transition-colors"
// Ghost
className="text-secondary hover:text-white transition-colors"
// Icon button
className="text-secondary hover:text-white p-2 rounded-full hover:bg-elevated transition-colors"
```

**TrackRow** — used in artist page top tracks and playlist preview:
```
[index] [album art 40x40] [title + artist]  [duration]  [play icon on hover]
```

### Layout

```
┌─────────────────────────────────────┐
│ Navbar (sticky, h-14)               │
├─────────────────────────────────────┤
│                                     │
│ Main content (overflow-y-scroll)    │
│ pb-20 (clears player bar)           │
│                                     │
├─────────────────────────────────────┤
│ PlayerBar (fixed bottom, h-20)      │
└─────────────────────────────────────┘
```

Main content area uses `min-h-screen bg-bg text-white`.

---

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Component files | PascalCase | `ArtistHeader.tsx` |
| Hook files | camelCase with `use` prefix | `usePlayer.ts` |
| Utility files | camelCase | `spotifyClient.ts` |
| API files | camelCase, domain noun | `artists.ts` |
| Type files | camelCase | `spotify.ts` |
| Page files | PascalCase + `Page` suffix | `ArtistPage.tsx` |
| Context files | PascalCase + `Context` suffix | `PlayerContext.tsx` |
| Interfaces | PascalCase | `SpotifyTrack`, `PlaylistItem` |
| API functions | verb + noun | `fetchArtistTopTracks`, `createPlaylist` |
| Hook return values | descriptive nouns/booleans | `{ tracks, isLoading, error }` |
| Event handlers | `handle` prefix | `handlePlayPause`, `handleSearch` |
| Env vars | `VITE_` prefix for client | `VITE_SPOTIFY_CLIENT_ID` |
| Serverless env vars | no prefix | `SPOTIFY_CLIENT_SECRET` |

---

## Feature Specifications

### Auth (OAuth 2.0 Authorization Code + PKCE)

**Required scopes:**
```
streaming user-read-email user-read-private user-read-playback-state
user-modify-playback-state user-read-recently-played
playlist-read-private playlist-modify-public playlist-modify-private
```

**Login flow:**
1. `pkce.ts` generates `code_verifier` (random 64-char string) and `code_challenge` (SHA-256 base64url of verifier)
2. Store `code_verifier` in `sessionStorage`
3. Redirect to `https://accounts.spotify.com/authorize` with params: `client_id`, `response_type=code`, `redirect_uri`, `scope`, `code_challenge`, `code_challenge_method=S256`
4. Spotify redirects to `/callback?code=XXX`
5. `CallbackPage` posts `{ code, code_verifier }` to `/api/callback` (Vercel function)
6. Vercel function POSTs to `https://accounts.spotify.com/api/token` with `grant_type=authorization_code`
7. Returns `{ access_token, refresh_token, expires_in }` to client
8. Store in `localStorage`: keys `tuner_access_token`, `tuner_refresh_token`, `tuner_token_expiry` (unix ms)

**Token refresh:**
- `spotifyClient.ts` checks expiry before every request
- If within 60 seconds of expiry (or already expired), call `/api/refresh` first
- `/api/refresh` Vercel function POSTs to Spotify with `grant_type=refresh_token`

**Env vars:**
```
# .env.local (client)
VITE_SPOTIFY_CLIENT_ID=xxx
VITE_REDIRECT_URI=http://localhost:5173/callback

# Vercel (server-only, never exposed to client)
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
VITE_REDIRECT_URI=https://tuner.vercel.app/callback
```

---

### Search (Home Screen)

**Endpoint:** `GET https://api.spotify.com/v1/search?q={query}&type=artist,album,track&limit=10&market=from_token`

**UI layout (home screen, logged in):**
```
[Navbar with search bar centered]
──────────────────────────────────
[If no search query:]
  Recently Played  (horizontal scroll row)
  Your Playlists   (horizontal scroll row)
  Recommendations  (horizontal scroll row)

[If search query active:]
  Artists          (horizontal scroll row of ArtistCards)
  Top Tracks       (vertical TrackList)
  Albums           (horizontal scroll row of AlbumCards)
```

**Search behavior:**
- Debounce input by 400ms before firing API call
- Show `Spinner` during fetch
- Clear results when input is cleared
- Search bar in Navbar becomes sticky on scroll (always visible)

---

### Artist Page

**Route:** `/artist/:id`

**Endpoints:**
- `GET /artists/{id}` — name, images, followers, genres
- `GET /artists/{id}/top-tracks?market=from_token` — up to 10 tracks

**UI:**
```
[Large blurred background using artist image]
[Artist image 200x200, rounded] [Name text-4xl bold] [Followers count]
──────────────────────────────────
Popular tracks
[TrackList — 10 rows, numbered, with album art, title, duration]
```

Clicking a track calls `PUT /me/player/play` with `{ uris: [track.uri], device_id }`.

---

### Playback (Player Bar)

**SDK initialization:** In `PlayerContext`, after access token confirmed, inject Spotify SDK script tag, wait for `window.onSpotifyWebPlaybackSDKReady`, instantiate `Spotify.Player`, listen for `ready`, `not_ready`, `player_state_changed`.

**Player bar layout:**
```
┌────────────────────────────────────────────────────────┐
│ [Album art 48x48]  [Track title]     [◀◀] [▶/⏸] [▶▶]  [🔊──────] │
│ [Artist name]      ────────────────── progress bar ──── │
│                    [0:00]                       [3:45]   │
└────────────────────────────────────────────────────────┘
```

**Controls:**
- Play/Pause: `player.togglePlay()` (SDK method, or `PUT /me/player/play` + `PUT /me/player/pause`)
- Previous/Next: `player.previousTrack()` / `player.nextTrack()`
- Seek: `player.seek(positionMs)` on progress bar click/drag
- Volume: `player.setVolume(0–1)` on slider change
- Progress bar: updated every 500ms via `setInterval` using `player.getCurrentState()`

---

### Home Screen Sections

**Recently Played:**
- `GET /me/player/recently-played?limit=10`
- Show as horizontal scroll row of `TrackRow` items (album art + title + artist)
- Click plays the track

**Your Playlists:**
- `GET /me/playlists?limit=20`
- Show as horizontal scroll row of `Card` items (playlist cover + name)
- Click navigates to playlist detail (Phase 5, out of initial scope — show placeholder)

**Recommendations:**
- `GET /recommendations?seed_tracks={3 recent track IDs}&limit=10`
- Use the first 3 tracks from recently played as seeds
- Show as horizontal scroll row of `TrackRow` items

---

### Claude Playlist Generator

**Flow:**
1. User clicks Claude icon button in Navbar
2. `GeneratorModal` opens
3. User types a playlist description (e.g. "rainy day lo-fi study music, 20 songs")
4. App generates and displays a copyable prompt:
   ```
   /spotify-playlist-generator: rainy day lo-fi study music, 20 songs
   ```
5. User copies prompt, runs it in Claude Code, gets back JSON
6. User pastes JSON into `ImportInput` field in the modal
7. App validates JSON schema
8. `useTrackResolver` runs: for each track, calls `GET /search?q={title}+{artist}&type=track&limit=5`
9. Match algorithm: exact title + artist match first, then fuzzy, use `duration_ms` within 5s as tiebreaker
10. Show `TrackPreview` — list of resolved tracks with green checkmark or red "Not found"
11. User confirms → app calls `POST /users/{user_id}/playlists` then `POST /playlists/{id}/tracks`
12. Success: show playlist name + link, close modal

**Claude Playlist JSON Schema:**
```ts
interface PlaylistTrack {
  title: string;
  artist: string;
  album: string;
  duration_ms: number;
}
type PlaylistJSON = PlaylistTrack[];
```

**Track resolution algorithm** (`useTrackResolver.ts`):
```
For each track in JSON:
  1. Query: GET /search?q=track:{title} artist:{artist}&type=track&limit=5
  2. Score each result:
     - title exact match (case-insensitive): +3 points
     - artist exact match: +3 points
     - album exact match: +1 point
     - duration within 5000ms: +2 points
  3. Pick highest score ≥ 4; else mark as "unresolved"
  4. Collect { track_uri, resolved: boolean } for each
```

---

### Claude Code Skill (`spotify-playlist-generator`)

Skill file location: `.claude/commands/spotify-playlist-generator.md`

The skill receives a user description and responds with a JSON array matching the `PlaylistTrack` schema above. It should:
- Generate 15–25 tracks by default unless count specified
- Consider mood, tempo, genre, era, and transitions between tracks
- Never fabricate track metadata — only include real tracks it knows exist
- Output raw JSON only (no prose, no markdown fences) so it can be pasted directly

---

## Edge Cases

### Auth
- **Expired access token mid-session:** `spotifyClient` catches 401, triggers refresh, retries once. If refresh also fails (e.g. revoked), clear tokens and redirect to `LoginPage`.
- **User denies Spotify permission:** Callback URL will have `?error=access_denied`. Detect and show error on `LoginPage`.
- **Popup blockers / redirect issues:** Always use full redirect, never popup.
- **Multiple tabs:** `localStorage` token is shared. Token refresh in one tab updates storage; other tabs pick it up on next request.

### Playback
- **Spotify Premium required:** Web Playback SDK only works with Premium. On SDK init error `"Authentication error"` or `"Premium required"`, show a banner: *"Tuner requires a Spotify Premium account for playback."*
- **No active device:** If `device_id` is not yet ready (SDK still loading), queue the play action and execute once device is ready.
- **SDK disconnects:** Listen for `not_ready` event, attempt `player.connect()` once, then show error state in player bar.
- **Track not available in user's market:** Spotify returns `restriction` on track object. Skip and play next if encountered.

### Search
- **Empty results:** Show "No results for '{query}'" message in each section.
- **Rate limiting (429):** Retry after `Retry-After` header value (seconds). Show spinner, don't show error to user unless it persists >5s.
- **Network offline:** Show "Check your connection" banner.

### Track Resolution (Playlist Generator)
- **Invalid JSON paste:** Validate with `JSON.parse` inside try/catch + schema check. Show inline error: *"Invalid format. Expected a JSON array of tracks."*
- **Empty JSON array:** Show error: *"No tracks found in the JSON."*
- **All tracks unresolved:** Show warning before allowing create: *"None of the tracks could be matched. Check the JSON format."*
- **Partial resolution:** Allow creating playlist with resolved tracks. Show count: *"17/20 tracks matched."*
- **Duplicate tracks in JSON:** Deduplicate by `title + artist` before resolving.
- **Playlist creation failure:** Show error message, preserve the resolved track list so user can retry.

### Home Screen
- **No recently played history:** Hide the "Recently Played" section entirely, don't show empty state.
- **No playlists:** Show "Create your first playlist" placeholder card.
- **Recommendations with no seed tracks:** Fall back to genre seeds `["pop", "indie"]` if no recently played tracks exist.

---

## Self-Verification Plan

### Automated Checks (run before every checkpoint commit)

```bash
npx tsc --noEmit          # Zero TypeScript errors required
npx vite build            # Clean production build required
npx eslint src --ext .ts,.tsx  # Zero errors required
```

### Checkpoint 1 — Foundation

**Verify auth flow:**
1. Run `npm run dev`, navigate to `http://localhost:5173`
2. Should see `LoginPage` with Spotify login button
3. Click login → browser redirects to `accounts.spotify.com`
4. Log in with Spotify → redirected back to `/callback`
5. Should briefly see "Logging in..." then redirect to `/`
6. Open DevTools → Application → localStorage: confirm `tuner_access_token` exists
7. Open Network tab: confirm `GET /me` returns user profile (200 status)
8. Logout button clears localStorage and returns to `LoginPage`

**Expected console output after login:** No errors. `[Auth] Token expires at {date}` log.

---

### Checkpoint 2 — Search + Artist Page

**Verify search:**
1. On home screen, type "Radiohead" in search bar
2. After 400ms debounce: Artists row shows Radiohead card, Top Tracks shows tracks, Albums row shows albums
3. Clear search bar → results disappear, sections return to Recently Played / Playlists / Recommendations
4. Type single character "a" → results appear (no crash)
5. Rapid typing (10 chars in <400ms) → only one API call fires (confirm in Network tab)

**Verify artist page:**
1. Click Radiohead artist card → navigate to `/artist/{id}`
2. Artist image, name "Radiohead", follower count all visible
3. Top tracks list shows ≥5 tracks with album art and durations
4. No console errors

---

### Checkpoint 3 — Playback

**Verify player bar:**
1. On artist page, click a track
2. Player bar appears at bottom: album art, track name, artist name visible
3. Progress bar starts moving, current time increments
4. Click pause → playback stops, button changes to play icon
5. Click play → playback resumes
6. Click next track → new track loads, player bar updates
7. Drag volume slider to 0 → audio mutes (confirm in SDK, not just UI)
8. Click progress bar at 50% → track seeks to midpoint (confirm via `getCurrentState()`)

**Screenshot checkpoints:**
- Player bar with track loaded: album art visible, title + artist readable, progress bar at ~0:05
- Player bar paused: play icon shown (not pause icon)

---

### Checkpoint 4 — Home Screen

**Verify sections:**
1. Navigate to `/` (home, logged in)
2. "Recently Played" section shows ≥1 track (if account has history)
3. "Your Playlists" section shows ≥1 playlist card
4. "Recommendations" section shows ≥5 tracks
5. Click a recently played track → plays in player bar

**Verify scroll:**
1. Scroll down — Navbar stays pinned to top
2. Player bar stays pinned to bottom
3. Content scrolls between them

---

### Checkpoint 5 — Claude Playlist Generator

**Verify full flow:**
1. Click Claude icon in Navbar → modal opens
2. Type "upbeat 90s alternative rock, 10 songs"
3. Generated prompt appears: `/spotify-playlist-generator: upbeat 90s alternative rock, 10 songs`
4. Click copy button → clipboard contains the prompt (verify by pasting)
5. Paste valid 10-track JSON into import field (use test fixture below)
6. Click "Resolve Tracks"
7. Spinner shows, then track list appears with green checkmarks
8. Click "Create Playlist"
9. Success message appears with playlist name
10. Open Spotify app → playlist appears in library

**Test fixture JSON** (paste this to verify resolution without running the full Claude skill):
```json
[
  { "title": "Creep", "artist": "Radiohead", "album": "Pablo Honey", "duration_ms": 238640 },
  { "title": "Smells Like Teen Spirit", "artist": "Nirvana", "album": "Nevermind", "duration_ms": 301920 },
  { "title": "Black Hole Sun", "artist": "Soundgarden", "album": "Superunknown", "duration_ms": 325000 },
  { "title": "Today", "artist": "The Smashing Pumpkins", "album": "Siamese Dream", "duration_ms": 199000 },
  { "title": "Glycerine", "artist": "Bush", "album": "Sixteen Stone", "duration_ms": 234000 }
]
```

All 5 tracks should resolve (green checkmarks). Verify in Network tab that 5 search calls were made.

**Verify error handling:**
- Paste `not json at all` → inline error shown, no crash
- Paste `[]` (empty array) → "No tracks found" error shown
- Paste JSON with one made-up track `{ "title": "zzz fake track xxx", ... }` → that row shows red "Not found", others resolve normally

---

## Git Checkpoints

### Checkpoint 1 — `checkpoint/1-foundation`
**Covers:** Project setup, Tailwind, routing, auth (OAuth + PKCE + token refresh), Vercel deployment, LoginPage, CallbackPage, AppLayout skeleton

**Definition of done:**
- `npm run dev` starts without errors
- `npx tsc --noEmit` passes
- Login → Spotify → callback → home works end to end
- Tokens stored in localStorage
- Logout clears tokens
- Deployed to Vercel with correct redirect URI

**Tasks:**
- [ ] Init Vite + React + TypeScript project
- [ ] Install + configure Tailwind with custom colors
- [ ] Set up React Router: routes for `/`, `/callback`, `/artist/:id`
- [ ] Build `LoginPage` (logo, login button)
- [ ] Implement `pkce.ts` (code verifier + challenge)
- [ ] Implement `tokenStorage.ts`
- [ ] Build `CallbackPage` (code exchange via Vercel function)
- [ ] Build `api/callback.ts` Vercel serverless function
- [ ] Build `api/refresh.ts` Vercel serverless function
- [ ] Build `spotifyClient.ts` (fetch wrapper with auth + auto-refresh)
- [ ] Build `AuthContext` + `useAuth`
- [ ] Build `AppLayout` skeleton (nav + main + empty player bar slot)
- [ ] Configure `vercel.json` routes
- [ ] Deploy and test end to end

---

### Checkpoint 2 — `checkpoint/2-search-artist`
**Covers:** Home screen layout, search bar, search results (artists/tracks/albums), Artist page

**Definition of done:**
- Search returns results within 500ms of debounce
- Artist page loads correctly for any artist ID
- No TypeScript errors, no console errors

**Tasks:**
- [ ] Build `Navbar` with centered search input
- [ ] Build `useSearch` hook (debounced, calls `search.ts`)
- [ ] Build `SearchResults` (three sections: artists, tracks, albums)
- [ ] Build `ArtistCard`, `AlbumCard`, `TrackRow` UI components
- [ ] Build `ArtistPage` with header + top tracks
- [ ] Wire artist card click → navigate to `/artist/:id`
- [ ] Wire track click → (placeholder for Phase 3)

---

### Checkpoint 3 — `checkpoint/3-playback`
**Covers:** Spotify Web Playback SDK, PlayerBar, full playback controls

**Definition of done:**
- Click any track → it plays
- Player bar shows correct metadata
- All controls functional (play/pause/next/prev/seek/volume)
- Premium error handled gracefully

**Tasks:**
- [ ] Build `PlayerContext` with SDK initialization
- [ ] Build `PlayerBar` component (all controls)
- [ ] Implement `usePlayer` hook
- [ ] Wire track clicks in search results + artist page to player
- [ ] Handle Premium error state
- [ ] Test seek + volume controls

---

### Checkpoint 4 — `checkpoint/4-home-screen`
**Covers:** Home screen logged-in state: Recently Played, Your Playlists, Recommendations

**Definition of done:**
- All three sections render with real data
- Sections hidden gracefully when no data
- Click track in any section plays it

**Tasks:**
- [ ] Build `RecentlyPlayed` component + API call
- [ ] Build `YourPlaylists` component + API call
- [ ] Build `Recommendations` component + API call (with seed fallback)
- [ ] Add horizontal scroll rows with arrow navigation
- [ ] Wire all track clicks to `PlayerContext`

---

### Checkpoint 5 — `checkpoint/5-playlist-generator`
**Covers:** Claude Playlist Generator modal, track resolution, playlist creation

**Definition of done:**
- Full flow works end to end (type → copy prompt → paste JSON → resolve → create)
- Error states handled (invalid JSON, unresolved tracks, API failures)
- Playlist visible in Spotify within 5 seconds of creation

**Tasks:**
- [ ] Build Claude icon button in Navbar
- [ ] Build `GeneratorModal` with description input + prompt display + copy button
- [ ] Build `ImportInput` (JSON paste field with validation)
- [ ] Build `useTrackResolver` hook (search + scoring algorithm)
- [ ] Build `TrackPreview` (resolved/unresolved list)
- [ ] Implement playlist create + add tracks API calls
- [ ] Build success/error states
- [ ] Write `.claude/commands/spotify-playlist-generator.md` skill
- [ ] End-to-end test with test fixture JSON

---

## Development Workflow

### Setup

```bash
git clone <repo>
cd tuner
npm install
cp .env.example .env.local
# Fill in VITE_SPOTIFY_CLIENT_ID and VITE_REDIRECT_URI in .env.local
npm run dev
```

### Available Commands

```bash
npm run dev          # Start Vite dev server at http://localhost:5173
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npx tsc --noEmit     # Type-check without emitting files
npx eslint src       # Lint all source files
```

### Environment Variables

```bash
# .env.local — client-side (safe to use in browser)
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_REDIRECT_URI=http://localhost:5173/callback

# Vercel environment variables (set in Vercel dashboard, server-side only)
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
VITE_REDIRECT_URI=https://your-app.vercel.app/callback
```

Never put `SPOTIFY_CLIENT_SECRET` in any `.env` file that gets committed or bundled by Vite.

### Vercel Deployment

```bash
npx vercel --prod    # Deploy to production
npx vercel           # Deploy preview
```

`vercel.json` must include:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
This ensures React Router handles all client-side routes.

### Spotify App Configuration (developer.spotify.com)

In your Spotify app settings, add both redirect URIs:
- `http://localhost:5173/callback`
- `https://your-app.vercel.app/callback`

### Adding a New Spotify API Call

1. Add the function to the relevant file in `src/api/`
2. Use `spotifyClient` (not raw fetch) so auth headers + refresh are handled automatically
3. Add the response type to `src/types/spotify.ts`
4. Expose via a hook in `src/hooks/` if the component needs loading/error state
