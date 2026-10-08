import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// /bot-report is the headless page the LINE morning-report job screenshots
const BotReportPage = lazy(() => import('./bot/BotReportPage.jsx'))
const isBotReport = window.location.pathname.replace(/\/$/, '') === '/bot-report'

createRoot(document.getElementById('root')).render(
  isBotReport ? <Suspense fallback={null}><BotReportPage /></Suspense> : <App />
)
