/* ที่อยู่สาธารณะของระบบ — ใช้ใน QR บนสติกเกอร์ทรัพย์สิน (สแกนแล้วเปิดหน้ารายละเอียด)
   ⚠️ สติกเกอร์ที่พิมพ์ไปแล้วชี้ itassetmenagement.vercel.app — ย้าย hosting ต้องให้โดเมนนี้ใช้ได้ต่อ
   (โอนโปรเจค Vercel เดิมเข้าทีมบริษัท โดเมนตามไปด้วย · docs/SUPABASE-MIGRATION.md)
   มีโดเมนบริษัทแล้วตั้ง VITE_PUBLIC_APP_URL ได้ — สติกเกอร์ใหม่จะชี้โดเมนนั้น (โดเมนเก่าต้องยังเปิดอยู่) */
export const PUBLIC_APP_URL = (import.meta.env?.VITE_PUBLIC_APP_URL || 'https://itassetmenagement.vercel.app').replace(/\/+$/, '');

export const assetQrUrl = (id, cat = 'assets') => `${PUBLIC_APP_URL}/?asset=${id}&cat=${encodeURIComponent(cat || 'assets')}`;
