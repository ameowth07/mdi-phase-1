import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ComponentGallery from './ComponentGallery.tsx'

const view = new URLSearchParams(window.location.search).get('view')
const Root = view === 'gallery' ? ComponentGallery : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
