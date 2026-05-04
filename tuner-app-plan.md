# Tuner — App Plan

A desktop-first, browser-based Spotify frontend rebuilt from scratch with a clean, minimal interface. Powered by the Spotify Web API, with a Claude-based playlist generator built on top.

**Existing repo (foundation):** https://github.com/stephanteig/spotify-clone
- React + TypeScript + Vite + Tailwind CSS
- Spotify Web API + Web Playback SDK
- Core working features: artist search, album/single listing, playback

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Music API | Spotify Web API |
| Playback | Spotify Web Playback SDK |
| Auth | Spotify OAuth 2.0 (Authorization Code Flow) |
| Hosting | Vercel (serverless function for OAuth) |
| AI Integration | Claude Code skill (prompt-based, no direct API call) |

---

## Build Order — Feature by Feature

### Phase 1 — Foundation

- [ ] **1.1** Fork or copy the existing spotify-clone repo into a new repo called `tuner`
- [ ] **1.2** Clean up the old codebase — remove old UI components, keep only the Spotify API utility functions and any auth logic worth reusing
- [ ] **1.3** Set up Vite + React + TypeScript from scratch (or confirm existing setup is clean)
- [ ] **1.4** Add Tailwind CSS
- [ ] **1.5** Set up `.env` with Spotify credentials (`VITE_SPOTIFY_CLIENT_ID`, `VITE_SPOTIFY_CLIENT_SECRET`)
- [ ] **1.6** Implement Spotify OAuth 2.0 Authorization Code Flow
  - Login button → redirects to Spotify
  - Callback handler stores access token + refresh token
  - Token refresh logic
  - Required scopes: `streaming`, `user-read-email`, `user-read-private`, `user-read-playback-state`, `user-modify-playback-state`, `user-read-recently-played`, `playlist-read-private`, `playlist-modify-public`, `playlist-modify-private`
- [ ] **1.7** Deploy skeleton app to Vercel with OAuth redirect URI configured
- [ ] **1.8** Confirm login/logout works end to end

---

### Phase 2 — Search

- [ ] **2.1** Build the home screen layout — centered search bar, clean minimal design
- [ ] **2.2** Wire up Spotify `/search` endpoint to the search bar
- [ ] **2.3** Show results organized by type: Artists → Top Tracks → Albums
- [ ] **2.4** Make the search bar stick to the top nav on scroll
- [ ] **2.5** Below the search bar on scroll, show: Recently Played, Your Playlists, Recommendations (placeholders are fine for now)

---

### Phase 3 — Artist Page

- [ ] **3.1** Build artist page layout — cover art, name, follower count
- [ ] **3.2** Fetch and display artist's top tracks via `GET /artists/{id}/top-tracks`
- [ ] **3.3** Click a track to play it (hooks into Phase 4)

---

### Phase 4 — Playback

- [ ] **4.1** Integrate Spotify Web Playback SDK
- [ ] **4.2** Build the persistent player bar at the bottom
  - Album art, track name, artist name
  - Progress bar with current time / total duration
  - Controls: previous, play/pause, next, volume
- [ ] **4.3** Connect search results and artist page tracks to the player
- [ ] **4.4** Confirm playback works end to end

---

### Phase 5 — Home Screen (logged in state)

- [ ] **5.1** Fetch recently played tracks via `GET /me/player/recently-played`
- [ ] **5.2** Fetch user's playlists via `GET /me/playlists`
- [ ] **5.3** Fetch recommendations via `GET /recommendations`
- [ ] **5.4** Display all three sections below the search bar on the home screen

---

### Phase 6 — Claude Playlist Generator

- [ ] **6.1** Build the Claude icon button in the nav
- [ ] **6.2** Build the modal with a text input: *"Describe the playlist you want"*
- [ ] **6.3** Generate a copyable Claude prompt from the user's input:
  ```
  /spotify-playlist-generator: <user input>
  ```
- [ ] **6.4** Build the "Import Playlist JSON" input field in the app
- [ ] **6.5** Write the track resolution logic:
  - For each song in the JSON, call `GET /search?q={title} {artist}&type=track`
  - Match on title + artist + album, use duration_ms as tiebreaker
  - Collect resolved `track_uri` values
  - Flag any tracks that couldn't be matched
- [ ] **6.6** Build the playlist preview screen — list of resolved tracks before creating
- [ ] **6.7** Create playlist via `POST /users/{user_id}/playlists`
- [ ] **6.8** Add tracks via `POST /playlists/{playlist_id}/tracks`
- [ ] **6.9** Confirm playlist appears in user's Spotify account on all devices

---

### Phase 7 — Claude Code Skill

- [ ] **7.1** Write the `spotify-playlist-generator` Claude Code skill
- [ ] **7.2** Define the skill prompt template — understands music context, transitions, moods
- [ ] **7.3** Ensure output is always clean JSON matching this schema:
  ```json
  [
    {
      "title": "string",
      "artist": "string",
      "album": "string",
      "duration_ms": number
    }
  ]
  ```
- [ ] **7.4** Test the skill with a range of prompts and verify the app resolves the tracks correctly

---

### Phase 8 — Polish & Deploy

- [ ] **8.1** Responsive refinements for large desktop screens
- [ ] **8.2** Loading states and error handling throughout
- [ ] **8.3** Handle edge cases: expired tokens, unmatched tracks, empty search results
- [ ] **8.4** Final Vercel deployment with custom domain (optional)
- [ ] **8.5** Update README with setup instructions and `.env` template

---

## Future Features (not in initial build)

- **Lyrics** — Spotify's API doesn't expose lyrics. Could integrate Genius or Musixmatch later.
- **DJ-style queue** — Use `/recommendations` endpoint to auto-extend the queue based on current track audio features.
- **Queue management** — View and edit the current playback queue.
- **Prompt history** — Save previously generated Claude prompts and playlists in local storage.

---

## Key API Endpoints

| Feature | Endpoint |
|---|---|
| Search | `GET /search` |
| Artist top tracks | `GET /artists/{id}/top-tracks` |
| Recommendations | `GET /recommendations` |
| Recently played | `GET /me/player/recently-played` |
| User playlists | `GET /me/playlists` |
| Current user | `GET /me` |
| Create playlist | `POST /users/{user_id}/playlists` |
| Add tracks to playlist | `POST /playlists/{playlist_id}/tracks` |

---

## References

- Existing repo: https://github.com/stephanteig/spotify-clone
- Spotify Web API docs: https://developer.spotify.com/documentation/web-api
- Spotify Web Playback SDK: https://developer.spotify.com/documentation/web-playback-sdk
- Spotify OAuth guide: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
- Create playlist endpoint: https://developer.spotify.com/documentation/web-api/reference/create-playlist
