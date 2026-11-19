/* ที่อยู่สาธารณะของระบบ — ใช้ใน QR ทรัพย์สิน (สแกนแล้วเปิดหน้ารายละเอียด)
   โดเมนเก่า itassetmenagement.vercel.app เลิกใช้แล้ว (ไม่ใช้สติกเกอร์ QR รุ่นเก่า) */
export const PUBLIC_APP_URL = (import.meta.env?.VITE_PUBLIC_APP_URL || 'https://it-assets-management.gbos.app').replace(/\/+$/, '');

export const assetQrUrl = (id, cat = 'assets') => `${PUBLIC_APP_URL}/?asset=${id}&cat=${encodeURIComponent(cat || 'assets')}`;
