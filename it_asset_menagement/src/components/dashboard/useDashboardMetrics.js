import { useMemo } from 'react';

/* ════════════════════════════════════════════════════════════════
   สรุปตัวเลขทั้งหมดของหน้า Dashboard ไว้ที่เดียว

   แยกการ "คำนวณ" ออกจากการ "แสดงผล" โดยตั้งใจ — คอมโพเนนต์ข้างล่าง
   จึงไม่มี business logic เลย และตัวเลขทุกตัวทดสอบ/แก้ได้จากไฟล์เดียว

   รูปร่างข้อมูลอ้างอิงจากที่ใช้จริงในระบบ:
     assets      { type, status, cost, assetGroup?, assignedName }
     licenses    { name, quantity, assignees[], cost, expirationDate }
     accessories { quantity, assignees[], brokenQuantity, cost }
     employees   { department }
     repairs     { assetName, empName, department, issue, status, timestamp }
   ════════════════════════════════════════════════════════════════ */

const BROKEN = ['ชำรุดเสียหาย', 'ไม่สามารถใช้งานได้'];
const REPAIR_OPEN = ['รอดำเนินการ', 'กำลังดำเนินการ'];

/* จำนวนวันก่อนหมดอายุที่ถือว่า "ใกล้หมด" */
const EXPIRING_DAYS = 60;

const sum = (list, pick) => list.reduce((n, item) => n + (Number(pick(item)) || 0), 0);

export default function useDashboardMetrics({
  assets = [], licenses = [], accessories = [], employees = [], repairs = [],
}) {
  return useMemo(() => {
    /* ครุภัณฑ์สำนักงานแยกเมนูของตัวเอง — ไม่นับรวมกับทรัพย์สินหลัก */
    const main = assets.filter(a => a.assetGroup !== 'office');
    const furniture = assets.filter(a => a.assetGroup === 'office');

    const countBy = (status) => main.filter(a => (a.status || 'พร้อมใช้งาน') === status).length;
    const status = {
      'ถูกใช้งาน': countBy('ถูกใช้งาน'),
      'พร้อมใช้งาน': main.filter(a => !a.status || a.status === 'พร้อมใช้งาน').length,
      'สำรอง': countBy('สำรอง'),
      'รอดำเนินการ': countBy('รอดำเนินการ'),
      'ชำรุดเสียหาย': main.filter(a => BROKEN.includes(a.status)).length,
      'ตัดจำหน่าย': countBy('ตัดจำหน่าย'),
    };

    /* มูลค่า — แยก "เฉพาะทรัพย์สิน" ออกจาก "รวมทุกอย่าง" เพราะ license กับ
       อุปกรณ์เสริมไม่มีฟิลด์บริษัท จึงกรองตามบริษัทไม่ได้ หน้าจอต้องเลือกใช้
       ตัวที่ตรงกับขอบเขตที่ผู้ใช้กรองอยู่ ไม่งั้นตัวเลขจะผสมกันจนอ่านผิด */
    const assetValue = sum(assets, a => a.cost);
    const totalValue =
      assetValue +
      sum(licenses, l => l.cost) +
      sum(accessories, a => (Number(a.cost) || 0) * (Number(a.quantity) || 0));

    /* สัดส่วนตามประเภท — เรียงจากมากไปน้อย เก็บ 5 อันดับแรก ที่เหลือยุบเป็น "อื่นๆ" */
    const perType = new Map();
    main.forEach(a => {
      const key = a.type?.trim() || 'ไม่ระบุประเภท';
      perType.set(key, (perType.get(key) || 0) + 1);
    });
    const sorted = [...perType.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    const top = sorted.slice(0, 5);
    const restCount = sorted.slice(5).reduce((n, t) => n + t.count, 0);
    const byType = restCount > 0 ? [...top, { type: 'อื่นๆ', count: restCount }] : top;

    /* License ที่ใกล้หมดอายุ */
    const today = new Date();
    const expiring = licenses.filter(l => {
      if (!l.expirationDate) return false;
      const days = Math.ceil((new Date(l.expirationDate) - today) / 86400000);
      return days >= 0 && days <= EXPIRING_DAYS;
    }).length;

    const accBroken = sum(accessories, a => a.brokenQuantity);
    const openRepairs = repairs.filter(r => REPAIR_OPEN.includes(r.status));

    /* แสดงเฉพาะเรื่องที่ต้องลงมือทำ — ไม่มีเรื่องต้องดูแล = ไม่ต้องขึ้นแถบนี้ */
    const attention = [
      { key: 'broken',   label: 'ทรัพย์สินชำรุด',   value: status['ชำรุดเสียหาย'], unit: 'รายการ' },
      { key: 'accBroken',label: 'อุปกรณ์เสริมชำรุด', value: accBroken,             unit: 'ชิ้น'   },
      { key: 'expiring', label: `License ใกล้หมดอายุ (${EXPIRING_DAYS} วัน)`, value: expiring, unit: 'รายการ' },
    ].filter(a => a.value > 0);

    return {
      assetCount: main.length,
      furnitureCount: furniture.length,
      employeeCount: employees.length,
      availableCount: status['พร้อมใช้งาน'],
      openRepairCount: openRepairs.length,
      assetValue,
      totalValue,
      status,
      byType,
      attention,
      /* งานซ่อมที่ยังค้าง — ใหม่สุดก่อน จำกัด 5 รายการให้หน้าจอไม่แน่น */
      recentRepairs: [...openRepairs]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5),
    };
  }, [assets, licenses, accessories, employees, repairs]);
}
