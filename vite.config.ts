import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// public/ holds the whole pre-React site -- every .html page, its css and
// js, and the images. Vite copies that directory into dist/ untouched, so
// /dashboard.html, /main.css and /services.html keep resolving at exactly
// the URLs they always had while the React rebuild happens page by page.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
