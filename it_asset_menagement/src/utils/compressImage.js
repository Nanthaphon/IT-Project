// บีบขนาดรูปภาพให้เล็กลงก่อนเก็บเป็น base64
// max ~800px ด้านยาวสุด, คุณภาพ 0.6 → ได้ขนาดประมาณ 40-80KB ต่อรูป
// (ลดลงจาก 1024/0.75 เพราะ Firestore document จำกัด 1 MiB/doc และ
//  เราเก็บได้สูงสุด ~14 รูปต่อ transaction หากมีหลายจุด)
export async function compressImage(file, { maxDim = 800, quality = 0.6 } = {}) {
  if (!file) return null;
  return new Promise((resolve, reject) => {
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
