import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',   // <--- ESTA ES LA CLAVE. Si falta esto, la pantalla se ve blanca.
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
