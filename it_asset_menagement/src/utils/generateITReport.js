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

// ── Fonts: 'Sarabun' is much more widely supported than 'TH Sarabun New'.
//    The old 'TH Sarabun New' falls back inconsistently on machines without it,
//    causing the spaced-out character bug in headers/body text.
const F  = 'Sarabun';   // Thai font
const FE = 'Sarabun';   // EN/number font (Sarabun has solid Latin glyphs too)

/* ─── Base sizes (per user request: non-heading body text = 16) ─── */
const BODY_SIZE   = 14;   // table body text
const HEADER_SIZE = 14;   // table column header (kept = body, distinct via fill + bold)

/* ─── pptxgenjs border object (all 4 sides) ─── */
const bdr = (color = C.grayBorder, pt = 1) =>
  ({ type: 'solid', pt, color });

/* ─── Table cell factory ─── */
const cell = (text, opts = {}) => ({
  text: String(text ?? '–'),
  options: {
    fontSize: BODY_SIZE,
    fontFace: F,
    valign: 'middle',
    border: bdr(),
    charSpacing: 0,     // explicit 0 prevents PowerPoint from applying default kerning that
                        // can render as spread-out characters when fonts fall back
    autoFit: false,     // don't let PPT shrink/spread text — keep our chosen size
    ...opts,
  },
});
const cellC  = (text, opts = {}) => cell(text, { align: 'center', fontFace: FE, ...opts });
const cellN  = (text, opts = {}) => cellC(text, { bold: true, ...opts });   // number cell
const cellH  = (text, opts = {}) => cell(text, {                             // header cell
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

/* ─── Footer bar ─── */
addFooter = (pptx, slide, pageNum, month, year, company) => {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.15, w: 13.33, h: 0.06,
    fill: { color: C.blue }, line: { color: C.blue },
  });
  const label = `${company}  |  IT Performance – ${TH_MONTHS[month]} ${year + 543}`;
  slide.addText(
    [{ text: label, options: { color: 'AAAAAA' } },
     { text: `   ${pageNum}`, options: { color: C.blue, bold: true } }],
    { x: 0.4, y: 7.22, w: 12.53, h: 0.22, fontSize: 9, align: 'right', fontFace: F },
  );
};

/* ─── Pagination: max body rows per slide given row height ─── */
//   Slide is 7.5" tall; usable area between table top (1.15") and footer (7.15") = 6.0".
//   Subtract 1 for the header row that repeats on every slide.
const rowsPerSlide = (rowH) =>
  Math.max(1, Math.floor(6.0 / rowH) - 1);

/* ─── Forward decl (defined below) ─── */
let addHeader, addFooter;

/* ─── Render a (possibly multi-slide) table with auto-pagination ─── */
//   Returns number of slides consumed so caller can keep page counter in sync.
function addPaginatedTableSlides(pptx, ctx, {
  titleTh, titleEn, startPageNum,
  hdr, rows, colW, rowH, tableY = 1.15,
  emptyRow,           // optional fallback row when data is empty
}) {
  const all = (rows.length === 0 && emptyRow) ? [emptyRow] : rows;
  const per = rowsPerSlide(rowH);
  const chunks = [];
  for (let i = 0; i < all.length; i += per) chunks.push(all.slice(i, i + per));
  if (chunks.length === 0) chunks.push([]); // ensure at least one slide

  chunks.forEach((chunk, p) => {
    const s = pptx.addSlide();
    s.background = { color: C.white };
    const suffix = chunks.length > 1 ? `  (${p + 1}/${chunks.length})` : '';
    addHeader(pptx, s, titleTh + suffix, titleEn);
    s.addTable([hdr, ...chunk], {
      x: 0.4, y: tableY, w: 12.53, colW, rowH,
      border: bdr(C.grayBorder, 1),
    });
    addFooter(pptx, s, startPageNum + p, ctx.month, ctx.year, ctx.company);
  });

  return chunks.length;
}

/* ─── Header bar ─── */
addHeader = (pptx, slide, titleTh, titleEn = '') => {
  // Background bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 1.0,
    fill: { color: C.blue }, line: { color: C.blue },
  });
  // Accent stripe
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 1.0, w: 13.33, h: 0.07,
    fill: { color: C.blueLight }, line: { color: C.blueLight },
  });
  // Title Thai
  slide.addText(titleTh, {
    x: 0.45, y: 0.05, w: 9, h: 0.58,
    fontSize: 26, bold: true, color: C.white, fontFace: F, valign: 'middle',
  });
  // Sub title English (italic, smaller)
  if (titleEn) {
    slide.addText(titleEn, {
      x: 0.45, y: 0.58, w: 9, h: 0.38,
      fontSize: 14, italic: true, color: 'B0C8E0', fontFace: FE, valign: 'top',
    });
  }
};

/* ═══════════════════════════════════
   SLIDE 1 – COVER
═══════════════════════════════════ */
function slide1(pptx, { month, year, company, reportDate }) {
  const s = pptx.addSlide();

  // Full dark BG
  s.addShape(pptx.ShapeType.rect, { x:0, y:0, w:13.33, h:7.5, fill:{ color: C.blue }, line:{ color: C.blue } });
  // Accent band
  s.addShape(pptx.ShapeType.rect, { x:0, y:5.6, w:13.33, h:0.12, fill:{ color: C.blueLight }, line:{ color: C.blueLight } });
  s.addShape(pptx.ShapeType.rect, { x:0, y:5.72, w:13.33, h:1.78, fill:{ color: '163860' }, line:{ color: '163860' } });

  // Company
  s.addText(company.toUpperCase(), {
    x:0.8, y:1.6, w:11.73, h:0.9,
    fontSize: 28, bold: true, color: C.blueLight, align:'center', fontFace: FE,
  });
  // Divider
  s.addShape(pptx.ShapeType.rect, { x:3.5, y:2.65, w:6.33, h:0.05, fill:{ color: C.blueLight }, line:{ color: C.blueLight } });
  // Main title
  s.addText(`IT Performance`, {
    x:0.8, y:2.8, w:11.73, h:0.9,
    fontSize: 42, bold: true, color: C.white, align:'center', fontFace: FE,
  });
  s.addText(`เดือน${TH_MONTHS[month]}  ${year + 543}`, {
    x:0.8, y:3.72, w:11.73, h:0.75,
    fontSize: 32, bold: true, color: C.blueLight, align:'center', fontFace: F,
  });
  // Date
  s.addText(reportDate, {
    x:0.8, y:4.6, w:11.73, h:0.5,
    fontSize: 17, color: '90B4CC', align:'center', fontFace: F,
  });
  // Bottom label
  s.addText('Monthly IT Performance Report', {
    x:0.8, y:6.0, w:11.73, h:0.45,
    fontSize: 14, italic: true, color: C.blueLight, align:'center', fontFace: FE,
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
    // Left accent bar
    s.addShape(pptx.ShapeType.rect, { x, y, w:0.15, h,
      fill:{ color: C.blue }, line:{ color: C.blue } });

    s.addText(it.num, { x:x+0.3, y:y+0.15, w:1.5, h:0.8,
      fontSize: 42, bold: true, color: C.blue, fontFace: FE });
    s.addText(it.th,  { x:x+0.3, y:y+0.9,  w:w-0.5, h:0.65,
      fontSize: 17, bold: true, color: C.blue, fontFace: F });
    s.addText(it.en,  { x:x+0.3, y:y+1.58, w:w-0.5, h:0.45,
      fontSize: 12, italic: true, color: C.grayText, fontFace: FE });
  });

  s.addText(`อัพเดท: ${reportDate}`, {
    x:0.4, y:7.2, w:5, h:0.22, fontSize:9, color: C.grayText, fontFace: F });
  addFooter(pptx, s, 2, month, year, company);
}

/* ═══════════════════════════════════
   SLIDE 3 – SUPPORT
═══════════════════════════════════ */
function slide3(pptx, { month, year, company, employees, repairRequests, bigIssues }) {
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addHeader(pptx, s, 'สรุปผลการดำเนินงาน', 'Support');

  // Calculate stats
  const monthly = repairRequests.filter(r => {
    const d = new Date(r.timestamp);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const doneKw   = ['เสร็จสิ้น','สำเร็จ','แก้ไขแล้ว','ปิดแล้ว','Complete'];
  const loseKw   = ['ยกเลิก','ไม่สำเร็จ','Cancel'];
  const closedWon  = monthly.filter(r => doneKw.some(k => (r.status||'').includes(k))).length;
  const closedLose = monthly.filter(r => loseKw.some(k => (r.status||'').includes(k))).length;

  // Stat boxes (4 across)
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
      fontSize:48, bold:true, color:st.color, align:'center', fontFace:FE, valign:'middle' });
    s.addText(st.label, { x:bx, y:by+bh*0.62, w:bw, h:0.4,
      fontSize:15, bold:true, color:C.blue, align:'center', fontFace:F });
    s.addText(st.sub,   { x:bx, y:by+bh*0.82, w:bw, h:0.28,
      fontSize:11, color:C.grayText, align:'center', fontFace:FE });
  });

  // Big Issue header
  s.addShape(pptx.ShapeType.rect, { x:0.4, y:3.05, w:3.5, h:0.38,
    fill:{ color: C.red }, line:{ color: C.red } });
  s.addText('🔴  Big Issue Discussion', { x:0.4, y:3.05, w:3.5, h:0.38,
    fontSize:12, bold:true, color:C.white, fontFace:F, valign:'middle', inset:0.1 });

  // Big Issue table
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
  const { assets, accessories } = ctx;

  // Group assets by type
  const groups = {};
  assets.forEach(a => {
    const t = a.type || 'อื่นๆ';
    if (!groups[t]) groups[t] = { total:0, inUse:0, avail:0, broken:0 };
    groups[t].total++;
    const st = a.status || 'พร้อมใช้งาน';
    if (st === 'ถูกใช้งาน')       groups[t].inUse++;
    else if (st === 'ชำรุดเสียหาย') groups[t].broken++;
    else                           groups[t].avail++;
  });
  // Merge accessories
  accessories.forEach(a => {
    const t = a.type || 'อุปกรณ์เสริม';
    const qty    = Number(a.quantity||0);
    const inUse  = (a.assignees||[]).length;
    const broken = Number(a.brokenQuantity||0);
    const avail  = Math.max(0, qty - inUse - broken);
    if (!groups[t]) groups[t] = { total:0, inUse:0, avail:0, broken:0 };
    groups[t].total  += qty;
    groups[t].inUse  += inUse;
    groups[t].avail  += avail;
    groups[t].broken += broken;
  });

  const hdr = [
    cellH('No',           {}),
    cellH('ประเภทอุปกรณ์', { align:'left' }),
    cellH('รวม',           {}),
    cellH('ใช้งาน',        {}),
    cellH('พร้อมส่งมอบ',  {}),
    cellH('ชำรุด',         {}),
    cellH('หมายเหตุ',     { align:'left' }),
  ];

  const entries = Object.entries(groups);
  const rows = entries.map(([type, g], i) => {
    const f = rowFill(i);
    const brokenCell = g.broken > 0
      ? { text: String(g.broken), options: { fontSize:14, fontFace:FE, align:'center', valign:'middle', bold:true, color:C.red, border:bdr(), ...f } }
      : { text: '–',              options: { fontSize:14, fontFace:FE, align:'center', valign:'middle', color:C.grayText, border:bdr(), ...f } };
    return [
      { text:String(i+1),    options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), ...f } },
      { text:type,            options:{ fontSize:14, fontFace:F,  align:'left',   valign:'middle', bold:true, border:bdr(), ...f } },
      { text:String(g.total), options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', bold:true, color:C.blue, border:bdr(), ...f } },
      { text:String(g.inUse), options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), ...f } },
      { text:g.avail > 0 ? String(g.avail):'–', options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', color:C.green, border:bdr(), ...f } },
      brokenCell,
      { text:'',              options:{ fontSize:14, fontFace:F, align:'left', valign:'middle', color:C.grayText, border:bdr(), ...f } },
    ];
  });

  const emptyRow = [
    cellC('–'), cell('ไม่มีข้อมูล',{ align:'left', color:C.grayText }),
    cellC('–'), cellC('–'), cellC('–'), cellC('–'), cell('',{}),
  ];

  return addPaginatedTableSlides(pptx, ctx, {
    titleTh: 'สรุปผล Hardware', titleEn: 'Hardware Inventory',
    startPageNum,
    hdr, rows,
    colW: [0.5, 3.0, 0.85, 0.95, 1.4, 0.85, 4.98],
    rowH: 0.62,
    emptyRow,
  });
}

/* ═══════════════════════════════════
   SLIDE 5 – SOFTWARE
═══════════════════════════════════ */
function slide5(pptx, ctx, startPageNum) {
  const { licenses } = ctx;

  const hdr = [
    cellH('No',        {}),
    cellH('Software',  { align:'left' }),
    cellH('Stock',     {}),
    cellH('Active',    { color: 'A8FFB0' }),
    cellH('Inactive',  { color: 'FFD0D0' }),
    cellH('หมายเหตุ',  { align:'left' }),
  ];

  const rows = licenses.map((lic, i) => {
    const stock    = Number(lic.quantity||0);
    const active   = (lic.assignees||[]).length;
    const inactive = Math.max(0, stock - active);
    const f = rowFill(i);
    return [
      { text:String(i+1),      options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), ...f } },
      { text:lic.name||'–',    options:{ fontSize:14, fontFace:F,  align:'left',   valign:'middle', bold:true, border:bdr(), ...f } },
      { text:String(stock),    options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', bold:true, color:C.blue, border:bdr(), ...f } },
      { text:String(active),   options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', bold:true, color:C.green, border:bdr(), ...f } },
      { text:String(inactive), options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', color: inactive>0?C.amber:C.grayText, border:bdr(), ...f } },
      { text:lic.remarks||'',  options:{ fontSize:14, fontFace:F,  align:'left',   valign:'middle', color:C.grayText, border:bdr(), ...f } },
    ];
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
    //   No , Software, Stock, Active, Inactive,  หมายเหตุ
    colW: [0.5, 3.0,     0.95,  1.0,    1.05,     6.03],
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
      { text:String(i+1),    options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), ...f } },
      { text:p.project||'–', options:{ fontSize:14, fontFace:F,  align:'left',   valign:'middle', bold:true, border:bdr(), ...f } },
      { text:p.details||'',  options:{ fontSize:14, fontFace:F,  align:'left',   valign:'top',    border:bdr(), ...f } },
      { text:p.status||'–',  options:{ fontSize:14, fontFace:F,  align:'center', valign:'middle', bold:true, ...so, border:bdr(), ...f } },
      { text:p.due||'–',     options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), ...f } },
      { text:p.remarks||'',  options:{ fontSize:14, fontFace:F,  align:'left',   valign:'top',    color:C.grayText, border:bdr(), ...f } },
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
      { text:String(i+1),      options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), ...f } },
      { text:f2.details||'',   options:{ fontSize:14, fontFace:F,  align:'left',   valign:'middle', border:bdr(), ...f } },
      { text:f2.status||'–',   options:{ fontSize:14, fontFace:F,  align:'center', valign:'middle', bold:true, ...so, border:bdr(), ...f } },
      { text:f2.due||'–',      options:{ fontSize:14, fontFace:FE, align:'center', valign:'middle', border:bdr(), ...f } },
      { text:f2.remarks||'',   options:{ fontSize:14, fontFace:F,  align:'left',   valign:'top',    color:C.grayText, border:bdr(), ...f } },
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
    fontSize:72, bold:true, color:C.white, align:'center', fontFace:FE });
  s.addText(company.toUpperCase(), { x:0.8, y:5.7, w:11.73, h:0.65,
    fontSize:22, bold:true, color:C.blueLight, align:'center', fontFace:FE });
  s.addText(`IT Performance – ${TH_MONTHS[month]} ${year+543}`, { x:0.8, y:6.38, w:11.73, h:0.45,
    fontSize:15, color:'90B4CC', align:'center', fontFace:F });
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

  slide1(pptx, ctx);        // page 1 (cover, no footer page-num shown)
  slide2(pptx, ctx);        // page 2 (agenda)
  let page = 3;
  slide3(pptx, ctx);        // page 3 (support, fixed)
  page = 4;
  page += slide4(pptx, ctx, page); // hardware (1+ slides)
  page += slide5(pptx, ctx, page); // software (1+ slides)
  page += slide6(pptx, ctx, page); // R&D (1+ slides)
  page += slide7(pptx, ctx, page); // follow-up (1+ slides)
  slide8(pptx, ctx);        // thank you

  const fileName = `IT_Performance_${TH_MONTHS[month]}_${year + 543}.pptx`;
  await pptx.writeFile({ fileName });
  return fileName;
}
