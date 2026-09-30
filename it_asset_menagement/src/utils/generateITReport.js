import PptxGenJS from 'pptxgenjs';
import { formatDateShort } from './formatDate.js';

/* ═══════════════════════════════════
   PALETTE
═══════════════════════════════════ */
const C = {
  blue:      '2B6777',
  blueMid:   '6E97A9',
  blueLight: 'C8D8E4',
  blueRow:   'F1F6F8',   // alternating row tint
  white:     'FFFFFF',
  grayBg:    'F7F9FA',
  grayBorder:'D3DADE',
  grayText:  '64757D',
  green:     '2C5D53',
  greenBg:   'EAF5F2',
  amber:     'A87A2C',
  amberBg:   'FBF4E6',
  red:       'B0453C',
  redBg:     'FEE2E2',
};

const TH_MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
];

const F  = 'Sarabun';    // Thai font
const FE = 'Arial';      // EN/number font — universal install + tight Latin spacing
const REPORT_VERSION = 'v3';  // bump when changing report layout — appears in footer to verify rebuild

/* ─── Language-aware font picker
   Sarabun has Latin glyphs but PowerPoint renders them with extra kerning,
   causing the "spread out English chars" bug. Auto-pick FE for non-Thai text. ─── */
const isThai = (text) => /[฀-๿]/.test(String(text ?? ''));
const fontFor = (text) => isThai(text) ? F : FE;

/* ─── Base sizes ─── */
const BODY_SIZE   = 14;
const HEADER_SIZE = 14;

/* ─── pptxgenjs border object (all 4 sides) ─── */
const bdr = (color = C.grayBorder, pt = 1) =>
  ({ type: 'solid', pt, color });

/* ─── Table cell factory ─── */
const cell = (text, opts = {}) => ({
  text: String(text ?? '–'),
  options: {
    fontSize: BODY_SIZE,
    fontFace: fontFor(text),   // 🆕 auto-pick font by language
    valign: 'middle',
    border: bdr(),
    charSpacing: 0,
    autoFit: false,
    ...opts,
  },
});
const cellC  = (text, opts = {}) => cell(text, { align: 'center', fontFace: FE, ...opts });
const cellN  = (text, opts = {}) => cellC(text, { bold: true, ...opts });
const cellH  = (text, opts = {}) => cell(text, {
  fill: { color: C.blue },
  color: C.white,
  bold: true,
  fontSize: HEADER_SIZE,
  align: 'center',
  border: bdr(C.blueMid, 1),
  ...opts,
});

/* ─── Alternating row fill ─── */
const rowFill = (i) => ({ fill: { color: i % 2 === 0 ? C.white : C.blueRow } });

/* แถว "รวม" ท้ายตาราง — หัวหน้าอ่านบรรทัดเดียวก็เห็นยอดรวม
   ไม่ต้องบวกเลขในหัวเองจากหลายสิบแถว
   cells = [{ text, align }] เรียงตามคอลัมน์ */
const totalRow = (cells) => cells.map((c) => ({
  text: String(c.text ?? ''),
  options: {
    fontSize: 14, bold: true, fontFace: c.align === 'left' ? fontFor(c.text) : FE,
    align: c.align || 'center', valign: 'middle', color: C.blue,
    fill: { color: C.blueLight }, border: bdr(C.blueMid, 1), charSpacing: 0,
  },
}));

/* ─── Status color helper ─── */
const statusOpts = (s = '') => {
  if (s.toLowerCase().includes('complete') || s.includes('สำเร็จ'))
    return { color: C.green };
  if (s.toLowerCase().includes('progress') || s.includes('ดำเนินการ'))
    return { color: C.amber };
  if (s.toLowerCase().includes('cancel') || s.includes('ยกเลิก'))
    return { color: C.red };
  return { color: C.grayText };
};

/* ─── Resolve short display name for an employee ─── */
const getShortName = (empId, employees, fallbackName) => {
  if (!empId && !fallbackName) return '';
  const emp = employees.find(e => e.id === empId || e.empId === empId);
  if (emp) return emp.nickname || emp.fullName?.split(' ')[0] || '';
  if (fallbackName) return fallbackName.split(' ')[0] || '';
  return '';
};

/* ─── Format holder list: show up to max names, then "+N" ─── */
const formatHolders = (names, max = 6) => {
  const unique = [...new Set(names.filter(Boolean))];
  if (unique.length === 0) return '–';
  if (unique.length <= max) return unique.join(', ');
  return unique.slice(0, max).join(', ') + ` +${unique.length - max}`;
};

/* ─── ประเมินความสูงแถวจากข้อความยาว (สำหรับคอลัมน์ผู้ถือครองที่โชว์ครบทุกชื่อ) ─── */
const estimateRowH = (text, colWin, fontSize = 9, minH = 0.62) => {
  if (!text || text === '–') return minH;
  const avgCharW = fontSize * 0.0085;                        // นิ้ว/ตัวอักษร (เผื่อกว้าง)
  const charsPerLine = Math.max(8, Math.floor((colWin - 0.15) / avgCharW));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  const lineH = (fontSize / 72) * 1.55;                      // line-spacing ~1.55x
  return Math.max(minH, lines * lineH + 0.18);               // + padding บน-ล่าง
};

/* ─── Forward decl (assigned just below) ─── */
let addHeader, addFooter;

/* ─── Footer bar ─── */
addFooter = (pptx, slide, pageNum, month, year, company) => {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.15, w: 13.33, h: 0.06,
    fill: { color: C.blue }, line: { color: C.blue },
  });
  // Split runs so English uses FE (Calibri) and Thai uses F (Sarabun) — fixes spread chars
  slide.addText(
    [
      { text: `${company}  |  รายงานผล IT – `,     options: { color: 'AAAAAA', fontFace: F  } },
      { text: `${TH_MONTHS[month]} `,              options: { color: 'AAAAAA', fontFace: F  } },
      { text: String(year + 543),                  options: { color: 'AAAAAA', fontFace: FE } },
      { text: `   ${pageNum}`,                     options: { color: C.blue, bold: true, fontFace: FE } },
      { text: `   (${REPORT_VERSION})`,             options: { color: 'CCCCCC', fontFace: FE } },
    ],
    { x: 0.4, y: 7.22, w: 12.53, h: 0.22, fontSize: 9, align: 'right', charSpacing: 0 },
  );
};

/* ─── Pagination ─── */
const rowsPerSlide = (rowH) =>
  Math.max(1, Math.floor(6.0 / rowH) - 1);

/* ─── Render a (possibly multi-slide) table with auto-pagination ─── */
function addPaginatedTableSlides(pptx, ctx, {
  titleTh, titleEn, startPageNum,
  hdr, rows, colW, rowH, tableY = 1.15,
  emptyRow, rowHeights,   // 🆕 rowHeights: array ความสูงต่อแถว (ถ้ามี = แบ่งหน้าตามความสูง)
}) {
  const useVariable = Array.isArray(rowHeights) && rowHeights.length === rows.length && rows.length > 0;
  const all = (rows.length === 0 && emptyRow) ? [emptyRow] : rows;

  const headerH = typeof rowH === 'number' ? rowH : 0.5;
  const AVAIL = 6.0 - headerH;   // ความสูงที่ใช้ได้สำหรับแถวข้อมูลต่อสไลด์

  const chunks = [];
  const chunkHeights = [];   // parallel กับ chunks (เฉพาะ variable mode)

  if (useVariable) {
    let cur = [], curH = [], acc = 0;
    for (let i = 0; i < all.length; i++) {
      const h = Math.min(rowHeights[i], AVAIL);   // กันแถวเดียวสูงเกินสไลด์
      if (cur.length > 0 && acc + h > AVAIL) {
        chunks.push(cur); chunkHeights.push(curH);
        cur = []; curH = []; acc = 0;
      }
      cur.push(all[i]); curH.push(h); acc += h;
    }
    if (cur.length) { chunks.push(cur); chunkHeights.push(curH); }
  } else {
    const per = rowsPerSlide(rowH);
    for (let i = 0; i < all.length; i += per) chunks.push(all.slice(i, i + per));
  }
  if (chunks.length === 0) { chunks.push([]); chunkHeights.push([]); }

  chunks.forEach((chunk, p) => {
    const s = pptx.addSlide();
    s.background = { color: C.white };
    const suffix = chunks.length > 1 ? `  (${p + 1}/${chunks.length})` : '';
    addHeader(pptx, s, titleTh + suffix, titleEn);
    const rowHOpt = useVariable ? [headerH, ...chunkHeights[p]] : rowH;
    s.addTable([hdr, ...chunk], {
      x: 0.4, y: tableY, w: 12.53, colW, rowH: rowHOpt,
      border: bdr(C.grayBorder, 1),
    });
    addFooter(pptx, s, startPageNum + p, ctx.month, ctx.year, ctx.company);
  });

  return chunks.length;
}

/* ─── Header bar ─── */
addHeader = (pptx, slide, titleTh, titleEn = '') => {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 1.0,
    fill: { color: C.blue }, line: { color: C.blue },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 1.0, w: 13.33, h: 0.07,
    fill: { color: C.blueLight }, line: { color: C.blueLight },
  });
  slide.addText(titleTh, {
    x: 0.45, y: 0.05, w: 9, h: 0.58,
    fontSize: 26, bold: true, color: C.white, fontFace: fontFor(titleTh), valign: 'middle', charSpacing: 0,
  });
  if (titleEn) {
    slide.addText(titleEn, {
      x: 0.45, y: 0.58, w: 9, h: 0.38,
      fontSize: 14, italic: true, color: 'B0C8E0', fontFace: fontFor(titleEn), valign: 'top', charSpacing: 0,
    });
  }
};

/* ═══════════════════════════════════
   SLIDE 1 – COVER
═══════════════════════════════════ */
function slide1(pptx, { month, year, company, reportDate }) {
  const s = pptx.addSlide();

  s.addShape(pptx.ShapeType.rect, { x:0, y:0, w:13.33, h:7.5, fill:{ color: C.blue }, line:{ color: C.blue } });
  s.addShape(pptx.ShapeType.rect, { x:0, y:5.6, w:13.33, h:0.12, fill:{ color: C.blueLight }, line:{ color: C.blueLight } });
  s.addShape(pptx.ShapeType.rect, { x:0, y:5.72, w:13.33, h:1.78, fill:{ color: '225462' }, line:{ color: '225462' } });

  s.addText(company.toUpperCase(), {
    x:0.8, y:1.6, w:11.73, h:0.9,
    fontSize: 28, bold: true, color: C.blueLight, align:'center', fontFace: FE, charSpacing: 0,
  });
  s.addShape(pptx.ShapeType.rect, { x:3.5, y:2.65, w:6.33, h:0.05, fill:{ color: C.blueLight }, line:{ color: C.blueLight } });
  s.addText('รายงานผลการดำเนินงาน IT', {
    x:0.8, y:2.8, w:11.73, h:0.9,
    fontSize: 40, bold: true, color: C.white, align:'center', fontFace: F, charSpacing: 0,
  });
  s.addText(
    [
      { text: `เดือน${TH_MONTHS[month]}  `, options: { color: C.blueLight, fontFace: F  } },
      { text: String(year + 543),            options: { color: C.blueLight, fontFace: FE } },
    ],
    { x:0.8, y:3.72, w:11.73, h:0.75, fontSize: 32, bold: true, align:'center', charSpacing: 0 },
  );
  s.addText(reportDate, {
    x:0.8, y:4.6, w:11.73, h:0.5,
    fontSize: 17, color: '90B4CC', align:'center', fontFace: F, charSpacing: 0,
  });
  s.addText('รายงานผลการดำเนินงานฝ่าย IT ประจำเดือน', {
    x:0.8, y:6.0, w:11.73, h:0.45,
    fontSize: 14, italic: true, color: C.blueLight, align:'center', fontFace: F, charSpacing: 0,
  });
}

/* ═══════════════════════════════════
   SLIDE 2 – AGENDA
═══════════════════════════════════ */
function slide2(pptx, { month, year, company, reportDate }) {
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addHeader(pptx, s, 'สารบัญ');

  const items = [
    { num:'01', th:'สรุปผลการดำเนินงานฝ่ายสนับสนุน',  en:'ภาพรวมงานสนับสนุน' },
    { num:'02', th:'เคสแจ้งซ่อม / แจ้งปัญหา',          en:'เคสที่รับแจ้งในเดือนนี้' },
    { num:'03', th:'สรุปผลฮาร์ดแวร์และซอฟต์แวร์',      en:'รายการทรัพย์สินในระบบ' },
    { num:'04', th:'สรุปภาพรวมสถานะโปรเจค R&D',       en:'สถานะโปรเจควิจัยและพัฒนา' },
    { num:'05', th:'วาระติดตาม',                       en:'รายการติดตามงาน' },
  ];

  /* 5 หัวข้อ -> 2 คอลัมน์ 3 แถว การ์ดเตี้ยลงจาก 2.35 เป็น 1.78 */
  items.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.4 + col * 6.5, y = 1.25 + row * 1.98, w = 6.1, h = 1.78;

    s.addShape('roundRect', { x, y, w, h,
      fill:{ color: 'EEF4FB' }, line:{ color: C.blueLight, width: 2 }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.rect, { x, y, w:0.15, h,
      fill:{ color: C.blue }, line:{ color: C.blue } });

    s.addText(it.num, { x:x+0.3, y:y+0.1, w:1.5, h:0.6,
      fontSize: 32, bold: true, color: C.blue, fontFace: FE, charSpacing: 0 });
    s.addText(it.th,  { x:x+0.3, y:y+0.68, w:w-0.5, h:0.55,
      fontSize: 15, bold: true, color: C.blue, fontFace: F, charSpacing: 0 });
    s.addText(it.en,  { x:x+0.3, y:y+1.2,  w:w-0.5, h:0.42,
      fontSize: 11, italic: true, color: C.grayText, fontFace: F, charSpacing: 0 });
  });

  s.addText(`อัพเดท: ${reportDate}`, {
    x:0.4, y:7.2, w:5, h:0.22, fontSize:9, color: C.grayText, fontFace: F, charSpacing: 0 });
  addFooter(pptx, s, 2, month, year, company);
}

/* ═══════════════════════════════════
   SLIDE 3 – SUPPORT
═══════════════════════════════════ */
function slide3(pptx, { month, year, company, employees, repairRequests, bigIssues, supportStats }) {
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addHeader(pptx, s, 'สรุปผลการดำเนินงาน', 'ฝ่ายสนับสนุน');

  const monthly = repairRequests.filter(r => {
    const d = new Date(r.timestamp);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const doneKw   = ['เสร็จสิ้น','สำเร็จ','แก้ไขแล้ว','ปิดแล้ว','Complete'];
  const loseKw   = ['ยกเลิก','ไม่สำเร็จ','Cancel'];
  const closedWon  = monthly.filter(r => doneKw.some(k => (r.status||'').includes(k))).length;
  const closedLose = monthly.filter(r => loseKw.some(k => (r.status||'').includes(k))).length;

  // 🆕 ใช้ค่าที่ผู้ใช้แก้ใน preview (ถ้ามี) มิฉะนั้นคำนวณจากระบบ
  const empCount  = supportStats?.employees  ?? employees.length;
  const caseCount = supportStats?.monthly    ?? monthly.length;
  const won       = supportStats?.closedWon  ?? closedWon;
  const lose      = supportStats?.closedLose ?? closedLose;

  const stats = [
    { v: empCount,  label:'พนักงานทั้งหมด', sub:'จำนวนพนักงาน', color: C.blue  },
    { v: caseCount, label:'เคสทั้งหมด',       sub:'เดือนนี้',      color: C.blue  },
    { v: won,       label:'ปิดสำเร็จ',       sub:'ปิดงานสำเร็จ',  color: C.green },
    { v: lose,      label:'ไม่สำเร็จ',       sub:'ยกเลิก/ไม่สำเร็จ', color: C.red },
  ];
  stats.forEach((st, i) => {
    const bx = 0.4 + i * 3.13, by = 1.18, bw = 2.9, bh = 1.65;
    s.addShape('roundRect', { x:bx, y:by, w:bw, h:bh,
      fill:{ color: 'EEF4FB' }, line:{ color: C.blueLight, width:2 }, rectRadius:0.1 });
    s.addText(String(st.v), { x:bx, y:by+0.05, w:bw, h:bh*0.56,
      fontSize:48, bold:true, color:st.color, align:'center', fontFace:FE, valign:'middle', charSpacing:0 });
    s.addText(st.label, { x:bx, y:by+bh*0.62, w:bw, h:0.4,
      fontSize:15, bold:true, color:C.blue, align:'center', fontFace:F, charSpacing:0 });
    s.addText(st.sub,   { x:bx, y:by+bh*0.82, w:bw, h:0.28,
      fontSize:11, color:C.grayText, align:'center', fontFace:F, charSpacing:0 });
  });

  s.addShape(pptx.ShapeType.rect, { x:0.4, y:3.05, w:3.5, h:0.38,
    fill:{ color: C.red }, line:{ color: C.red } });
  s.addText('🔴  ประเด็นสำคัญ', { x:0.4, y:3.05, w:3.5, h:0.38,
    fontSize:12, bold:true, color:C.white, fontFace:F, valign:'middle', inset:0.1, charSpacing:0 });

  const hdr = [
    cellH('ลำดับ',    { w:0.5  }),
    cellH('ปัญหา',    { align:'left' }),
    cellH('แจ้งโดย',  {}),
    cellH('สถานะ',   {}),
    cellH('กำหนด',   {}),
  ];

  const dataRows = (bigIssues||[]).map((iss, i) => {
    const f = rowFill(i);
    return [
      { ...cellC(i+1), options:{ ...cellC(i+1).options, ...f } },
      { ...cell(iss.issue,   { align:'left' }), options:{ ...cell(iss.issue,{align:'left'}).options, ...f } },
      { ...cellC(iss.raiseBy), options:{ ...cellC(iss.raiseBy).options, ...f } },
      { ...cellC(iss.status,  { ...statusOpts(iss.status), bold:true }),
          options:{ ...cellC(iss.status).options, ...statusOpts(iss.status), bold:true, ...f } },
      { ...cellC(iss.due || '–'), options:{ ...cellC(iss.due||'–').options, ...f } },
    ];
  });

  if (dataRows.length === 0) {
    dataRows.push([
      cellC('–'), cell('ไม่มี Big Issue ในเดือนนี้', { align:'left', color:C.grayText, italic:true }),
      cellC('–'), cellC('–'), cellC('–'),
    ]);
  }

  s.addTable([hdr, ...dataRows], {
    x:0.4, y:3.45, w:12.53,
    colW:[0.5, 6.55, 1.8, 1.8, 1.88],
    rowH:0.62,
    border: bdr(C.grayBorder, 1),
  });

  addFooter(pptx, s, 3, month, year, company);
}

/* ═══════════════════════════════════
   SLIDE – REPAIR CASES  (ดึงจากระบบทั้งหมด ไม่ต้องกรอกเอง)

   เดิมเคสแจ้งซ่อมปรากฏในรายงานแค่ตัวเลขรวม 4 ตัวบนสไลด์ 3
   หัวหน้าเห็นแต่ "เคสทั้งหมด 10" แต่ไม่รู้ว่าเคสอะไร แผนกไหน ค้างอยู่กี่เคส
   สไลด์ชุดนี้ดึง repair_requests ของเดือนนั้นมาแสดงให้ครบ
═══════════════════════════════════ */
const DASH = String.fromCharCode(0x2013);

const REPAIR_STATUS = [
  { key: 'รอดำเนินการ',    label: 'รอดำเนินการ',    color: C.amber,    bg: C.amberBg },
  { key: 'กำลังดำเนินการ', label: 'กำลังดำเนินการ', color: C.blue,     bg: 'EEF4FB'  },
  { key: 'ซ่อมเสร็จสิ้น',  label: 'เสร็จสิ้น',      color: C.green,    bg: C.greenBg },
  { key: 'ยกเลิก',         label: 'ยกเลิก',         color: C.grayText, bg: C.grayBg  },
];

/* สรุปเคสแจ้งซ่อมของเดือนที่เลือก — pure ใช้ร่วมกับ preview ในแอปได้ */
export function getRepairSummary(repairRequests = [], month, year) {
  const inMonth = (repairRequests || []).filter((r) => {
    if (!r?.timestamp) return false;
    const d = new Date(r.timestamp);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  /* นับตามค่าใดค่าหนึ่ง แล้วเรียงมาก -> น้อย */
  const tally = (pick) => {
    const m = new Map();
    inMonth.forEach((r) => {
      const k = String(pick(r) || '').trim() || 'ไม่ระบุ';
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n);
  };

  const byStatus = REPAIR_STATUS.map((s) => ({
    ...s,
    n: inMonth.filter((r) => (r.status || 'รอดำเนินการ') === s.key).length,
  }));

  return {
    total: inMonth.length,
    open: byStatus[0].n + byStatus[1].n,          // ยังไม่ปิด
    done: byStatus[2].n,
    byStatus,
    byDept: tally((r) => r.department),
    byAsset: tally((r) => r.assetName),
    cases: [...inMonth].sort((a, b) => b.timestamp - a.timestamp),
  };
}

/* แถบเทียบสัดส่วนแบบวาดเอง — ไม่ใช้ addChart เพราะ label ไทยใน chart
   ของ PowerPoint เลือกฟอนต์เองไม่ได้ ตัวอักษรจะกระจาย */
function drawBars(pptx, s, { x, y, w, title, items, max = 5, color = C.blue }) {
  s.addText(title, { x, y, w, h: 0.3, fontSize: 13, bold: true, color: C.blue,
    fontFace: F, charSpacing: 0 });

  const top = items.slice(0, max);
  if (top.length === 0) {
    s.addText('ไม่มีข้อมูลในเดือนนี้', { x, y: y + 0.4, w, h: 0.3,
      fontSize: 11, italic: true, color: C.grayText, fontFace: F, charSpacing: 0 });
    return;
  }

  const peak = Math.max(...top.map((t) => t.n)) || 1;
  const labelW = w * 0.42;          // ชื่อ
  const trackX = x + labelW + 0.1;
  const trackW = w - labelW - 0.55; // เว้นที่ให้ตัวเลขท้ายแถบ
  const rowH = 0.42;

  top.forEach((t, i) => {
    const ry = y + 0.42 + i * rowH;
    s.addText(t.name, { x, y: ry, w: labelW, h: rowH - 0.06,
      fontSize: 11, color: C.grayText, fontFace: fontFor(t.name),
      valign: 'middle', charSpacing: 0 });
    s.addShape(pptx.ShapeType.rect, { x: trackX, y: ry + 0.09, w: trackW, h: 0.16,
      fill: { color: C.grayBg }, line: { color: C.grayBg } });
    s.addShape(pptx.ShapeType.rect, {
      x: trackX, y: ry + 0.09, w: Math.max(0.04, trackW * (t.n / peak)), h: 0.16,
      fill: { color }, line: { color } });
    s.addText(String(t.n), { x: trackX + trackW + 0.06, y: ry, w: 0.4, h: rowH - 0.06,
      fontSize: 11, bold: true, color, fontFace: FE, valign: 'middle', charSpacing: 0 });
  });
}

function slideRepair(pptx, ctx, startPageNum) {
  const { month, year, company, repairRequests } = ctx;
  const R = getRepairSummary(repairRequests, month, year);

  /* ── สไลด์ภาพรวม ── */
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addHeader(pptx, s, 'เคสแจ้งซ่อม / แจ้งปัญหา', `รวม ${R.total} เคสในเดือนนี้`);

  R.byStatus.forEach((st, i) => {
    const bx = 0.4 + i * 3.13, by = 1.25, bw = 2.9, bh = 1.15;
    s.addShape('roundRect', { x: bx, y: by, w: bw, h: bh,
      fill: { color: st.bg }, line: { color: st.bg }, rectRadius: 0.08 });
    s.addShape(pptx.ShapeType.rect, { x: bx, y: by, w: 0.1, h: bh,
      fill: { color: st.color }, line: { color: st.color } });
    s.addText(String(st.n), { x: bx + 0.25, y: by + 0.08, w: bw - 0.4, h: 0.62,
      fontSize: 34, bold: true, color: st.color, fontFace: FE, valign: 'middle', charSpacing: 0 });
    s.addText(st.label, { x: bx + 0.25, y: by + 0.7, w: bw - 0.4, h: 0.34,
      fontSize: 12, bold: true, color: C.grayText, fontFace: F, valign: 'middle', charSpacing: 0 });
  });

  drawBars(pptx, s, { x: 0.4,  y: 2.75, w: 6.1,  title: 'แจ้งซ่อมแยกตามแผนก',      items: R.byDept });
  drawBars(pptx, s, { x: 6.83, y: 2.75, w: 6.1,  title: 'อุปกรณ์ที่แจ้งซ่อมบ่อย',  items: R.byAsset, color: C.blueMid });

  /* บรรทัดสรุปให้อ่านจบในประโยคเดียว */
  const rate = R.total > 0 ? Math.round((R.done / R.total) * 100) : 0;
  s.addShape('roundRect', { x: 0.4, y: 5.35, w: 12.53, h: 0.72,
    fill: { color: C.grayBg }, line: { color: C.grayBorder }, rectRadius: 0.08 });
  s.addText(
    [
      { text: 'เดือนนี้รับแจ้งทั้งหมด ', options: { fontFace: F, color: C.grayText } },
      { text: String(R.total),           options: { fontFace: FE, bold: true, color: C.blue } },
      { text: ' เคส · ปิดได้ ',          options: { fontFace: F, color: C.grayText } },
      { text: String(R.done),            options: { fontFace: FE, bold: true, color: C.green } },
      { text: ` เคส (${rate}%) · คงค้าง `, options: { fontFace: F, color: C.grayText } },
      { text: String(R.open),            options: { fontFace: FE, bold: true, color: R.open > 0 ? C.amber : C.green } },
      { text: ' เคส',                    options: { fontFace: F, color: C.grayText } },
    ],
    { x: 0.6, y: 5.35, w: 12.13, h: 0.72, fontSize: 14, valign: 'middle', charSpacing: 0 },
  );

  addFooter(pptx, s, startPageNum, month, year, company);

  /* ── สไลด์รายการเคส (แบ่งหน้าอัตโนมัติ) ── */
  const hdr = [
    cellH('ลำดับ',   {}),
    cellH('วันที่',   {}),
    cellH('ผู้แจ้ง',  { align: 'left' }),
    cellH('แผนก',    { align: 'left' }),
    cellH('อุปกรณ์',  { align: 'left' }),
    cellH('อาการที่แจ้ง', { align: 'left' }),
    cellH('สถานะ',   {}),
  ];

  const COL_W = [0.85, 1.15, 1.75, 1.85, 2.3, 3.33, 1.3];
  const rows = R.cases.map((r, i) => {
    const f = rowFill(i);
    const issue = String(r.issue || DASH);
    const st = REPAIR_STATUS.find((x) => x.key === (r.status || 'รอดำเนินการ')) || REPAIR_STATUS[0];
    const c = (text, opts = {}) => ({
      text: String(text ?? DASH),
      options: { fontSize: 11, fontFace: fontFor(text), align: 'left', valign: 'middle',
        border: bdr(), charSpacing: 0, ...f, ...opts },
    });
    return [
      c(i + 1, { align: 'center', fontFace: FE }),
      c(formatDateShort(r.timestamp), { align: 'center', fontFace: FE }),
      c(r.empName || DASH),
      c(r.department || DASH),
      c(r.assetName || DASH),
      c(issue),
      c(st.label, { align: 'center', bold: true, color: st.color }),
    ];
  });

  const rowHeights = R.cases.map((r) => estimateRowH(String(r.issue || ''), COL_W[5], 11, 0.5));

  const n = addPaginatedTableSlides(pptx, ctx, {
    titleTh: 'รายการเคสแจ้งซ่อม', titleEn: 'รายละเอียดเคสที่รับแจ้งในเดือนนี้',
    startPageNum: startPageNum + 1,
    hdr, rows, colW: COL_W, rowH: 0.5,
    rowHeights,
    emptyRow: [
      cellC(DASH), cellC(DASH),
      cell('ไม่มีเคสแจ้งซ่อมในเดือนนี้', { align: 'left', color: C.grayText, italic: true }),
      cell(DASH, { align: 'left' }), cell(DASH, { align: 'left' }), cell(DASH, { align: 'left' }),
      cellC(DASH),
    ],
  });

  return 1 + n;
}

/* ═══════════════════════════════════
   SLIDE 4 – HARDWARE
═══════════════════════════════════ */
/* 🆕 สรุปจำนวน Hardware ต่อประเภท — ใช้ร่วมกันทั้ง PPTX และ Preview
   นับ "รวม" ตามจำนวนจริงในระบบ (รวมตัดจำหน่ายด้วย เพื่อให้ตรงกับหน้าจอ) */
export function getHardwareSummary(assets = [], accessories = []) {
  const groups = {};
  const ensure = (t) => {
    if (!groups[t]) groups[t] = { type: t, total: 0, inUse: 0, avail: 0, broken: 0, reserve: 0, disposed: 0 };
    return groups[t];
  };
  assets.forEach(a => {
    const t = a.type || 'อื่นๆ';
    const st = a.status || 'พร้อมใช้งาน';
    const g = ensure(t);
    g.total++;
    if (st === 'ถูกใช้งาน') g.inUse++;
    else if (st === 'ชำรุดเสียหาย' || st === 'ไม่สามารถใช้งานได้') g.broken++;
    else if (st === 'สำรอง') g.reserve++;
    else if (st === 'ตัดจำหน่าย') g.disposed++;
    else g.avail++;
  });
  accessories.forEach(a => {
    const t = a.type || 'อุปกรณ์เสริม';
    const qty = Number(a.quantity || 0);
    const inUse = (a.assignees || []).length;
    const broken = Number(a.brokenQuantity || 0);
    const avail = Math.max(0, qty - inUse - broken);
    const g = ensure(t);
    g.total += qty; g.inUse += inUse; g.avail += avail; g.broken += broken;
  });
  return Object.values(groups)
    .map(g => {
      const notes = [];
      if (g.reserve > 0) notes.push(`สำรอง ${g.reserve}`);
      if (g.disposed > 0) notes.push(`ตัดจำหน่าย ${g.disposed}`);
      return { ...g, note: notes.join(' · ') || '' };
    })
    /* มาก -> น้อย ให้ประเภทที่มีของเยอะสุดอยู่บน */
    .sort((a, b) => b.total - a.total);
}

function slide4(pptx, ctx, startPageNum) {
  const { assets, accessories, hardwareSummary } = ctx;
  // 🆕 ใช้ตารางที่ผู้ใช้แก้ใน preview (ถ้ามี) มิฉะนั้นคำนวณจากระบบ
  const summary = hardwareSummary ?? getHardwareSummary(assets, accessories);

  const hdr = [
    cellH('ลำดับ',          {}),
    cellH('ประเภทอุปกรณ์', { align:'left' }),
    cellH('รวม',           {}),
    cellH('ใช้งาน',        {}),
    cellH('พร้อมส่งมอบ',  {}),
    cellH('ชำรุด',         {}),
    cellH('หมายเหตุ',      { align:'left' }),
  ];

  const rows = summary.map((g, i) => {
    const f = rowFill(i);
    const brokenCell = g.broken > 0
      ? { text: String(g.broken), options: { fontSize:14, fontFace:FE, align:'center', valign:'middle', bold:true, color:C.red, border:bdr(), charSpacing:0, ...f } }
      : { text: '–',              options: { fontSize:14, fontFace:FE, align:'center', valign:'middle', color:C.grayText, border:bdr(), charSpacing:0, ...f } };
    return [
      { text:String(i+1),    options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), charSpacing:0, ...f } },
      { text:g.type,          options:{ fontSize:14, fontFace:fontFor(g.type), align:'left', valign:'middle', bold:true, border:bdr(), charSpacing:0, ...f } },
      { text:String(g.total), options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', bold:true, color:C.blue, border:bdr(), charSpacing:0, ...f } },
      { text:String(g.inUse), options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), charSpacing:0, ...f } },
      { text:g.avail > 0 ? String(g.avail):'–', options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', color:C.green, border:bdr(), charSpacing:0, ...f } },
      brokenCell,
      { text:g.note,          options:{ fontSize:11, fontFace:fontFor(g.note), align:'left', valign:'middle', color:C.grayText, border:bdr(), charSpacing:0, ...f } },
    ];
  });

  const emptyRow = [
    cellC('–'), cell('ไม่มีข้อมูล',{ align:'left', color:C.grayText }),
    cellC('–'), cellC('–'), cellC('–'), cellC('–'), cell('–',{ align:'left' }),
  ];

  /* แถวรวมท้ายตาราง */
  const sum = (k) => summary.reduce((n, g) => n + Number(g[k] || 0), 0);
  if (summary.length > 0) {
    rows.push(totalRow([
      { text: '' }, { text: 'รวมทั้งหมด', align: 'left' },
      { text: sum('total') }, { text: sum('inUse') },
      { text: sum('avail') }, { text: sum('broken') },
      { text: `${summary.length} ประเภท`, align: 'left' },
    ]));
  }

  return addPaginatedTableSlides(pptx, ctx, {
    titleTh: 'สรุปผลฮาร์ดแวร์', titleEn: 'รายการฮาร์ดแวร์ในระบบ',
    startPageNum,
    hdr, rows,
    colW: [0.85, 3.0, 0.9, 0.9, 1.3, 0.9, 3.68],
    rowH: 0.62,
    emptyRow,
  });
}

/* ═══════════════════════════════════
   SLIDE 5 – SOFTWARE
═══════════════════════════════════ */
/* 🆕 สรุปซอฟต์แวร์ต่อรายการ (ใช้ร่วม PPTX + Preview) — หมายเหตุ = สถานะวันหมดอายุ */
export function getSoftwareSummary(licenses = []) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysUntil = (d) => Math.ceil((new Date(d) - today) / (1000 * 60 * 60 * 24));
  return (licenses || []).map(lic => {
    const stock = Number(lic.quantity || 0);
    const active = (lic.assignees || []).length;
    const inactive = Math.max(0, stock - active);
    // วันหมดอายุที่ใกล้สุด (parent + per-seat)
    const dates = [
      lic.expirationDate,
      ...(lic.availableSeatExpirationDates || []),
      ...((lic.assignees || []).map(a => a.seatExpirationDate)),
    ].filter(Boolean);
    let note = '–';
    if (dates.length > 0) {
      const minD = Math.min(...dates.map(daysUntil));
      if (minD < 0) note = 'หมดอายุแล้ว';
      else if (minD <= 90) note = `ใกล้หมดอายุ (${minD} วัน)`;
      else if (lic.expirationDate) note = `หมดอายุ ${formatDateShort(lic.expirationDate)}`;
    }
    return { name: lic.name || '–', stock, active, inactive, note: note === '–' ? '' : note };
  });
}

function slide5(pptx, ctx, startPageNum) {
  const { licenses, softwareSummary } = ctx;
  // 🆕 ใช้ตารางที่ผู้ใช้แก้ใน preview (ถ้ามี) มิฉะนั้นคำนวณจากระบบ
  const summary = softwareSummary ?? getSoftwareSummary(licenses);

  const hdr = [
    cellH('ลำดับ',     {}),
    cellH('ซอฟต์แวร์', { align:'left' }),
    cellH('จำนวน',     {}),
    cellH('ใช้งาน',    { color: 'A8FFB0' }),
    cellH('คงเหลือ',   { color: 'FFD0D0' }),
    cellH('หมายเหตุ',  { align:'left' }),
  ];

  const rows = summary.map((s, i) => {
    const f = rowFill(i);
    return [
      { text:String(i+1),        options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), charSpacing:0, ...f } },
      { text:s.name,             options:{ fontSize:14, fontFace:fontFor(s.name), align:'left', valign:'middle', bold:true, border:bdr(), charSpacing:0, ...f } },
      { text:String(s.stock),    options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', bold:true, color:C.blue, border:bdr(), charSpacing:0, ...f } },
      { text:String(s.active),   options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', bold:true, color:C.green, border:bdr(), charSpacing:0, ...f } },
      { text:String(s.inactive), options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', color: s.inactive>0?C.amber:C.grayText, border:bdr(), charSpacing:0, ...f } },
      { text:s.note,             options:{ fontSize:11, fontFace:fontFor(s.note), align:'left', valign:'middle', color:C.grayText, border:bdr(), charSpacing:0, ...f } },
    ];
  });

  const emptyRow = [
    cellC('–'),
    cell('ไม่มีข้อมูล',{ align:'left', color:C.grayText }),
    cellC('–'), cellC('–'), cellC('–'), cell('–',{ align:'left' }),
  ];

  /* ตารางนี้ไม่มีแถว "รวมทั้งหมด" ท้ายตาราง — ผู้ใช้สั่งเอาออก (ตารางฮาร์ดแวร์ยังมี) */

  return addPaginatedTableSlides(pptx, ctx, {
    titleTh: 'สรุปผลซอฟต์แวร์ / ลิขสิทธิ์', titleEn: 'รายการซอฟต์แวร์ในระบบ',
    startPageNum,
    hdr, rows,
    colW: [0.85, 3.4, 0.9, 0.9, 1.0, 4.48],
    rowH: 0.62,
    emptyRow,
  });
}

/* ═══════════════════════════════════
   SLIDE 6 – R&D
═══════════════════════════════════ */
function slide6(pptx, ctx, startPageNum) {
  const { rdProjects } = ctx;

  const hdr = [
    cellH('ลำดับ',       {}),
    cellH('โปรเจค',      { align:'left' }),
    cellH('รายละเอียด',  { align:'left' }),
    cellH('สถานะ',      {}),
    cellH('กำหนด',      {}),
    cellH('หมายเหตุ',   { align:'left' }),
  ];

  const rows = (rdProjects||[]).map((p, i) => {
    const f = rowFill(i);
    const so = statusOpts(p.status||'');
    return [
      { text:String(i+1),    options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), charSpacing:0, ...f } },
      { text:p.project||'–', options:{ fontSize:14, fontFace:fontFor(p.project), align:'left', valign:'middle', bold:true, border:bdr(), charSpacing:0, ...f } },
      { text:p.details||'',  options:{ fontSize:14, fontFace:fontFor(p.details), align:'left', valign:'top', border:bdr(), charSpacing:0, ...f } },
      { text:p.status||'–',  options:{ fontSize:14, fontFace:fontFor(p.status), align:'center', valign:'middle', bold:true, ...so, border:bdr(), charSpacing:0, ...f } },
      { text:p.due||'–',     options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), charSpacing:0, ...f } },
      { text:p.remarks||'',  options:{ fontSize:14, fontFace:fontFor(p.remarks), align:'left', valign:'top', color:C.grayText, border:bdr(), charSpacing:0, ...f } },
    ];
  });

  const emptyRow = [
    cellC('–'),
    cell('ยังไม่มีโปรเจค',{ align:'left', color:C.grayText }),
    cell('',{}), cellC('–'), cellC('–'), cell('',{}),
  ];

  return addPaginatedTableSlides(pptx, ctx, {
    titleTh: 'สรุปภาพรวม สถานะโปรเจค', titleEn: 'สถานะโปรเจค R&D',
    startPageNum,
    hdr, rows,
    colW: [0.5, 2.5, 4.3, 1.5, 1.0, 2.73],
    rowH: 0.88,
    emptyRow,
  });
}

/* ═══════════════════════════════════
   SLIDE 7 – FOLLOW-UP
═══════════════════════════════════ */
function slide7(pptx, ctx, startPageNum) {
  const { followUps } = ctx;

  const hdr = [
    cellH('ลำดับ',       {}),
    cellH('รายละเอียด',  { align:'left' }),
    cellH('สถานะ',      {}),
    cellH('กำหนด',      {}),
    cellH('หมายเหตุ',   { align:'left' }),
  ];

  const rows = (followUps||[]).map((f2, i) => {
    const f = rowFill(i);
    const so = statusOpts(f2.status||'');
    return [
      { text:String(i+1),      options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), charSpacing:0, ...f } },
      { text:f2.details||'',   options:{ fontSize:14, fontFace:fontFor(f2.details), align:'left', valign:'middle', border:bdr(), charSpacing:0, ...f } },
      { text:f2.status||'–',   options:{ fontSize:14, fontFace:fontFor(f2.status), align:'center', valign:'middle', bold:true, ...so, border:bdr(), charSpacing:0, ...f } },
      { text:f2.due||'–',      options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), charSpacing:0, ...f } },
      { text:f2.remarks||'',   options:{ fontSize:14, fontFace:fontFor(f2.remarks), align:'left', valign:'top', color:C.grayText, border:bdr(), charSpacing:0, ...f } },
    ];
  });

  const emptyRow = [
    cellC('–'),
    cell('ไม่มีวาระติดตาม',{ align:'left', color:C.grayText }),
    cellC('–'), cellC('–'), cell('',{}),
  ];

  return addPaginatedTableSlides(pptx, ctx, {
    titleTh: 'วาระติดตาม', titleEn: 'รายการติดตามงาน',
    startPageNum,
    hdr, rows,
    colW: [0.5, 5.5, 1.5, 1.0, 4.03],
    rowH: 0.88,
    emptyRow,
  });
}

/* ═══════════════════════════════════
   SLIDE 8 – THANK YOU
═══════════════════════════════════ */
function slide8(pptx, { month, year, company }) {
  const s = pptx.addSlide();
  s.addShape(pptx.ShapeType.rect, { x:0,y:0,w:13.33,h:7.5,
    fill:{ color:C.blue }, line:{ color:C.blue } });
  s.addShape(pptx.ShapeType.rect, { x:0, y:5.4, w:13.33, h:0.12,
    fill:{ color:C.blueLight }, line:{ color:C.blueLight } });
  s.addShape(pptx.ShapeType.rect, { x:0, y:5.52, w:13.33, h:1.98,
    fill:{ color:'225462' }, line:{ color:'225462' } });

  s.addText('ขอบคุณครับ', { x:0.8, y:1.6, w:11.73, h:1.6,
    fontSize:64, bold:true, color:C.white, align:'center', fontFace:F, charSpacing:0 });
  s.addText(company.toUpperCase(), { x:0.8, y:5.7, w:11.73, h:0.65,
    fontSize:22, bold:true, color:C.blueLight, align:'center', fontFace:FE, charSpacing:0 });
  s.addText(
    [
      { text: 'รายงานผล IT – ',           options: { color:'90B4CC', fontFace: F  } },
      { text: `${TH_MONTHS[month]} `,      options: { color:'90B4CC', fontFace: F  } },
      { text: String(year + 543),          options: { color:'90B4CC', fontFace: FE } },
    ],
    { x:0.8, y:6.38, w:11.73, h:0.45, fontSize:15, align:'center', charSpacing:0 },
  );
}

/* ═══════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════ */
export async function generateITReport({
  month, year,
  companyName = 'Globe Syndicate (Thailand) Company Limited',
  employees = [], repairRequests = [],
  assets = [], accessories = [], licenses = [],
  bigIssues = [], rdProjects = [], followUps = [],
  // 🆕 ค่าที่ผู้ใช้แก้ใน preview (override การคำนวณอัตโนมัติ) — ไม่ส่งมา = ใช้ค่าจากระบบ
  supportStats = null, hardwareSummary = null, softwareSummary = null,
}) {
  const pptx = new PptxGenJS();
  pptx.layout  = 'LAYOUT_WIDE';
  pptx.title   = `IT Performance – ${TH_MONTHS[month]} ${year + 543}`;
  pptx.subject = 'IT Monthly Report';
  pptx.author  = 'IT Department';

  const today = new Date();
  const reportDate = today.toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' });

  const ctx = {
    month, year, company: companyName, reportDate,
    employees, repairRequests, assets, accessories, licenses,
    bigIssues, rdProjects, followUps,
    supportStats, hardwareSummary, softwareSummary,   // 🆕 override จาก preview
  };

  slide1(pptx, ctx);
  slide2(pptx, ctx);
  let page = 3;
  slide3(pptx, ctx);
  page = 4;
  page += slideRepair(pptx, ctx, page);   // 🆕 เคสแจ้งซ่อม — ดึงจากระบบ
  page += slide4(pptx, ctx, page);
  page += slide5(pptx, ctx, page);
  page += slide6(pptx, ctx, page);
  page += slide7(pptx, ctx, page);
  slide8(pptx, ctx);

  const fileName = `IT_Performance_${TH_MONTHS[month]}_${year + 543}.pptx`;
  await pptx.writeFile({ fileName });
  return fileName;
}
