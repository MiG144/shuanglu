/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // 相对路径 base：产物可在任意子路径部署（GitHub Pages 项目页 / Netlify / 本地均可用）
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: '双陆棋 · 打双陆',
        short_name: '双陆棋',
        description: '中式双陆棋（打双陆）——依据宋《谱双》规则',
        lang: 'zh-CN',
        start_url: './',
        display: 'standalone',
        background_color: '#7a4f2a',
        theme_color: '#7a4f2a',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // GitHub Pages 子路径下刷新需回退到 index.html（SPA 无路由，仅防 404 场景）
        navigateFallback: undefined,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})