// 🆕 Helper สำหรับรูปประเมินสภาพ — บีบอัดแล้วเก็บเป็น base64 ในเอกสาร
import { compressImage } from './compressImage.js';

/* ── ยังไม่มีที่เก็บไฟล์ → เก็บ base64 ตรง ─────────────────────────────────
   Firebase Storage ไม่เคยเปิดได้ (bucket 404 · ต้องแพลน Blaze) — ตรวจ 26 ต.ค. 2026
   ย้ายฐานข้อมูลไป Supabase แล้ว รูปยังเก็บแบบเดิม · ระยะที่ 4 (docs/SUPABASE-MIGRATION.md)
   จะย้ายรูปไป Supabase Storage — ตอนนั้นค่อยเพิ่มการอัปโหลดในไฟล์นี้ (ทุกจุดเรียกผ่านที่นี่)
   พารามิเตอร์ folder / preset เก็บไว้ให้ระยะที่ 4 ใช้ */
const FALLBACK_PRESET = { maxDim: 1000, quality: 0.75 };

/**
 * บีบอัดรูป → คืน data URL
 * อ่านไฟล์ไม่ได้ (เช่น HEIC จาก iPhone) → โยน Error ข้อความภาษาไทยให้ช่องแนบรูปแสดง
 */
// eslint-disable-next-line no-unused-vars
export async function compressAndUploadPhoto(file, folder = 'condition-photos', preset = FALLBACK_PRESET) {
  if (!file) return null;
  return await compressImage(file, FALLBACK_PRESET);
}

/**
 * บีบอัดหลายรูปพร้อมกัน
 * รูปที่อ่านไม่ได้ถูกข้าม (เดิม 1 รูปพัง = ทั้งชุดหาย) — failed บอกจำนวนที่ข้าม
 */
export async function compressAndUploadPhotos(files, folder = 'condition-photos', preset = FALLBACK_PRESET) {
  const arr = Array.from(files || []);
  const results = await Promise.allSettled(arr.map((f) => compressAndUploadPhoto(f, folder, preset)));
  const urls = results.map((r) => (r.status === 'fulfilled' ? r.value : null));
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length) console.warn('[uploadPhoto] skipped', failed.length, failed[0].reason?.message);
  urls.failed = failed.length;
  urls.error = failed[0]?.reason?.message || '';
  return urls;
}
