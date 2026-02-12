import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import { AppRoutes } from './routes'

// Prefer env, but fall back to inline client ID if env is missing.
const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '319367767049-qepfa9m1r1hvvd1a77tmss8d87m9a573.apps.googleusercontent.com'

if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  console.warn(
    '⚠️ VITE_GOOGLE_CLIENT_ID not set. Using inline fallback. ' +
      'For production, set VITE_GOOGLE_CLIENT_ID in your env.'
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
