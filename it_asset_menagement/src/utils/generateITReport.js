import PptxGenJS from 'pptxgenjs';

/* ═══════════════════════════════════
   PALETTE
═══════════════════════════════════ */
const C = {
  blue:      '1E487A',
  blueMid:   '2E5F9A',
  blueLight: 'D6E4F0',
  blueRow:   'EBF3FB',   // alternating row tint
  white:     'FFFFFF',
  grayBg:    'F8FAFC',
  grayBorder:'CBD5E1',
  grayText:  '64748B',
  green:     '16A34A',
  greenBg:   'DCFCE7',
  amber:     'D97706',
  amberBg:   'FEF3C7',
  red:       'DC2626',
  redBg:     'FEE2E2',
};

const TH_MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
];

const F  = 'Sarabun';    // Thai font
const FE = 'Arial';      // EN/number font — universal install + tight Latin spacing
const REPORT_VERSION = 'v2';  // bump when changing report layout — appears in footer to verify rebuild

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
      { text: `${company}  |  IT Performance – `, options: { color: 'AAAAAA', fontFace: FE } },
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
      fontSize: 14, italic: true, color: 'B0C8E0', fontFace: FE, valign: 'top', charSpacing: 0,
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
  s.addShape(pptx.ShapeType.rect, { x:0, y:5.72, w:13.33, h:1.78, fill:{ color: '163860' }, line:{ color: '163860' } });

  s.addText(company.toUpperCase(), {
    x:0.8, y:1.6, w:11.73, h:0.9,
    fontSize: 28, bold: true, color: C.blueLight, align:'center', fontFace: FE, charSpacing: 0,
  });
  s.addShape(pptx.ShapeType.rect, { x:3.5, y:2.65, w:6.33, h:0.05, fill:{ color: C.blueLight }, line:{ color: C.blueLight } });
  s.addText('IT Performance', {
    x:0.8, y:2.8, w:11.73, h:0.9,
    fontSize: 42, bold: true, color: C.white, align:'center', fontFace: FE, charSpacing: 0,
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
  s.addText('Monthly IT Performance Report', {
    x:0.8, y:6.0, w:11.73, h:0.45,
    fontSize: 14, italic: true, color: C.blueLight, align:'center', fontFace: FE, charSpacing: 0,
  });
}

/* ═══════════════════════════════════
   SLIDE 2 – AGENDA
═══════════════════════════════════ */
function slide2(pptx, { month, year, company, reportDate }) {
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addHeader(pptx, s, 'Agenda');

  const items = [
    { num:'01', th:'สรุปผลการดำเนินงาน Support',     en:'Support performance overview' },
    { num:'02', th:'สรุปผล Hardware & License',       en:'Hardware & Software inventory' },
    { num:'03', th:'สรุปภาพรวม สถานะโปรเจค R&D',    en:'R&D project status summary' },
    { num:'04', th:'วาระติดตาม',                      en:'Follow-up agenda' },
  ];

  items.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.4 + col * 6.5, y = 1.25 + row * 2.65, w = 6.1, h = 2.35;

    s.addShape('roundRect', { x, y, w, h,
      fill:{ color: 'EEF4FB' }, line:{ color: C.blueLight, width: 2 }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.rect, { x, y, w:0.15, h,
      fill:{ color: C.blue }, line:{ color: C.blue } });

    s.addText(it.num, { x:x+0.3, y:y+0.15, w:1.5, h:0.8,
      fontSize: 42, bold: true, color: C.blue, fontFace: FE, charSpacing: 0 });
    s.addText(it.th,  { x:x+0.3, y:y+0.9,  w:w-0.5, h:0.65,
      fontSize: 17, bold: true, color: C.blue, fontFace: F, charSpacing: 0 });
    s.addText(it.en,  { x:x+0.3, y:y+1.58, w:w-0.5, h:0.45,
      fontSize: 12, italic: true, color: C.grayText, fontFace: FE, charSpacing: 0 });
  });

  s.addText(`อัพเดท: ${reportDate}`, {
    x:0.4, y:7.2, w:5, h:0.22, fontSize:9, color: C.grayText, fontFace: F, charSpacing: 0 });
  addFooter(pptx, s, 2, month, year, company);
}

/* ═══════════════════════════════════
   SLIDE 3 – SUPPORT
═══════════════════════════════════ */
function slide3(pptx, { month, year, company, employees, repairRequests, bigIssues }) {
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addHeader(pptx, s, 'สรุปผลการดำเนินงาน', 'Support');

  const monthly = repairRequests.filter(r => {
    const d = new Date(r.timestamp);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const doneKw   = ['เสร็จสิ้น','สำเร็จ','แก้ไขแล้ว','ปิดแล้ว','Complete'];
  const loseKw   = ['ยกเลิก','ไม่สำเร็จ','Cancel'];
  const closedWon  = monthly.filter(r => doneKw.some(k => (r.status||'').includes(k))).length;
  const closedLose = monthly.filter(r => loseKw.some(k => (r.status||'').includes(k))).length;

  const stats = [
    { v: employees.length, label:'พนักงานทั้งหมด', sub:'Employee',   color: C.blue  },
    { v: monthly.length,   label:'เคส',             sub:'Case',       color: C.blue  },
    { v: closedWon,        label:'ปิดสำเร็จ',       sub:'Close Won',  color: C.green },
    { v: closedLose,       label:'ไม่สำเร็จ',       sub:'Close Lose', color: C.red   },
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
      fontSize:11, color:C.grayText, align:'center', fontFace:FE, charSpacing:0 });
  });

  s.addShape(pptx.ShapeType.rect, { x:0.4, y:3.05, w:3.5, h:0.38,
    fill:{ color: C.red }, line:{ color: C.red } });
  s.addText('🔴  Big Issue Discussion', { x:0.4, y:3.05, w:3.5, h:0.38,
    fontSize:12, bold:true, color:C.white, fontFace:FE, valign:'middle', inset:0.1, charSpacing:0 });

  const hdr = [
    cellH('No',       { w:0.5  }),
    cellH('Issue',    { align:'left' }),
    cellH('Raise by', {}),
    cellH('Status',   {}),
    cellH('Due',      {}),
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
   SLIDE 4 – HARDWARE
═══════════════════════════════════ */
function slide4(pptx, ctx, startPageNum) {
  const { assets, accessories, employees } = ctx;

  const groups = {};
  const holdersByType = {};

  assets.forEach(a => {
    const t = a.type || 'อื่นๆ';
    if (!groups[t]) groups[t] = { total:0, inUse:0, avail:0, broken:0, reserve:0 };
    if (!holdersByType[t]) holdersByType[t] = [];
    groups[t].total++;
    const st = a.status || 'พร้อมใช้งาน';
    if (st === 'ถูกใช้งาน') {
      groups[t].inUse++;
      const name = getShortName(a.assignedTo, employees, a.assignedName);
      if (name) holdersByType[t].push(name);
    } else if (st === 'ชำรุดเสียหาย') {
      groups[t].broken++;
    } else if (st === 'สำรอง') {
      groups[t].reserve++;
    } else {
      groups[t].avail++;
    }
  });

  accessories.forEach(a => {
    const t = a.type || 'อุปกรณ์เสริม';
    const qty    = Number(a.quantity||0);
    const inUse  = (a.assignees||[]).length;
    const broken = Number(a.brokenQuantity||0);
    const avail  = Math.max(0, qty - inUse - broken);
    if (!groups[t]) groups[t] = { total:0, inUse:0, avail:0, broken:0, reserve:0 };
    if (!holdersByType[t]) holdersByType[t] = [];
    groups[t].total  += qty;
    groups[t].inUse  += inUse;
    groups[t].avail  += avail;
    groups[t].broken += broken;
    (a.assignees || []).forEach(asg => {
      const name = getShortName(asg.empId, employees, asg.empName);
      if (name) holdersByType[t].push(name);
    });
  });

  const hdr = [
    cellH('No',           {}),
    cellH('ประเภทอุปกรณ์', { align:'left' }),
    cellH('รวม',           {}),
    cellH('ใช้งาน',        {}),
    cellH('พร้อมส่งมอบ',  {}),
    cellH('ชำรุด',         {}),
    cellH('ผู้ถือครอง',     { align:'left' }),
  ];

  const entries = Object.entries(groups);
  const rows = entries.map(([type, g], i) => {
    const f = rowFill(i);
    const holderText = formatHolders(holdersByType[type] || [], Infinity);   // 🆕 โชว์ครบ
    const brokenCell = g.broken > 0
      ? { text: String(g.broken), options: { fontSize:14, fontFace:FE, align:'center', valign:'middle', bold:true, color:C.red, border:bdr(), charSpacing:0, ...f } }
      : { text: '–',              options: { fontSize:14, fontFace:FE, align:'center', valign:'middle', color:C.grayText, border:bdr(), charSpacing:0, ...f } };
    return [
      { text:String(i+1),    options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), charSpacing:0, ...f } },
      { text:type,            options:{ fontSize:14, fontFace:fontFor(type), align:'left', valign:'middle', bold:true, border:bdr(), charSpacing:0, ...f } },
      { text:String(g.total), options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', bold:true, color:C.blue, border:bdr(), charSpacing:0, ...f } },
      { text:String(g.inUse), options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), charSpacing:0, ...f } },
      { text:g.avail > 0 ? String(g.avail):'–', options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', color:C.green, border:bdr(), charSpacing:0, ...f } },
      brokenCell,
      { text:holderText,      options:{ fontSize:9, fontFace:fontFor(holderText), align:'left', valign:'middle', color:C.grayText, border:bdr(), charSpacing:0, ...f } },
    ];
  });

  // 🆕 ความสูงแต่ละแถวตามจำนวนผู้ถือครอง (คอลัมน์กว้าง 5.98")
  const rowHeights = entries.map(([type]) => {
    const names = [...new Set((holdersByType[type] || []).filter(Boolean))];
    return estimateRowH(names.join(', '), 5.98, 9);
  });

  const emptyRow = [
    cellC('–'), cell('ไม่มีข้อมูล',{ align:'left', color:C.grayText }),
    cellC('–'), cellC('–'), cellC('–'), cellC('–'), cell('',{}),
  ];

  return addPaginatedTableSlides(pptx, ctx, {
    titleTh: 'สรุปผล Hardware', titleEn: 'Hardware Inventory',
    startPageNum,
    hdr, rows,
    colW: [0.5, 2.5, 0.75, 0.85, 1.2, 0.75, 5.98],
    rowH: 0.62,
    rowHeights,   // 🆕 แถวสูงตามจำนวนชื่อ
    emptyRow,
  });
}

/* ═══════════════════════════════════
   SLIDE 5 – SOFTWARE
═══════════════════════════════════ */
function slide5(pptx, ctx, startPageNum) {
  const { licenses, employees } = ctx;

  const hdr = [
    cellH('No',        {}),
    cellH('Software',  { align:'left' }),
    cellH('Stock',     {}),
    cellH('Active',    { color: 'A8FFB0' }),
    cellH('Inactive',  { color: 'FFD0D0' }),
    cellH('ผู้ใช้งาน',  { align:'left' }),
  ];

  const rows = licenses.map((lic, i) => {
    const stock    = Number(lic.quantity||0);
    const active   = (lic.assignees||[]).length;
    const inactive = Math.max(0, stock - active);
    const f = rowFill(i);

    const assigneeNames = (lic.assignees || []).map(a =>
      getShortName(a.empId, employees, a.empName)
    );
    const holderText = formatHolders(assigneeNames, Infinity);   // 🆕 โชว์ครบทุกชื่อ

    return [
      { text:String(i+1),      options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), charSpacing:0, ...f } },
      { text:lic.name||'–',    options:{ fontSize:14, fontFace:fontFor(lic.name), align:'left', valign:'middle', bold:true, border:bdr(), charSpacing:0, ...f } },
      { text:String(stock),    options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', bold:true, color:C.blue, border:bdr(), charSpacing:0, ...f } },
      { text:String(active),   options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', bold:true, color:C.green, border:bdr(), charSpacing:0, ...f } },
      { text:String(inactive), options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', color: inactive>0?C.amber:C.grayText, border:bdr(), charSpacing:0, ...f } },
      { text:holderText,       options:{ fontSize:9, fontFace:fontFor(holderText), align:'left', valign:'middle', color:C.grayText, border:bdr(), charSpacing:0, ...f } },
    ];
  });

  // 🆕 ความสูงแต่ละแถวตามจำนวนชื่อในคอลัมน์ผู้ใช้งาน (กว้าง 6.83")
  const rowHeights = licenses.map((lic) => {
    const names = [...new Set((lic.assignees || []).map(a => getShortName(a.empId, employees, a.empName)).filter(Boolean))];
    return estimateRowH(names.join(', '), 6.83, 9);
  });

  const emptyRow = [
    cellC('–'),
    cell('ไม่มีข้อมูล',{ align:'left', color:C.grayText }),
    cellC('–'), cellC('–'), cellC('–'), cell('',{}),
  ];

  return addPaginatedTableSlides(pptx, ctx, {
    titleTh: 'สรุปผล Software / License', titleEn: 'Software Inventory',
    startPageNum,
    hdr, rows,
    colW: [0.5, 2.5, 0.85, 0.9, 0.95, 6.83],
    rowH: 0.62,
    rowHeights,   // 🆕 แถวสูงตามจำนวนชื่อ
    emptyRow,
  });
}

/* ═══════════════════════════════════
   SLIDE 6 – R&D
═══════════════════════════════════ */
function slide6(pptx, ctx, startPageNum) {
  const { rdProjects } = ctx;

  const hdr = [
    cellH('No',          {}),
    cellH('Project',     { align:'left' }),
    cellH('รายละเอียด',  { align:'left' }),
    cellH('Status',      {}),
    cellH('Due',         {}),
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
    titleTh: 'สรุปภาพรวม สถานะโปรเจค', titleEn: 'R&D Project Status',
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
    cellH('No',          {}),
    cellH('รายละเอียด',  { align:'left' }),
    cellH('Status',      {}),
    cellH('Due',         {}),
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
    titleTh: 'วาระติดตาม', titleEn: 'Follow-up Agenda',
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
    fill:{ color:'163860' }, line:{ color:'163860' } });

  s.addText('THANK YOU', { x:0.8, y:1.6, w:11.73, h:1.6,
    fontSize:72, bold:true, color:C.white, align:'center', fontFace:FE, charSpacing:0 });
  s.addText(company.toUpperCase(), { x:0.8, y:5.7, w:11.73, h:0.65,
    fontSize:22, bold:true, color:C.blueLight, align:'center', fontFace:FE, charSpacing:0 });
  s.addText(
    [
      { text: 'IT Performance – ',         options: { color:'90B4CC', fontFace: FE } },
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
  };

  slide1(pptx, ctx);
  slide2(pptx, ctx);
  let page = 3;
  slide3(pptx, ctx);
  page = 4;
  page += slide4(pptx, ctx, page);
  page += slide5(pptx, ctx, page);
  page += slide6(pptx, ctx, page);
  page += slide7(pptx, ctx, page);
  slide8(pptx, ctx);

  const fileName = `IT_Performance_${TH_MONTHS[month]}_${year + 543}.pptx`;
  await pptx.writeFile({ fileName });
  return fileName;
}
