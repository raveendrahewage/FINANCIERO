import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'charts';
            if (id.includes('@google/generative-ai')) return 'ai';
            if (id.includes('firebase')) return 'vendor';
            if (id.includes('react')) return 'vendor';
            return 'vendor';
          }
        },
      },
    },
  },
})
