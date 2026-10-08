import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' sayesinde uygulama GitHub Pages alt dizininde (/EnglishMan/) de çalışır.
export default defineConfig({
  base: './',
  plugins: [react()],
});
