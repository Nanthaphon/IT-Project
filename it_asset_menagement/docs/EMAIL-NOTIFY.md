# อีเมลแจ้งเตือน (แทน Teams)

`api/staff-notify.js` ส่งอีเมลผ่าน **Microsoft Graph** จากกล่องจดหมาย M365 ของบริษัท · โค้ดส่ง/หน้าตาอีเมลอยู่ `api/_lib/mailer.js` (เทสต์ `scripts/supabase/notify-email.test.mjs`)

| เรื่อง | ส่งถึง |
|---|---|
| แจ้งซ่อม · คำขอเปลี่ยนเครื่อง · คำขออุปกรณ์เสริม · License ใกล้หมดอายุ | `IT_NOTIFY_EMAILS` |
| คำขอเบิกอุปกรณ์สำนักงาน | `HR_NOTIFY_EMAILS` |

License ใกล้หมดอายุส่ง **วันละฉบับทั้งระบบ** (จำวันที่ส่งไว้ที่ `it_report/notify_state`) — แอดมินหลายคนเปิดระบบก็ไม่ได้อีเมลซ้ำ

## ตั้งค่าครั้งแรก (ผู้ดูแล M365 ทำ)

1. **กล่องที่ใช้ส่ง** — ใช้กล่องที่มีอยู่ หรือสร้าง Shared mailbox (ไม่เสีย license) เช่น `it-notify@บริษัท` → ค่า `MAIL_FROM`
2. **App registration** — [entra.microsoft.com](https://entra.microsoft.com) → Applications → App registrations → New registration
   ชื่อ `IT Asset Notify` · Single tenant · ไม่ต้องใส่ Redirect URI
   - จด **Directory (tenant) ID** → `MS_TENANT_ID` · **Application (client) ID** → `MS_CLIENT_ID`
   - Certificates & secrets → New client secret (24 เดือน) → คัดลอก **Value** → `MS_CLIENT_SECRET` (ดูได้ครั้งเดียว · จดวันหมดอายุไว้ต่ออายุ)
   - API permissions → Add → Microsoft Graph → **Application permissions** → `Mail.Send` → **Grant admin consent**
3. **จำกัดให้ส่งได้จากกล่องเดียว** (แนะนำ — ไม่งั้นแอปส่งในนามใครก็ได้ในบริษัท) — Exchange Online PowerShell:
   ```powershell
   Connect-ExchangeOnline
   New-ApplicationAccessPolicy -AppId <MS_CLIENT_ID> -PolicyScopeGroupId it-notify@บริษัท -AccessRight RestrictAccess -Description "IT Asset notify"
   Test-ApplicationAccessPolicy -Identity it-notify@บริษัท -AppId <MS_CLIENT_ID>   # ต้องได้ Granted
   ```
4. **ใส่ค่าบน Vercel** (โปรเจค `it-asset-management`) ในโฟลเดอร์ `it_asset_menagement`:
   ```
   vercel env add MS_TENANT_ID production
   vercel env add MS_CLIENT_ID production
   vercel env add MS_CLIENT_SECRET production
   vercel env add MAIL_FROM production
   vercel env add IT_NOTIFY_EMAILS production     # เช่น it1@บริษัท, it2@บริษัท
   vercel env add HR_NOTIFY_EMAILS production
   vercel --prod
   ```
   หรือใส่ทั้งหมดใน `.env.local` แล้ว `node scripts/vercel-env-push.mjs`
5. **ทดสอบ** — พนักงานแจ้งซ่อม 1 เรื่อง → อีเมลเข้าผู้รับ IT · ไม่เข้า = หน้าเว็บขึ้นสาเหตุ (ชื่อ env ที่ขาด / รหัสจาก Graph)

| ข้อความผิดพลาด | สาเหตุ |
|---|---|
| `ยังไม่ได้ตั้งค่าอีเมลแจ้งเตือน (…)` | env ที่ระบุยังไม่ได้ใส่ / ยังไม่ได้ `vercel --prod` หลังใส่ |
| `ขอสิทธิ์ส่งอีเมลไม่สำเร็จ (401 invalid_client)` | secret ผิดหรือหมดอายุ |
| `ส่งอีเมลไม่สำเร็จ (403 ErrorAccessDenied)` | ยังไม่ได้ Grant admin consent หรือ `MAIL_FROM` อยู่นอก Application Access Policy |
| `ส่งอีเมลไม่สำเร็จ (404 ErrorInvalidUser)` | `MAIL_FROM` ไม่ใช่กล่องจดหมายในบริษัท |

ค่า `TEAMS_IT_WEBHOOK_URL` / `TEAMS_HR_WEBHOOK_URL` เลิกใช้แล้ว — ลบออกจาก `.env.local` ได้
