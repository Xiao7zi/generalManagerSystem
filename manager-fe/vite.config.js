import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        host: 'localhost',
        port: 8080,
        // 将所有以 '/api' 开头的请求代理到 http://localhost:3000
        proxy: {
            "/api": {
                target: "http://localhost:3000"
            }
        }
    },
    plugins: [vue()],
})
