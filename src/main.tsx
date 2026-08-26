import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { LanguageProvider } from './contexts/LanguageContext.tsx'
import { SubjectsProvider } from './contexts/SubjectsContext.tsx'
import { DiseasesProvider } from './contexts/DiseasesContext.tsx'
import { hydrateDesktopStorage } from './lib/storage'

async function bootstrap() {
  await hydrateDesktopStorage()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <LanguageProvider>
            <DiseasesProvider>
              <SubjectsProvider>
                <App />
              </SubjectsProvider>
            </DiseasesProvider>
          </LanguageProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}

void bootstrap().catch(error => {
  console.error('MedStudy failed to start:', error)
  const root = document.getElementById('root')
  if (root) root.textContent = 'MedStudy could not start. Please restart the application.'
})
