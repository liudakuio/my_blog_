// Vite 构建配置：Vue 插件、路径别名、开发服务器、代码分割
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
    // 开发态将 /api 代理到后台服务（D:/lzkgit/my_blog_bak，端口 8080），
    // 复用现有 baseURL: '/api'，避免跨域凭据问题。
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // 上传后的图片由后端以 /uploads/** 直读磁盘返回，需一并代理，
      // 否则开发态预览与列表缩略图会打到 Vite dev server 导致 404
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'vendor': ['vue', 'vue-router', 'pinia', 'matter-js']
        }
      }
    }
  }
})
