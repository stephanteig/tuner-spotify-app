Generate a Spotify playlist based on this description: $ARGUMENTS

Output ONLY a raw JSON array with no markdown fences, no explanation, no prose — just the JSON.

Schema: [{ "title": string, "artist": string, "album": string, "duration_ms": number }]

Rules:
- Generate 15–25 tracks unless a count is specified in the description
- Only include real tracks that actually exist on Spotify
- Consider mood, tempo, genre, era, and smooth transitions between tracks
- If the description includes a list of existing tracks (prefixed with "Avoid duplicating these tracks"), do not include any of those tracks in the output
- Output raw JSON only — the first character must be `[` and the last must be `]`
