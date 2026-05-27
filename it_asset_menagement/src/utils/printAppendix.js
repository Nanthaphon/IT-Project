/* ════════════════════════════════════════════════════════════════════════
   ภาคผนวก IT-POL-LAP-001 Rev.01 — ใช้ร่วมกันทั้ง IT-FORM-001 และ IT-FORM-002
   ════════════════════════════════════════════════════════════════════════ */

import { DAMAGE_FEE_TABLE } from './printHandoverForm.js';

const fmtTHB = (n) => (n || n === 0) ? `${Number(n).toLocaleString('th-TH')}` : '-';

const appendixBar = (n, label) => `
  <div style="background:#475569;color:#fff;padding:5px 12px;font-size:11px;font-weight:700;margin:10px 0 5px;border-radius:3px">
    ส่วนที่ ${n} — ${label}
  </div>`;

export function renderAppendix({ employeeName = '', docNo = '', thDate = '', companyInfo = null } = {}) {
  // ── ใช้ชื่อบริษัทตามที่ส่งมา (จาก employee.company) — fallback เป็น Globe Syndicate ──
  const companyNameTh = companyInfo?.nameTh || 'บริษัท โกลบ ซินดิเคท (ประเทศไทย) จำกัด';
  // ── Build fee rows from shared table ──
  const feeRows = DAMAGE_FEE_TABLE.map(row => {
    if (row.group) {
      return `<tr style="background:#f1f5f9"><td colspan="6" style="border:1px solid #cbd5e1;padding:4px 8px;font-size:10.5px;font-weight:700;color:#1E487A">${row.group}</td></tr>`;
    }
    const [no, name, gen, data, gx, note] = row;
    const cellVal = (v) => typeof v === 'number' ? fmtTHB(v) : v;
    return `
      <tr>
        <td style="border:1px solid #cbd5e1;padding:3px 6px;text-align:center;font-size:10px">${no}</td>
        <td style="border:1px solid #cbd5e1;padding:3px 6px;font-size:10px">${name}</td>
        <td style="border:1px solid #cbd5e1;padding:3px 6px;text-align:right;font-size:10px;font-variant-numeric:tabular-nums">${cellVal(gen)}</td>
        <td style="border:1px solid #cbd5e1;padding:3px 6px;text-align:right;font-size:10px;font-variant-numeric:tabular-nums">${cellVal(data)}</td>
        <td style="border:1px solid #cbd5e1;padding:3px 6px;text-align:right;font-size:10px;font-variant-numeric:tabular-nums">${cellVal(gx)}</td>
        <td style="border:1px solid #cbd5e1;padding:3px 6px;font-size:9.5px;color:#000">${note || ''}</td>
      </tr>`;
  }).join('');

  return `
  <!-- ════════════════════════════════════════════════ -->
  <!--          ภาคผนวก — รายละเอียดแนบท้าย               -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">
    <div style="text-align:center;margin-bottom:8px;padding-top:6px">
      <div style="font-size:15px;font-weight:700;color:#1E487A">รายละเอียดแนบท้าย</div>
      <div style="font-size:11px;color:#000">เอกสารส่งมอบและรับคืนทรัพย์สิน IT &nbsp;|&nbsp; IT-FORM-001 &amp; IT-FORM-002</div>
      <div style="font-size:10.5px;color:#000">อ้างอิง: IT-POL-LAP-001 Rev.01 &nbsp;|&nbsp; ${companyNameTh}</div>
    </div>

    ${appendixBar(1, 'วัตถุประสงค์และขอบเขต')}
    <div style="border:1px solid #cbd5e1;padding:8px 12px;border-radius:3px;font-size:11px;line-height:1.7">
      เอกสารแนบท้ายฉบับนี้เป็นส่วนหนึ่งของ IT-FORM-001 (ใบส่งมอบทรัพย์สิน) และ IT-FORM-002 (ใบรับคืนทรัพย์สิน) มีผลบังคับใช้เมื่อพนักงานลงนามในเอกสารฉบับใดฉบับหนึ่ง รายละเอียดแนบท้ายนี้อธิบายเกณฑ์การประเมิน วิธีคำนวณค่าปรับ ข้อยกเว้น และขั้นตอนการโต้แย้งอย่างครบถ้วน เพื่อให้พนักงานทราบสิทธิ์และหน้าที่ของตนก่อนลงนาม
    </div>

    ${appendixBar(2, 'ประเภทและมูลค่าทรัพย์สิน (Tier Classification)')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">Tier</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">กลุ่มผู้ใช้</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">สเปคหลัก</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">RAM</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">SSD</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">GPU</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">มูลค่าอ้างอิง (THB)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700">General</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">HR / บัญชี / ทั่วไป / Sale</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Core i5 U-Series / Ryzen 5 U</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">16 GB</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">512 GB</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">Integrated</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:right;font-size:10.5px">~25,000</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700">Data</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">BD / Data Analytics</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Core i7 H-Series / Ryzen 7 H</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">32 GB</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">1 TB</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">Integrated</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:right;font-size:10.5px">30,000-40,000</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700">Graphic/DX</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">DX — 3D / Rendering</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Core i7/i9 HX / Ryzen 7/9 H</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">32-64 GB</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">1 TB</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">RTX 4060/4070</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:right;font-size:10.5px">45,000-60,000</td></tr>
      </tbody>
    </table>

    ${appendixBar(3, 'เกณฑ์การให้คะแนนรายหมวด')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:38px">หมวด</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">รายการ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">เต็ม (ปกติ)</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">หัก 50%</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">0 คะแนน</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:42px">เต็ม</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">1</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">สภาพตัวเครื่อง</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ไม่มีรอย / ครบ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">รอยเล็กน้อย / บุบเล็กน้อย</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">แตก / บุบมาก / สติ๊กเกอร์หาย</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">20</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">2</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">จอภาพ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ไม่มีรอย Dead Pixel ≤3</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Dead Pixel 4-10 / Backlight</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">จอแตก / Dead Pixel &gt;10</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">20</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">3</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">คีย์บอร์ด/Touchpad</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ครบ / ตอบสนองปกติ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">หัก 1-5 ปุ่ม / Touchpad ช้า</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">หักหลายปุ่ม / Touchpad เสีย</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">15</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">4</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">OS/ซอฟต์แวร์</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Activated / ครบ / สะอาด</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Software บางตัวหาย / Update ค้าง</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ไม่ Activate / มี Malware</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">20</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">5</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ประสิทธิภาพ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ระบายดี / บูตเร็ว / SSD ปกติ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">พัดลมดัง / Boot ช้า / พื้นที่น้อย</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ร้อนจัด / ระบบค้าง / SSD เสีย</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">15</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">6</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">อุปกรณ์เสริม/พอร์ต</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">พอร์ตครบ / Charger ครบ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">พอร์ต 1 จุดเสีย / Charger หัก</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">หลายพอร์ตเสีย / Charger หาย</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">10</td></tr>
      </tbody>
    </table>

    ${appendixBar(4, 'ระดับเกรดและผลที่ตามมา')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:45px">เกรด</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:75px">ช่วงคะแนน</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">สถานะ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">ค่าปรับ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">การดำเนินการ</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700;color:#16a34a">A</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">90 – 100</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ดีเยี่ยม</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ไม่มีค่าปรับ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">คืนอุปกรณ์และปิดเรื่องได้ทันที</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700;color:#2563eb">B</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">75 – 89</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ผ่าน (มีรอยเล็กน้อย)</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ตามความเสียหายจริง</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">IT ระบุรายการเสียหาย พร้อมใบประเมินราคาซ่อม</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700;color:#d97706">C</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">60 – 74</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ต้องซ่อม</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">หักตามตารางค่าปรับ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">IT ส่งใบเสนอราคา / HR อนุมัติการหักเงิน</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700;color:#dc2626">D</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">&lt; 60</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">เสียหายหนัก</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">หักเต็มตามราคาตลาด</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ประชุม IT + HR + ผู้บังคับบัญชา ก่อนดำเนินการ</td></tr>
      </tbody>
    </table>

  </div>

  <!-- ════════════════════════════════════════════════ -->
  <!--          ภาคผนวก หน้า 2 — ค่าปรับ + ข้อยกเว้น        -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">

    ${appendixBar(5, 'ตารางค่าปรับความเสียหายฉบับเต็ม')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:38px">ลำดับ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">ประเภทความเสียหาย</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:80px">General<br/>~25K</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:80px">Data<br/>~35K</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:90px">Graphic/DX<br/>~55K</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:120px">หมายเหตุ</th>
        </tr>
      </thead>
      <tbody>${feeRows}</tbody>
    </table>
    <div style="font-size:9.5px;color:#000;margin-top:4px">* ค่าปรับใช้ราคาในตารางเป็นขั้นต่ำ หากราคาซ่อมจริงสูงกว่าให้ใช้ราคาตามใบเสนอราคา</div>
    <div style="margin-top:6px;padding:7px 10px;background:#fffbeb;border:1px solid #fcd34d;border-radius:3px;font-size:10px;line-height:1.65;color:#78350f">
      <b>หมายเหตุ:</b> ตัวเลขที่ระบุในตารางค่าปรับเป็นราคาอ้างอิงเบื้องต้น (Preliminary Reference Price) ไม่ถือเป็นค่าใช้จ่ายที่ผูกพันทางสัญญา ค่าใช้จ่ายที่แท้จริงจะกำหนดตามใบเสนอราคาจากผู้ให้บริการซ่อมที่ได้รับการอนุมัติจากบริษัท และจะแจ้งให้พนักงานรับทราบเป็นลายลักษณ์อักษรก่อนดำเนินการหักเงินทุกกรณี
    </div>

    ${appendixBar(6, 'ข้อยกเว้นการหักค่าเสียหาย')}
    <div style="border:1px solid #cbd5e1;padding:8px 14px;border-radius:3px;font-size:10.5px;line-height:1.85">
      <div style="font-weight:700;margin-bottom:4px">รายการต่อไปนี้ได้รับการยกเว้นจากการหักค่าเสียหาย:</div>
      <div>1. การเสื่อมสภาพตามอายุการใช้งานปกติ เช่น สีซีดเล็กน้อยจากการใช้งาน รอยถูบนฐานเครื่องที่เกิดจากการวางบนโต๊ะ</div>
      <div>2. รอยแตกร้าวที่เกิดจากข้อบกพร่องของผู้ผลิต (Manufacturing Defect) โดยต้องผ่านการยืนยันจากศูนย์บริการ</div>
      <div>3. Dead Pixel ที่มีอยู่ตั้งแต่ก่อนส่งมอบ และถูกบันทึกไว้ในขา 1 (IT-FORM-001) ก่อนลงนาม</div>
      <div>4. ความเสียหายที่เกิดจากเหตุสุดวิสัย เช่น ภัยธรรมชาติ โดยต้องมีหลักฐานประกอบ</div>
      <div>5. การชำรุดเสียหายที่ผ่านการซ่อมโดย IT แผนกและมีบันทึกการซ่อมอยู่แล้ว</div>
    </div>

  </div>

  <!-- ════════════════════════════════════════════════ -->
  <!--          ภาคผนวก หน้า 3 — ขั้นตอน + ลายเซ็น         -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">

    ${appendixBar(7, 'ขั้นตอนการโต้แย้งผลการประเมิน')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:50px">ขั้นตอน</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:170px">ผู้รับผิดชอบ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:120px">ระยะเวลา</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">รายละเอียด</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">1</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">พนักงาน</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ภายใน 3 วันทำการ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ยื่นคำร้องโต้แย้งเป็นลายลักษณ์อักษรต่อ IT Manager พร้อมหลักฐานภาพถ่าย</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">2</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">IT Manager</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ภายใน 5 วันทำการ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">รวบรวมหลักฐาน ภาพถ่ายจากทั้ง 2 ขา และให้ความเห็นเบื้องต้น</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">3</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">HR + IT + ผู้บังคับบัญชา</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ภายใน 7 วันทำการ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ประชุมตัดสินร่วม 3 ฝ่าย ผลการตัดสินถือเป็นที่สิ้นสุด</td></tr>
      </tbody>
    </table>

    ${appendixBar(8, 'ขั้นตอนกรณีออกพนักงาน / สิ้นสุดสัญญาจ้าง')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:200px">ผู้รับผิดชอบ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">การดำเนินการ</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">พนักงาน / ผู้บังคับบัญชา</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">แจ้ง IT ล่วงหน้าอย่างน้อย 3 วันทำการก่อนวันสิ้นสุดสัญญาจ้าง เพื่อนัดหมายการรับคืนอุปกรณ์</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">เจ้าหน้าที่ IT</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ดำเนินการประเมินสภาพตาม IT-FORM-002 พร้อมถ่ายภาพ และจัดทำสรุปค่าปรับ (ถ้ามี) ภายใน 1 วันทำการ</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">แผนกบุคคล (HR)</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">รับเอกสาร IT-FORM-002 จาก IT และลงนามรับทราบก่อนออกเอกสาร Clearance / คำนวณการหักเงิน</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">การเงิน</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">หักค่าเสียหาย (ถ้ามี) จากเงินเดือนงวดสุดท้าย หรือเรียกเก็บตามข้อตกลง ภายใน 30 วัน</td></tr>
      </tbody>
    </table>

    ${appendixBar(9, 'การคำนวณค่าปรับตามอายุการใช้งาน')}
    <div style="border:1px solid #cbd5e1;padding:10px 14px;border-radius:3px;font-size:11px;line-height:1.85">
      <div style="font-weight:700;margin-bottom:4px">การคำนวณค่าปรับตามอายุการใช้งาน (Depreciation Policy)</div>
      <div>บริษัทกำหนดนโยบายค่าปรับตามอายุการใช้งานของอุปกรณ์ IT ดังนี้:</div>
      <div style="margin-top:6px;padding:6px 10px;background:#f8fafc;border-left:3px solid #1E487A">
        <div style="font-weight:600;margin-bottom:3px">General / Data / Graphic-DX : อายุอ้างอิง 3 ปีนับจากวันที่ลงนามรับมอบ</div>
        <div>• อายุ 0 - 1 ปี &nbsp;: คิดค่าปรับ <b>100%</b> ของตารางค่าปรับ</div>
        <div>• อายุ 1 - 2 ปี &nbsp;: คิดค่าปรับ <b>75%</b> ของตารางค่าปรับ</div>
        <div>• อายุ 2 - 3 ปี &nbsp;: คิดค่าปรับ <b>50%</b> ของตารางค่าปรับ</div>
        <div>• อายุเกิน 3 ปี : <b>ไม่คิดค่าปรับ</b>ทุกกรณี</div>
      </div>
      <div style="margin-top:6px">นโยบายนี้ครอบคลุมทุกกรณี ได้แก่ ความเสียหายทางกายภาพ การสูญหาย น้ำเข้า และการถูกโจรกรรม</div>
      <div style="font-size:10px;color:#000;margin-top:4px">* อายุอุปกรณ์นับจากวันที่ IT-FORM-001 ลงนาม ถึงวันที่ IT-FORM-002 ลงนาม</div>
    </div>

    ${appendixBar(10, 'ลายมือชื่อรับทราบนโยบายและเงื่อนไข')}
    <table>
      <tr>
        <td style="border:1px solid #000;padding:14px 16px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:3px">พนักงาน</div>
          <div style="font-size:10.5px;color:#000;margin-bottom:6px">รับทราบและยอมรับเงื่อนไขทั้งหมด</div>
          <div style="border-bottom:1px solid #000;margin:34px 14px 6px"></div>
          <div style="font-size:11.5px;font-weight:700">( ${employeeName || '.....................................'} )</div>
          <div style="font-size:11px;margin-top:6px">วันที่ .....................................</div>
        </td>
        <td style="border:1px solid #000;padding:14px 16px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:3px">เจ้าหน้าที่ IT (ตัวแทน)</div>
          <div style="font-size:10.5px;color:#000;margin-bottom:6px">รับทราบและยอมรับเงื่อนไขทั้งหมด</div>
          <div style="border-bottom:1px solid #000;margin:34px 14px 6px"></div>
          <div style="font-size:11.5px;font-weight:700">( ..................................... )</div>
          <div style="font-size:11px;margin-top:6px">วันที่ .....................................</div>
        </td>
        <td style="border:1px solid #000;padding:14px 16px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:3px">แผนกบุคคล (HR)</div>
          <div style="font-size:10.5px;color:#000;margin-bottom:6px">รับทราบนโยบาย</div>
          <div style="border-bottom:1px solid #000;margin:34px 14px 6px"></div>
          <div style="font-size:11.5px;font-weight:700">( ..................................... )</div>
          <div style="font-size:11px;margin-top:6px">วันที่ .....................................</div>
        </td>
      </tr>
    </table>

    <div style="text-align:center;font-size:10px;color:#000;margin-top:12px">
      ออกโดยระบบ IT Asset Management &nbsp;·&nbsp; ${thDate} &nbsp;·&nbsp; ${docNo}
    </div>

  </div>`;
}
