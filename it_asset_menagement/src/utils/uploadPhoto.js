// 🆕 Helper สำหรับอัพโหลดรูปประเมินสภาพ
// - ถ้า Firebase Storage เปิดใช้แล้ว → อัพโหลดไป Storage (ไม่จำกัดขนาด)
// - ถ้ายังไม่ได้เปิด → fallback เป็น base64 (จำกัด 1MB/doc)
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase.js';
import { compressImage, CONDITION_PRESET } from './compressImage.js';

// preset สำหรับ fallback base64 (เล็กกว่า Storage เพื่อกัน 1MB)
const FALLBACK_PRESET = { maxDim: 1000, quality: 0.75 };

// timeout สำหรับ Storage (Storage ที่ยังไม่ได้เปิดอาจจะค้าง — 8 วิพอ)
const STORAGE_TIMEOUT_MS = 8000;

// 🆕 flag caching — พอ Storage ล้มครั้งแรก จะไม่ลองอีก (ไม่ต้องรอ timeout ทุกรูป)
let storageDisabled = false;

function withTimeout(promise, ms, tag) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${tag} timeout after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * บีบอัดรูป → อัพโหลดไป Storage → คืน URL
 * ถ้า Storage ล้มเหลว/timeout → fallback เป็น base64
 */
export async function compressAndUploadPhoto(file, folder = 'condition-photos', preset = CONDITION_PRESET) {
  if (!file) return null;

  // ถ้า Storage เคยล้มแล้ว → ข้ามไป base64 เลย (ไม่ต้องรอ timeout)
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
 */
export async function compressAndUploadPhotos(files, folder = 'condition-photos', preset = CONDITION_PRESET) {
  const arr = Array.from(files || []);
  return Promise.all(arr.map((f) => compressAndUploadPhoto(f, folder, preset)));
}
