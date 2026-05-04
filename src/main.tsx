import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PlayerProvider } from './context/PlayerContext'
import { PlaylistAdderProvider } from './context/PlaylistAdderContext'
import App from './App'
import './index.css'

const rootEl = document.getElementById('root')!

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <PlaylistAdderProvider>
            <App />
          </PlaylistAdderProvider>
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
