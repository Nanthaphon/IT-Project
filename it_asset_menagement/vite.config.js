import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

/* ตอน dev ให้ vite ส่งต่อ /api ไปที่ Vercel เอง
   เดิมเบราว์เซอร์เรียก Vercel ตรง ซึ่ง CORS อนุญาตแค่ localhost:5173
   พอพอร์ตเปลี่ยน (5173 ถูกโปรเจคอื่นใช้ → vite ขยับไป 5174/5175) เข้าสู่ระบบพนักงานขึ้น "Failed to fetch"
   ผ่าน proxy แล้วเบราว์เซอร์เห็นเป็น origin เดียวกัน ใช้ได้ทุกพอร์ต
   โหมด emulator ไม่ใช้ proxy — ไม่งั้นจะไปเรียก API ตัวจริงที่ผูกกับ Firestore จริง */
const VERCEL_API = 'https://itassetmenagement.vercel.app'

export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
  ],
  server: mode === 'emulator' ? {} : {
    proxy: {
      '/api': {
        target: VERCEL_API,
        changeOrigin: true,
        configure: (proxy) => {
          // ไม่ส่ง Origin ของ localhost ต่อ — ฝั่ง Vercel มองเป็นคำขอจากเซิร์ฟเวอร์ ไม่ใช่เบราว์เซอร์
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
    },
  },
}))
