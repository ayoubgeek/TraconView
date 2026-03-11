import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Layout from './app/layout.jsx'

import Page from './app/page.jsx'

import './styles/globals.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Layout>
      <Page />
    </Layout>
  </StrictMode>,
)
