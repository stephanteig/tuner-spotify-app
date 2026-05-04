import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { SpotifyUser } from '../types/spotify'
import { fetchUserProfile } from '../api/auth'
import { getAccessToken, setTokens, clearTokens } from '../utils/tokenStorage'
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce'

const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-recently-played',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
  'ugc-image-upload',
].join(' ')

interface AuthContextValue {
  user: SpotifyUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => Promise<void>
  logout: () => void
  setTokensAndLoad: (access: string, refresh: string, expiresIn: number) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const profile = await fetchUserProfile()
      setUser(profile)
    } catch (err) {
      console.error('[Auth] Failed to load user profile:', err)
      clearTokens()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(async () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string
    const redirectUri = import.meta.env.VITE_REDIRECT_URI as string

    if (!clientId) {
      console.error('[Auth] Missing VITE_SPOTIFY_CLIENT_ID')
      return
    }

    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)

    sessionStorage.setItem('pkce_verifier', verifier)

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: SPOTIFY_SCOPES,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    window.location.href = '/login'
  }, [])

  const setTokensAndLoad = useCallback(
    async (access: string, refresh: string, expiresIn: number) => {
      setTokens(access, refresh, expiresIn)
      setIsLoading(true)
      try {
        const profile = await fetchUserProfile()
        setUser(profile)
      } catch (err) {
        console.error('[Auth] Failed to load user profile after token set:', err)
        clearTokens()
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        setTokensAndLoad,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
