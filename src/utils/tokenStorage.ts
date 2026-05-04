const KEYS = {
  ACCESS_TOKEN: 'tuner_access_token',
  REFRESH_TOKEN: 'tuner_refresh_token',
  TOKEN_EXPIRY: 'tuner_token_expiry',
} as const

export function getAccessToken(): string | null {
  return localStorage.getItem(KEYS.ACCESS_TOKEN)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(KEYS.REFRESH_TOKEN)
}

export function getTokenExpiry(): number | null {
  const expiry = localStorage.getItem(KEYS.TOKEN_EXPIRY)
  return expiry ? parseInt(expiry, 10) : null
}

/**
 * Stores tokens in localStorage.
 * @param access - Access token string
 * @param refresh - Refresh token string
 * @param expiresIn - Number of seconds until the access token expires
 */
export function setTokens(access: string, refresh: string, expiresIn: number): void {
  const expiryMs = Date.now() + expiresIn * 1000
  localStorage.setItem(KEYS.ACCESS_TOKEN, access)
  localStorage.setItem(KEYS.REFRESH_TOKEN, refresh)
  localStorage.setItem(KEYS.TOKEN_EXPIRY, String(expiryMs))
  console.log('[Auth] Token expires at', new Date(expiryMs).toLocaleString())
}

export function clearTokens(): void {
  localStorage.removeItem(KEYS.ACCESS_TOKEN)
  localStorage.removeItem(KEYS.REFRESH_TOKEN)
  localStorage.removeItem(KEYS.TOKEN_EXPIRY)
}

/**
 * Returns true if the access token is expired or within 60 seconds of expiry.
 */
export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry()
  if (!expiry) return true
  return Date.now() >= expiry - 60_000
}
