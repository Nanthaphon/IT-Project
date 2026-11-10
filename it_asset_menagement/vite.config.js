import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { Buffer } from 'node:buffer'
import { loadEnv as loadMigrationEnv } from './scripts/supabase/loadEnv.mjs'

/* ตอน dev รันฟังก์ชันใน api/ ในเครื่องเอง (แบบเดียวกับ Vercel) ต่อ Supabase ตาม .env.local
   เดิม proxy ไป Vercel ตัวจริง — ตัวจริงยังผูก Firebase จนถึงวันสลับ เรียกจากที่นี่จะได้ token คนละระบบ
   ค่าลับ SUPABASE_SERVICE_ROLE_KEY อ่านจาก .env.migration.local (ไม่ขึ้น git · ไม่เข้า bundle หน้าเว็บ)
   ไม่มีค่าลับในเครื่อง → ฟังก์ชันตอบ 500 "ระบบยังไม่พร้อม" (หน้าอื่นยังใช้ได้ ยกเว้นล็อกอินพนักงาน/จัดการรหัส) */
function localApi() {
  return {
    name: 'local-vercel-api',
    configureServer(server) {
      loadMigrationEnv()
      server.middlewares.use('/api', async (req, res, next) => {
        const name = (req.url || '').split('?')[0].replace(/^\/+|\/+$/g, '')
        if (!/^[a-z0-9-]+$/.test(name)) return next()
        let mod
        try { mod = await server.ssrLoadModule(`/api/${name}.js`) } catch { return next() }
        const chunks = []
        for await (const c of req) chunks.push(c)
        const raw = Buffer.concat(chunks).toString('utf8')
        try { req.body = raw && /json/.test(req.headers['content-type'] || '') ? JSON.parse(raw) : raw } catch { req.body = {} }
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (obj) => { if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); return res }
        try { await mod.default(req, res) } catch (e) {
          console.error(`[api/${name}]`, e)
          if (!res.headersSent) res.status(500).json({ error: e.message })
        }
      })
    },
  }
}

export default defineConfig(() => ({
  plugins: [
    tailwindcss(),
    localApi(),
  ],
}))
