import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui/Spinner'

export function CallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setTokensAndLoad } = useAuth()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const error = searchParams.get('error')
    if (error) {
      navigate('/login?error=access_denied', { replace: true })
      return
    }

    const code = searchParams.get('code')
    if (!code) {
      navigate('/login?error=callback_failed', { replace: true })
      return
    }

    const codeVerifier = sessionStorage.getItem('pkce_verifier')
    if (!codeVerifier) {
      console.error('[Callback] Missing pkce_verifier in sessionStorage')
      navigate('/login?error=callback_failed', { replace: true })
      return
    }

    const exchangeToken = async () => {
      try {
        const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string
        const redirectUri = import.meta.env.VITE_REDIRECT_URI as string

        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          code_verifier: codeVerifier,
        })

        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as { error?: string }
          console.error('[Callback] Token exchange failed:', errorData)
          navigate('/login?error=callback_failed', { replace: true })
          return
        }

        const data = await response.json() as {
          access_token: string
          refresh_token: string
          expires_in: number
        }

        sessionStorage.removeItem('pkce_verifier')

        await setTokensAndLoad(data.access_token, data.refresh_token, data.expires_in)
        navigate('/', { replace: true })
      } catch (err) {
        console.error('[Callback] Unexpected error:', err)
        navigate('/login?error=callback_failed', { replace: true })
      }
    }

    exchangeToken()
  }, [searchParams, navigate, setTokensAndLoad])

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
      <Spinner size={32} />
      <p className="text-secondary text-sm">Logging in…</p>
    </div>
  )
}
