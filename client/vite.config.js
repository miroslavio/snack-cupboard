import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                // Allow overriding API target with env var for dev flexibility
                target: process.env.VITE_API_TARGET || 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
})
