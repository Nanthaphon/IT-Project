// บีบอัดรูปแล้วอัปโหลดเข้า Supabase Storage ส่วนตัว — คืน stable reference
import { compressImage } from './compressImage.js';
import { uploadPhotoDataUrl } from './privateStorage.js';

// catalog: ภาพรายการสำหรับผู้ใช้ในระบบ · admin: หลักฐาน · staff: เจ้าของเท่านั้น
const FALLBACK_PRESET = { maxDim: 1000, quality: 0.75 };

/**
 * บีบอัดรูป → อัปโหลดส่วนตัว → คืน reference
 * อ่านไฟล์ไม่ได้ (เช่น HEIC จาก iPhone) → โยน Error ข้อความภาษาไทยให้ช่องแนบรูปแสดง
 */
export async function compressAndUploadPhoto(file, folder = 'condition-photos', preset = FALLBACK_PRESET) {
  if (!file) return null;
  const dataUrl = await compressImage(file, preset);
  let target = folder === 'catalog' ? 'catalog/photos' : 'admin/photos';
  if (folder === 'staff-photos') {
    const { supabase } = await import('../db/supabaseClient.js');
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
    target = `staff/${data.user.id}`;
  }
  return uploadPhotoDataUrl(dataUrl, target);
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
