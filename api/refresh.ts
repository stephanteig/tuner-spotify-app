import type { VercelRequest, VercelResponse } from '@vercel/node'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function cors(res: VercelResponse): VercelResponse {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
  return res
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    cors(res).status(204).end()
    return
  }

  if (req.method !== 'POST') {
    cors(res).status(405).json({ error: 'Method not allowed' })
    return
  }

  const { refresh_token } = req.body as { refresh_token?: string }

  if (!refresh_token) {
    cors(res).status(400).json({ error: 'Missing refresh_token' })
    return
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    cors(res).status(500).json({ error: 'Server misconfiguration: missing env vars' })
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
      cors(res).status(tokenRes.status).json({
        error: data.error ?? 'refresh_failed',
        description: data.error_description,
      })
      return
    }

    cors(res).status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
    })
  } catch (err) {
    console.error('[api/refresh] Unexpected error:', err)
    cors(res).status(500).json({ error: 'Internal server error' })
  }
}
