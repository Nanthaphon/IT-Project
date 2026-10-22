/* ย้ายรหัสผ่าน M365 จาก employees/{id}.m365Password → employee_secrets/{id}
   (และถังขยะ deleted_employees ด้วย) แล้วลบฟิลด์เดิมทิ้ง

   ค่าเริ่มต้น = dry-run ดูอย่างเดียว ไม่เขียนอะไร · ใส่ --apply เพื่อเขียนจริง
   ถ้ามี employee_secrets อยู่แล้ว (พนักงาน/IT แก้หลังขึ้นโค้ดใหม่) จะไม่เขียนทับ — ของใหม่ชนะ
   รันซ้ำได้ปลอดภัย: รอบสองจะไม่เจออะไรให้ย้าย

   ฐานข้อมูลจริง:
     $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\service-account.json"
     node scripts/migrate-m365-secrets.mjs            # ดูก่อน
     node scripts/migrate-m365-secrets.mjs --apply    # ย้ายจริง
   emulator:
     $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"; node scripts/migrate-m365-secrets.mjs --apply */
import admin from 'firebase-admin';

const PROJECT = 'it-asset-management-dc883';
const APPLY = process.argv.includes('--apply');
const SOURCES = ['employees', 'deleted_employees'];

admin.initializeApp(process.env.FIRESTORE_EMULATOR_HOST
  ? { projectId: PROJECT }
  : { credential: admin.credential.applicationDefault(), projectId: PROJECT });
const db = admin.firestore();
const { FieldValue } = admin.firestore;

console.log(`${APPLY ? 'APPLY' : 'DRY-RUN'} · ${process.env.FIRESTORE_EMULATOR_HOST ? 'emulator' : 'ฐานข้อมูลจริง'} · ${PROJECT}`);

let moved = 0, skipped = 0, cleared = 0;
for (const col of SOURCES) {
  const snap = await db.collection(col).get();
  const legacy = snap.docs.filter(d => 'm365Password' in d.data());
  console.log(`\n${col}: ${snap.size} เอกสาร · มีฟิลด์ m365Password ${legacy.length}`);

  for (const d of legacy) {
    const value = String(d.data().m365Password ?? '');
    const secretRef = db.collection('employee_secrets').doc(d.id);
    const secret = await secretRef.get();
    const hasNewer = secret.exists && String(secret.data().m365Password ?? '') !== '';
    const label = `  ${d.id} (${d.data().empId || '-'})`;

    if (value && !hasNewer) {
      console.log(`${label}  → ย้ายรหัส`);
      moved++;
    } else {
      console.log(`${label}  → ${value ? 'มีของใหม่แล้ว ไม่เขียนทับ' : 'ค่าว่าง'} · ลบฟิลด์เดิม`);
      skipped++;
    }
    if (!APPLY) continue;

    const batch = db.batch();
    if (value && !hasNewer) {
      batch.set(secretRef, { m365Password: value, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    batch.update(d.ref, { m365Password: FieldValue.delete() });
    await batch.commit();
    cleared++;
  }
}

console.log(`\nสรุป: ย้าย ${moved} · ไม่ต้องย้าย ${skipped} · ลบฟิลด์เดิมแล้ว ${cleared}`);
if (!APPLY) console.log('ยังไม่ได้เขียนอะไร — ใส่ --apply เพื่อย้ายจริง');
