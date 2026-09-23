import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { I18nProvider } from './i18n/I18nContext.jsx'
import { SaathiProvider } from './context/SaathiContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <AppProvider>
          <SaathiProvider>
            <App />
          </SaathiProvider>
        </AppProvider>
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
)

