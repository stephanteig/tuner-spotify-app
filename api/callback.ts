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

  const { code, code_verifier } = req.body as {
    code?: string
    code_verifier?: string
  }

  if (!code || !code_verifier) {
    cors(res).status(400).json({ error: 'Missing code or code_verifier' })
    return
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const redirectUri = process.env.VITE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    cors(res).status(500).json({ error: 'Server misconfiguration: missing env vars' })
    return
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier,
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
        error: data.error ?? 'token_exchange_failed',
        description: data.error_description,
      })
      return
    }

    cors(res).status(200).json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    })
  } catch (err) {
    console.error('[api/callback] Unexpected error:', err)
    cors(res).status(500).json({ error: 'Internal server error' })
  }
}
