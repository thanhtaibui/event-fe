import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) {
            return 'react';
          }
          if (/[\\/]node_modules[\\/]@mui[\\/]icons-material[\\/]/.test(id)) {
            return 'mui-icons';
          }
          if (/[\\/]node_modules[\\/]@mui[\\/]x-/.test(id)) {
            return 'mui-x';
          }
          if (/[\\/]node_modules[\\/]@mui[\\/]/.test(id)) {
            return 'mui-core';
          }
          if (/[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/.test(id)) {
            return 'charts';
          }
          if (/[\\/]node_modules[\\/]react-chatbotify[\\/]/.test(id)) {
            return 'chat';
          }
          if (/[\\/]node_modules[\\/](react-select|react-datepicker|react-flatpickr|flatpickr)[\\/]/.test(id)) {
            return 'forms';
          }
          if (/[\\/]node_modules[\\/](react-dropzone|react-easy-crop)[\\/]/.test(id)) {
            return 'media';
          }
        },
      },
    },
  },
})
