// บีบขนาดรูปภาพให้เล็กลงก่อนเก็บเป็น base64
// 🆕 ลดขนาด default ลงเพื่อประหยัด Firestore storage
//   - default: 600px, quality 0.55, JPEG → ~30-60KB ต่อรูป
//   - icon preset: 400px, quality 0.7  → ~15-30KB ต่อรูป (สำหรับ icon ทรัพย์สิน/License/อุปกรณ์)
//   - evidence preset: 1000px, quality 0.7 → ~80-120KB (เก็บหลักฐานสภาพ — ใช้กับ ConditionCapture)
/* อ่านรูปไม่ได้ → ข้อความที่ผู้ใช้เข้าใจ (เดิม reject ด้วย Event ดิบ แล้วช่องแนบรูปเงียบไปเฉย ๆ)
   เจอบ่อยสุด: HEIC จาก iPhone — Chrome/Edge บน Windows เปิดไม่ได้ */
const isHeic = (file) => /\.(heic|heif)$/i.test(file?.name || '') || /hei[cf]/i.test(file?.type || '');
const unreadable = (file) => new Error(isHeic(file)
  ? 'ไฟล์ HEIC (iPhone) เปิดไม่ได้ — ตั้งกล้องเป็น "ใช้ได้กับทุกเครื่อง" หรือส่งเป็น JPG'
  : 'อ่านไฟล์รูปนี้ไม่ได้ — ใช้ไฟล์ JPG หรือ PNG');

// กันวงหมุนค้างตลอดไป ถ้าเบราว์เซอร์ไม่ตอบ onload/onerror
const COMPRESS_TIMEOUT_MS = 20000;

export async function compressImage(file, { maxDim = 600, quality = 0.55 } = {}) {
  if (!file) return null;
  if (isHeic(file)) throw unreadable(file);
  return new Promise((resolveRaw, rejectRaw) => {
    const timer = setTimeout(() => rejectRaw(new Error('ประมวลผลรูปนานเกินไป — ลองรูปที่เล็กลง')), COMPRESS_TIMEOUT_MS);
    const resolve = (v) => { clearTimeout(timer); resolveRaw(v); };
    const reject = () => { clearTimeout(timer); rejectRaw(unreadable(file)); };
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // ใช้ JPEG เสมอเพื่อขนาดเล็ก
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// บีบหลายรูปพร้อมกัน
export async function compressImages(files, options) {
  const arr = Array.from(files || []);
  return Promise.all(arr.map((f) => compressImage(f, options)));
}

// 🆕 preset สำหรับ icon รูปทรัพย์สิน/License/อุปกรณ์ (เล็กพิเศษ)
export const ICON_PRESET = { maxDim: 400, quality: 0.7 };
// 🆕 preset สำหรับรูปหลักฐานสภาพ (ต้องการรายละเอียดมากกว่า)
export const EVIDENCE_PRESET = { maxDim: 1000, quality: 0.7 };
// 🆕 preset สำหรับรูปประเมินสภาพอุปกรณ์ (checkout/return) — ต้องการความชัดสูงสุด
//   Full HD width + quality 0.92 → คมชัดใกล้เคียงต้นฉบับ (~250-500KB/รูป)
//   ถ้ารูปต้นฉบับเล็กกว่า 1920px ก็จะไม่ resize (คงต้นฉบับ)
export const CONDITION_PRESET = { maxDim: 1920, quality: 0.92 };

// helper — รวม FileReader + compress สำหรับ image uploader
export async function compressImageToBase64(file, preset = ICON_PRESET) {
  return compressImage(file, preset);
}
