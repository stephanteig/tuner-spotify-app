import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'

export function LoginPage() {
  const { login, isLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const [loginLoading, setLoginLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'access_denied') {
      setError('You denied access to Spotify. Please try again.')
    } else if (err === 'callback_failed') {
      setError('Login failed. Please try again.')
    } else if (err) {
      setError('An error occurred. Please try again.')
    }
  }, [searchParams])

  const handleLogin = async () => {
    setLoginLoading(true)
    try {
      await login()
    } catch {
      setError('Failed to initiate login. Please try again.')
      setLoginLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-8 px-4">
      {/* Logo mark */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Tuner</h1>
        <p className="text-secondary text-lg">Your Spotify, reimagined.</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-6 py-3 text-red-400 text-sm max-w-sm text-center">
          {error}
        </div>
      )}

      {/* Login button */}
      <Button
        variant="primary"
        onClick={handleLogin}
        disabled={loginLoading}
        className="text-base px-8 py-3 flex items-center gap-2"
      >
        {loginLoading ? (
          <>
            <Spinner size={16} />
            Connecting…
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Log in with Spotify
          </>
        )}
      </Button>

      <p className="text-xs text-muted text-center max-w-xs">
        Tuner requires a Spotify Premium account for full playback features.
      </p>
    </div>
  )
}
