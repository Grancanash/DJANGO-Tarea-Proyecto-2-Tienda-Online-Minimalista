import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './context/CartContext.tsx'

const GOOGLE_CLIENT_ID = '407380072093-net9iu582ctjsa5aego2pdqeq220l5l6.apps.googleusercontent.com'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CartProvider>
          <App />
      </CartProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
