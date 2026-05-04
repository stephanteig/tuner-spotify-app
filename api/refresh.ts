import type { VercelRequest, VercelResponse } from '@vercel/node'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.set(CORS_HEADERS).status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.set(CORS_HEADERS).status(405).json({ error: 'Method not allowed' })
    return
  }

  const { refresh_token } = req.body as { refresh_token?: string }

  if (!refresh_token) {
    res.set(CORS_HEADERS).status(400).json({ error: 'Missing refresh_token' })
    return
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    res
      .set(CORS_HEADERS)
      .status(500)
      .json({ error: 'Server misconfiguration: missing env vars' })
    return
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
    client_id: clientId,
  })

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: params.toString(),
    })

    const data = await tokenRes.json() as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
      error?: string
      error_description?: string
    }

    if (!tokenRes.ok) {
      res.set(CORS_HEADERS).status(tokenRes.status).json({
        error: data.error ?? 'refresh_failed',
        description: data.error_description,
      })
      return
    }

    res.set(CORS_HEADERS).status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      // Spotify may return a new refresh_token
      ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
    })
  } catch (err) {
    console.error('[api/refresh] Unexpected error:', err)
    res.set(CORS_HEADERS).status(500).json({ error: 'Internal server error' })
  }
}
