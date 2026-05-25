import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/boke/',   // 必须与 GitHub 仓库名一致，注意首尾斜杠
  server: {
    port: 3000
  }
})
