import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isTokenExpired,
} from './tokenStorage'

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1'

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function refreshTokens(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        return false
      }

      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string

      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
      })

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json() as {
        access_token: string
        expires_in: number
        refresh_token?: string
      }

      setTokens(
        data.access_token,
        data.refresh_token ?? refreshToken,
        data.expires_in,
      )
      return true
    } catch {
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function redirectToLogin(): void {
  clearTokens()
  window.location.href = '/login'
}

export async function spotifyFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // Proactively refresh if token is near expiry
  if (isTokenExpired()) {
    const refreshed = await refreshTokens()
    if (!refreshed) {
      redirectToLogin()
      throw new Error('Failed to refresh token')
    }
  }

  const token = getAccessToken()
  if (!token) {
    redirectToLogin()
    throw new Error('No access token')
  }

  const url = path.startsWith('http') ? path : `${SPOTIFY_BASE_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  // Handle 401 — try refresh once and retry
  if (response.status === 401) {
    const refreshed = await refreshTokens()
    if (!refreshed) {
      redirectToLogin()
      throw new Error('Authentication failed')
    }

    const newToken = getAccessToken()
    const retryResponse = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!retryResponse.ok) {
      if (retryResponse.status === 401) {
        redirectToLogin()
        throw new Error('Authentication failed after refresh')
      }
      const errorText = await retryResponse.text()
      throw new Error(`Spotify API error ${retryResponse.status}: ${errorText}`)
    }

    if (retryResponse.status === 204) {
      return undefined as T
    }

    const retryText = await retryResponse.text()
    if (!retryText) return undefined as T
    return JSON.parse(retryText) as T
  }

  // Handle 429 rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After')
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000
    await new Promise(resolve => setTimeout(resolve, waitMs))
    return spotifyFetch<T>(path, options)
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Spotify API error ${response.status}: ${errorText}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}
