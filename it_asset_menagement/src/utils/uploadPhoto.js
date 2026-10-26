// 🆕 Helper สำหรับอัพโหลดรูปประเมินสภาพ
// - ถ้า Firebase Storage เปิดใช้แล้ว → อัพโหลดไป Storage (ไม่จำกัดขนาด)
// - ถ้ายังไม่ได้เปิด → เก็บเป็น base64 (จำกัด 1MB/doc)
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase.js';
import { compressImage, CONDITION_PRESET } from './compressImage.js';

/* ── Storage ยังไม่ได้เปิด → ข้ามไปเก็บ base64 ทันที ─────────────────────────
   ตรวจแล้ว 26 ต.ค. 2026: bucket "it-asset-management-dc883.firebasestorage.app" (และ .appspot.com)
   ตอบ 404 = ยังไม่เคยสร้าง · Firebase ต้องใช้แพลน Blaze ถึงสร้าง bucket ได้ (ตั้งแต่ปลาย 2024)
   เดิมทุกรูปลอง Storage ก่อน → SDK ลองซ้ำจนครบ timeout 8 วิ แล้วค่อย fallback
   ผู้ใช้เห็นวงหมุนค้างหลายช่องพร้อมกัน (เลือกหลายรูป = รอ 8+ วิทุกช่อง) จนคิดว่าระบบค้าง
   ถ้าวันหนึ่งเปิด Storage (อัปเป็น Blaze + สร้าง bucket + deploy storage.rules) → เปลี่ยนเป็น true */
const STORAGE_ENABLED = false;

// preset สำหรับ base64 (เล็กกว่า Storage เพื่อกัน 1MB/doc)
const FALLBACK_PRESET = { maxDim: 1000, quality: 0.75 };

// timeout สำหรับ Storage (ใช้เมื่อ STORAGE_ENABLED เท่านั้น)
const STORAGE_TIMEOUT_MS = 8000;

// พอ Storage ล้มครั้งแรก จะไม่ลองอีก (ไม่ต้องรอ timeout ทุกรูป)
let storageDisabled = !STORAGE_ENABLED;

function withTimeout(promise, ms, tag) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${tag} timeout after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * บีบอัดรูป → (อัพโหลดไป Storage ถ้าเปิดใช้) → คืน URL หรือ data URL
 * อ่านไฟล์ไม่ได้ (เช่น HEIC จาก iPhone) → โยน Error ข้อความภาษาไทยให้ช่องแนบรูปแสดง
 */
export async function compressAndUploadPhoto(file, folder = 'condition-photos', preset = CONDITION_PRESET) {
  if (!file) return null;

  // Storage ไม่พร้อม → บีบเป็น base64 แล้วจบเลย (ไม่ต้องบีบรอบใหญ่ก่อน)
  if (storageDisabled) {
    return await compressImage(file, FALLBACK_PRESET);
  }

  // 1. บีบเป็น base64 (สำหรับอัพโหลด)
  const dataUrl = await compressImage(file, preset);
  if (!dataUrl) return null;

  // 2. ลองอัพโหลดไป Storage (มี timeout)
  try {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const storageRef = ref(storage, `${folder}/${uniqueName}`);
    await withTimeout(uploadString(storageRef, dataUrl, 'data_url'), STORAGE_TIMEOUT_MS, 'Storage upload');
    return await withTimeout(getDownloadURL(storageRef), STORAGE_TIMEOUT_MS, 'Storage getURL');
  } catch (err) {
    // Storage ไม่พร้อม → จำไว้ว่าไม่ต้องลองอีก + fallback base64
    console.warn('[uploadPhoto] Storage failed, fallback to base64:', err?.message || err);
    storageDisabled = true;
    return await compressImage(file, FALLBACK_PRESET);
  }
}

/**
 * บีบอัด + อัพโหลดหลายรูปพร้อมกัน
 * รูปที่อ่านไม่ได้ถูกข้าม (เดิม 1 รูปพัง = ทั้งชุดหาย) — failed บอกจำนวนที่ข้าม
 */
export async function compressAndUploadPhotos(files, folder = 'condition-photos', preset = CONDITION_PRESET) {
  const arr = Array.from(files || []);
  const results = await Promise.allSettled(arr.map((f) => compressAndUploadPhoto(f, folder, preset)));
  const urls = results.map((r) => (r.status === 'fulfilled' ? r.value : null));
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length) console.warn('[uploadPhoto] skipped', failed.length, failed[0].reason?.message);
  urls.failed = failed.length;
  urls.error = failed[0]?.reason?.message || '';
  return urls;
}
