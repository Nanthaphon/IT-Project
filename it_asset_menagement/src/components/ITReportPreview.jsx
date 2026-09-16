import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, FileDown, Loader2, Eye, Pencil, Plus, Trash2 } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   IT Report Preview + Edit — ตัวอย่าง + แก้ไขสไลด์ก่อน Export
   • โหมดดู: สไลด์กลางจอ + ลูกศรเลื่อน
   • โหมดแก้ไข: สไลด์ซ้าย (อัปเดตสด) + ฟอร์มแก้ไขของสไลด์นั้นขวา
   สไตล์/สีตรงกับ generateITReport.js — ข้อมูลที่แก้จะถูกส่งไปสร้างไฟล์จริง
══════════════════════════════════════════════════════════════ */

const NAVY = '#A65F3C';
const NAVY_BAND = '#163860';
const BLUE_LIGHT = '#D6E4F0';
const BLUE_ROW = '#EBF3FB';
const CARD_BG = '#EEF4FB';
const GRAY_BORDER = '#CBD5E1';
const GRAY_TEXT = '#64748B';
const GREEN = '#16A34A';
const AMBER = '#D97706';
const RED = '#DC2626';

const TH_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                   'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

const STATUS_OPTIONS = ['⏳ In Progress', '✓ Complete', '❌ Cancelled', '⏸ On Hold'];

const FONT = "'Sarabun', 'Leelawadee UI', sans-serif";

/* สีสถานะตามข้อความ (ตรงกับ statusOpts ใน generator) */
function statusColor(s = '') {
  const t = String(s).toLowerCase();
  if (t.includes('complete') || s.includes('สำเร็จ')) return GREEN;
  if (t.includes('progress') || s.includes('ดำเนินการ')) return AMBER;
  if (t.includes('cancel') || s.includes('ยกเลิก')) return RED;
  return GRAY_TEXT;
}

const cloneRows = (arr) => (arr || []).map(o => ({ ...o }));
const toNum = (v) => (v === '' || v === null || isNaN(Number(v)) ? 0 : Number(v));

/* ─── Canvas 1280×720 ที่ scale ให้พอดีความกว้าง parent ─── */
function SlideCanvas({ children }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 1280);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full" style={{ aspectRatio: '16 / 9' }}>
      <div
        style={{
          width: 1280, height: 720, transform: `scale(${scale})`,
          transformOrigin: 'top left', fontFamily: FONT,
          background: '#fff', position: 'relative', overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── กรอบสไลด์เนื้อหา (header navy + footer) ─── */
function ContentSlide({ titleTh, titleEn, page, company, month, year, children }) {
  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 96, background: NAVY }} />
      <div style={{ position: 'absolute', top: 96, left: 0, right: 0, height: 7, background: BLUE_LIGHT }} />
      <div style={{ position: 'absolute', top: 8, left: 43, right: 43 }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{titleTh}</div>
        {titleEn && (
          <div style={{ fontSize: 18, fontStyle: 'italic', color: '#B0C8E0', marginTop: 2 }}>{titleEn}</div>
        )}
      </div>
      <div style={{ position: 'absolute', top: 118, left: 38, right: 38, bottom: 46 }}>
        {children}
      </div>
      <div style={{ position: 'absolute', bottom: 34, left: 0, right: 0, height: 6, background: NAVY }} />
      <div style={{ position: 'absolute', bottom: 8, right: 38, fontSize: 11, color: '#AAAAAA', textAlign: 'right' }}>
        {company}&nbsp;&nbsp;|&nbsp;&nbsp;รายงานผล IT – {TH_MONTHS[month]} {year + 543}
        <span style={{ color: NAVY, fontWeight: 700 }}>&nbsp;&nbsp;&nbsp;{page}</span>
        <span style={{ color: '#CCCCCC' }}>&nbsp;&nbsp;(v2)</span>
      </div>
    </>
  );
}

/* ─── ตารางในสไลด์ ─── */
function SlideTable({ columns, rows, empty }) {
  const totalW = columns.reduce((a, c) => a + c.w, 0);
  return (
    <div style={{ maxHeight: '100%', overflowY: 'auto', border: `1px solid ${GRAY_BORDER}` }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          {columns.map((c, i) => <col key={i} style={{ width: `${(c.w / totalW) * 100}%` }} />)}
        </colgroup>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} style={{
                background: NAVY, color: c.headColor || '#fff', fontSize: 14, fontWeight: 700,
                textAlign: c.align || 'center', padding: '8px 10px', border: `1px solid #2E5F9A`,
                whiteSpace: 'nowrap',
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{
                padding: '12px', textAlign: 'center', color: GRAY_TEXT, fontStyle: 'italic',
                border: `1px solid ${GRAY_BORDER}`, fontSize: 14,
              }}>{empty}</td>
            </tr>
          ) : rows.map((r, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : BLUE_ROW }}>
              {r.map((cellNode, ci) => {
                const col = columns[ci];
                return (
                  <td key={ci} style={{
                    fontSize: cellNode.size || 14, fontWeight: cellNode.bold ? 700 : 400,
                    color: cellNode.color || '#1e293b', textAlign: cellNode.align || col.align || 'center',
                    padding: '7px 10px', border: `1px solid ${GRAY_BORDER}`,
                    verticalAlign: 'middle', wordBreak: 'break-word',
                  }}>{cellNode.text}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ════════════════ SLIDE RENDERERS ════════════════ */

function CoverSlide({ company, month, year, reportDate }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: NAVY }}>
      <div style={{ position: 'absolute', top: 538, left: 0, right: 0, height: 11, background: BLUE_LIGHT }} />
      <div style={{ position: 'absolute', top: 549, left: 0, right: 0, bottom: 0, background: NAVY_BAND }} />
      <div style={{ position: 'absolute', top: 150, left: 80, right: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: BLUE_LIGHT, letterSpacing: 0.5 }}>{company.toUpperCase()}</div>
        <div style={{ width: 340, height: 4, background: BLUE_LIGHT, margin: '26px auto' }} />
        <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', marginTop: 8 }}>รายงานผลการดำเนินงาน IT</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: BLUE_LIGHT, marginTop: 22 }}>เดือน{TH_MONTHS[month]} {year + 543}</div>
        <div style={{ fontSize: 18, color: '#90B4CC', marginTop: 26 }}>{reportDate}</div>
      </div>
      <div style={{ position: 'absolute', top: 600, left: 80, right: 80, textAlign: 'center', fontSize: 16, fontStyle: 'italic', color: BLUE_LIGHT }}>
        รายงานผลการดำเนินงานฝ่าย IT ประจำเดือน
      </div>
    </div>
  );
}

function AgendaSlide(props) {
  const items = [
    { num: '01', th: 'สรุปผลการดำเนินงานฝ่ายสนับสนุน', en: 'ภาพรวมงานสนับสนุน' },
    { num: '02', th: 'สรุปผลฮาร์ดแวร์และซอฟต์แวร์', en: 'รายการทรัพย์สินในระบบ' },
    { num: '03', th: 'สรุปภาพรวมสถานะโปรเจค R&D', en: 'สถานะโปรเจควิจัยและพัฒนา' },
    { num: '04', th: 'วาระติดตาม', en: 'รายการติดตามงาน' },
  ];
  return (
    <ContentSlide titleTh="สารบัญ" page={2} {...props}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, height: '100%', paddingTop: 6 }}>
        {items.map((it) => (
          <div key={it.num} style={{ position: 'relative', background: CARD_BG, border: `2px solid ${BLUE_LIGHT}`, borderRadius: 12, padding: '20px 24px 20px 34px' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 12, background: NAVY, borderRadius: '12px 0 0 12px' }} />
            <div style={{ fontSize: 52, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{it.num}</div>
            <div style={{ fontSize: 21, fontWeight: 700, color: NAVY, marginTop: 12 }}>{it.th}</div>
            <div style={{ fontSize: 14, fontStyle: 'italic', color: GRAY_TEXT, marginTop: 6 }}>{it.en}</div>
          </div>
        ))}
      </div>
    </ContentSlide>
  );
}

function SupportSlide({ stats, bigIssues, ...props }) {
  const cards = [
    { v: stats.employees, label: 'พนักงานทั้งหมด', sub: 'จำนวนพนักงาน', color: NAVY },
    { v: stats.monthly, label: 'เคสทั้งหมด', sub: 'เดือนนี้', color: NAVY },
    { v: stats.closedWon, label: 'ปิดสำเร็จ', sub: 'ปิดงานสำเร็จ', color: GREEN },
    { v: stats.closedLose, label: 'ไม่สำเร็จ', sub: 'ยกเลิก/ไม่สำเร็จ', color: RED },
  ];
  const rows = (bigIssues || []).map((iss, i) => ([
    { text: i + 1, bold: true },
    { text: iss.issue || '–', align: 'left' },
    { text: iss.raiseBy || '–' },
    { text: iss.status || '–', color: statusColor(iss.status), bold: true },
    { text: iss.due || '–' },
  ]));
  return (
    <ContentSlide titleTh="สรุปผลการดำเนินงาน" titleEn="ฝ่ายสนับสนุน" page={3} {...props}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: CARD_BG, border: `2px solid ${BLUE_LIGHT}`, borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: c.color, lineHeight: 1.1 }}>{c.v}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginTop: 4 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: GRAY_TEXT }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'inline-block', background: RED, color: '#fff', fontSize: 13, fontWeight: 700, padding: '6px 16px', marginTop: 18 }}>
        🔴&nbsp;&nbsp;ประเด็นสำคัญ
      </div>
      <div style={{ marginTop: 10, maxHeight: 250, overflow: 'hidden' }}>
        <SlideTable
          columns={[
            { label: 'ลำดับ', w: 0.5 }, { label: 'ปัญหา', w: 6.55, align: 'left' },
            { label: 'แจ้งโดย', w: 1.8 }, { label: 'สถานะ', w: 1.8 }, { label: 'กำหนด', w: 1.88 },
          ]}
          rows={rows} empty="ไม่มี Big Issue ในเดือนนี้"
        />
      </div>
    </ContentSlide>
  );
}

function HardwareSlide({ hwSummary, ...props }) {
  const rows = (hwSummary || []).map((g, i) => ([
    { text: i + 1 },
    { text: g.type, align: 'left', bold: true },
    { text: g.total, bold: true, color: NAVY },
    { text: g.inUse },
    { text: g.avail > 0 ? g.avail : '–', color: g.avail > 0 ? GREEN : GRAY_TEXT },
    { text: g.broken > 0 ? g.broken : '–', color: g.broken > 0 ? RED : GRAY_TEXT, bold: g.broken > 0 },
    { text: g.note, align: 'left', color: GRAY_TEXT, size: 12 },
  ]));
  return (
    <ContentSlide titleTh="สรุปผลฮาร์ดแวร์" titleEn="รายการฮาร์ดแวร์ในระบบ" page={4} {...props}>
      <SlideTable
        columns={[
          { label: 'ลำดับ', w: 0.6 }, { label: 'ประเภทอุปกรณ์', w: 3.0, align: 'left' },
          { label: 'รวม', w: 0.9 }, { label: 'ใช้งาน', w: 0.9 }, { label: 'พร้อมส่งมอบ', w: 1.3 },
          { label: 'ชำรุด', w: 0.9 }, { label: 'หมายเหตุ', w: 3.93, align: 'left' },
        ]}
        rows={rows} empty="ไม่มีข้อมูล"
      />
    </ContentSlide>
  );
}

function SoftwareSlide({ swSummary, ...props }) {
  const rows = (swSummary || []).map((s, i) => ([
    { text: i + 1 },
    { text: s.name, align: 'left', bold: true },
    { text: s.stock, bold: true, color: NAVY },
    { text: s.active, bold: true, color: GREEN },
    { text: s.inactive, color: s.inactive > 0 ? AMBER : GRAY_TEXT },
    { text: s.note, align: 'left', color: GRAY_TEXT, size: 12 },
  ]));
  return (
    <ContentSlide titleTh="สรุปผลซอฟต์แวร์ / ลิขสิทธิ์" titleEn="รายการซอฟต์แวร์ในระบบ" page={5} {...props}>
      <SlideTable
        columns={[
          { label: 'ลำดับ', w: 0.6 }, { label: 'ซอฟต์แวร์', w: 3.4, align: 'left' },
          { label: 'จำนวน', w: 0.9 }, { label: 'ใช้งาน', w: 0.9, headColor: '#A8FFB0' },
          { label: 'คงเหลือ', w: 1.0, headColor: '#FFD0D0' }, { label: 'หมายเหตุ', w: 4.73, align: 'left' },
        ]}
        rows={rows} empty="ไม่มีข้อมูล"
      />
    </ContentSlide>
  );
}

function RDSlide({ rdProjects, ...props }) {
  const rows = (rdProjects || []).map((p, i) => ([
    { text: i + 1 },
    { text: p.project || '–', align: 'left', bold: true },
    { text: p.details || '', align: 'left' },
    { text: p.status || '–', color: statusColor(p.status), bold: true },
    { text: p.due || '–' },
    { text: p.remarks || '', align: 'left', color: GRAY_TEXT },
  ]));
  return (
    <ContentSlide titleTh="สรุปภาพรวม สถานะโปรเจค" titleEn="สถานะโปรเจค R&D" page={6} {...props}>
      <SlideTable
        columns={[
          { label: 'ลำดับ', w: 0.5 }, { label: 'โปรเจค', w: 2.5, align: 'left' },
          { label: 'รายละเอียด', w: 4.3, align: 'left' }, { label: 'สถานะ', w: 1.5 },
          { label: 'กำหนด', w: 1.0 }, { label: 'หมายเหตุ', w: 2.73, align: 'left' },
        ]}
        rows={rows} empty="ยังไม่มีโปรเจค"
      />
    </ContentSlide>
  );
}

function FollowupSlide({ followUps, ...props }) {
  const rows = (followUps || []).map((f, i) => ([
    { text: i + 1 },
    { text: f.details || '', align: 'left' },
    { text: f.status || '–', color: statusColor(f.status), bold: true },
    { text: f.due || '–' },
    { text: f.remarks || '', align: 'left', color: GRAY_TEXT },
  ]));
  return (
    <ContentSlide titleTh="วาระติดตาม" titleEn="รายการติดตามงาน" page={7} {...props}>
      <SlideTable
        columns={[
          { label: 'ลำดับ', w: 0.5 }, { label: 'รายละเอียด', w: 5.5, align: 'left' },
          { label: 'สถานะ', w: 1.5 }, { label: 'กำหนด', w: 1.0 }, { label: 'หมายเหตุ', w: 4.03, align: 'left' },
        ]}
        rows={rows} empty="ไม่มีวาระติดตาม"
      />
    </ContentSlide>
  );
}

function ThankYouSlide({ company, month, year }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: NAVY }}>
      <div style={{ position: 'absolute', top: 518, left: 0, right: 0, height: 11, background: BLUE_LIGHT }} />
      <div style={{ position: 'absolute', top: 529, left: 0, right: 0, bottom: 0, background: NAVY_BAND }} />
      <div style={{ position: 'absolute', top: 170, left: 80, right: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 82, fontWeight: 800, color: '#fff' }}>ขอบคุณครับ</div>
      </div>
      <div style={{ position: 'absolute', top: 548, left: 80, right: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: BLUE_LIGHT }}>{company.toUpperCase()}</div>
        <div style={{ fontSize: 16, color: '#90B4CC', marginTop: 10 }}>รายงานผล IT – {TH_MONTHS[month]} {year + 543}</div>
      </div>
    </div>
  );
}

/* ════════════════ EDIT PANEL PRIMITIVES ════════════════ */
const fld = 'w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-[13px] text-stone-800 outline-none transition focus:ring-2 focus:ring-clay-600/20 focus:border-clay-600';
const lbl = 'block text-[11px] font-semibold text-stone-500 mb-1';

function Fld({ label, children }) {
  return <div><label className={lbl}>{label}</label>{children}</div>;
}

/* ตัวแก้ไขรายการแถว (ใช้ร่วมทุกตาราง) */
function RowsEditor({ rows, setRows, columns, makeEmpty, addLabel, itemLabel }) {
  const update = (i, k, v) => setRows(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const remove = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const add = () => setRows([...rows, makeEmpty()]);
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-stone-400">{itemLabel} #{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-stone-300 hover:text-rose-500 transition-colors" aria-label="ลบแถว">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {columns.map((c) => (
              <div key={c.key} className={c.span === 'full' ? 'col-span-2' : ''}>
                <label className={lbl}>{c.label}</label>
                {c.type === 'textarea' ? (
                  <textarea value={r[c.key] ?? ''} onChange={e => update(i, c.key, e.target.value)} rows={2} className={fld} placeholder={c.ph} />
                ) : c.type === 'select' ? (
                  <select value={r[c.key] ?? ''} onChange={e => update(i, c.key, e.target.value)} className={fld}>
                    {(c.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : c.type === 'number' ? (
                  <input type="number" value={r[c.key] ?? 0} onChange={e => update(i, c.key, toNum(e.target.value))} className={fld} />
                ) : (
                  <input value={r[c.key] ?? ''} onChange={e => update(i, c.key, e.target.value)} className={fld} placeholder={c.ph} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-semibold text-clay-600 hover:text-clay-800 border border-dashed border-clay-600/40 hover:border-clay-600 px-3 py-2 rounded-lg transition-colors w-full justify-center">
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  );
}

/* แผงแก้ไขของแต่ละสไลด์ */
function EditPanel({ idx, edit, set }) {
  const { companyName, month, year, stats } = edit;
  if (idx === 0) {   // Cover
    return (
      <div className="space-y-3">
        <Fld label="ชื่อบริษัท">
          <input value={companyName} onChange={e => set.companyName(e.target.value)} className={fld} />
        </Fld>
        <div className="grid grid-cols-2 gap-2">
          <Fld label="เดือน">
            <select value={month} onChange={e => set.month(Number(e.target.value))} className={fld}>
              {TH_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </Fld>
          <Fld label="ปี (ค.ศ.)">
            <input type="number" value={year} onChange={e => set.year(Number(e.target.value))} className={fld} />
          </Fld>
        </div>
        <p className="text-[11px] text-stone-400">* ชื่อบริษัท / เดือน / ปี มีผลกับทุกสไลด์</p>
      </div>
    );
  }
  if (idx === 2) {   // Support
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Fld label="พนักงานทั้งหมด"><input type="number" value={stats.employees} onChange={e => set.stat('employees', toNum(e.target.value))} className={fld} /></Fld>
          <Fld label="เคสทั้งหมด"><input type="number" value={stats.monthly} onChange={e => set.stat('monthly', toNum(e.target.value))} className={fld} /></Fld>
          <Fld label="ปิดสำเร็จ"><input type="number" value={stats.closedWon} onChange={e => set.stat('closedWon', toNum(e.target.value))} className={fld} /></Fld>
          <Fld label="ไม่สำเร็จ"><input type="number" value={stats.closedLose} onChange={e => set.stat('closedLose', toNum(e.target.value))} className={fld} /></Fld>
        </div>
        <div>
          <p className="text-[12px] font-medium text-stone-600 mb-1.5">🔴 ประเด็นสำคัญ (Big Issues)</p>
          <RowsEditor rows={edit.bigIssues} setRows={set.bigIssues} itemLabel="Issue" addLabel="เพิ่ม Issue"
            makeEmpty={() => ({ issue: '', raiseBy: 'All', status: '⏳ In Progress', due: '' })}
            columns={[
              { key: 'issue', label: 'ปัญหา', type: 'textarea', span: 'full', ph: 'อธิบาย issue...' },
              { key: 'raiseBy', label: 'แจ้งโดย', ph: 'All / ชื่อ' },
              { key: 'status', label: 'สถานะ', type: 'select', options: STATUS_OPTIONS },
              { key: 'due', label: 'กำหนด', span: 'full', ph: 'วว/ดด/ปปปป' },
            ]} />
        </div>
      </div>
    );
  }
  if (idx === 3) {   // Hardware
    return (
      <RowsEditor rows={edit.hwSummary} setRows={set.hwSummary} itemLabel="อุปกรณ์" addLabel="เพิ่มประเภทอุปกรณ์"
        makeEmpty={() => ({ type: '', total: 0, inUse: 0, avail: 0, broken: 0, note: '–' })}
        columns={[
          { key: 'type', label: 'ประเภทอุปกรณ์', span: 'full', ph: 'เช่น โน้ตบุ๊ค' },
          { key: 'total', label: 'รวม', type: 'number' },
          { key: 'inUse', label: 'ใช้งาน', type: 'number' },
          { key: 'avail', label: 'พร้อมส่งมอบ', type: 'number' },
          { key: 'broken', label: 'ชำรุด', type: 'number' },
          { key: 'note', label: 'หมายเหตุ', span: 'full', ph: '–' },
        ]} />
    );
  }
  if (idx === 4) {   // Software
    return (
      <RowsEditor rows={edit.swSummary} setRows={set.swSummary} itemLabel="ซอฟต์แวร์" addLabel="เพิ่มซอฟต์แวร์"
        makeEmpty={() => ({ name: '', stock: 0, active: 0, inactive: 0, note: '–' })}
        columns={[
          { key: 'name', label: 'ซอฟต์แวร์', span: 'full', ph: 'เช่น Microsoft 365' },
          { key: 'stock', label: 'จำนวน', type: 'number' },
          { key: 'active', label: 'ใช้งาน', type: 'number' },
          { key: 'inactive', label: 'คงเหลือ', type: 'number' },
          { key: 'note', label: 'หมายเหตุ', span: 'full', ph: '–' },
        ]} />
    );
  }
  if (idx === 5) {   // R&D
    return (
      <RowsEditor rows={edit.rdProjects} setRows={set.rdProjects} itemLabel="โปรเจค" addLabel="เพิ่มโปรเจค"
        makeEmpty={() => ({ project: '', details: '', status: '⏳ In Progress', due: '', remarks: '' })}
        columns={[
          { key: 'project', label: 'ชื่อโปรเจค', span: 'full', ph: 'ชื่อโปรเจค' },
          { key: 'details', label: 'รายละเอียด', type: 'textarea', span: 'full', ph: 'รายละเอียด...' },
          { key: 'status', label: 'สถานะ', type: 'select', options: STATUS_OPTIONS },
          { key: 'due', label: 'กำหนด', ph: 'วว/ดด/ปปปป' },
          { key: 'remarks', label: 'หมายเหตุ', span: 'full', ph: 'หมายเหตุ' },
        ]} />
    );
  }
  if (idx === 6) {   // Follow-up
    return (
      <RowsEditor rows={edit.followUps} setRows={set.followUps} itemLabel="วาระ" addLabel="เพิ่มวาระ"
        makeEmpty={() => ({ details: '', status: '⏳ In Progress', due: '', remarks: '' })}
        columns={[
          { key: 'details', label: 'รายละเอียด', type: 'textarea', span: 'full', ph: 'รายละเอียดวาระ...' },
          { key: 'status', label: 'สถานะ', type: 'select', options: STATUS_OPTIONS },
          { key: 'due', label: 'กำหนด', ph: 'วว/ดด/ปปปป' },
          { key: 'remarks', label: 'หมายเหตุ', span: 'full', ph: 'หมายเหตุ' },
        ]} />
    );
  }
  // Agenda / Thank you — ไม่มีข้อมูลให้แก้
  return (
    <div className="text-center text-stone-400 text-[13px] py-10">
      สไลด์นี้เป็นเทมเพลตคงที่<br />ไม่มีข้อมูลที่ต้องแก้ไข
    </div>
  );
}

/* ════════════════ MAIN ════════════════ */
export default function ITReportPreview({ isOpen, onClose, onExport, exporting, data }) {
  const [idx, setIdx] = useState(0);

  const total = 8;
  const labels = ['ปก', 'สารบัญ', 'ฝ่ายสนับสนุน', 'ฮาร์ดแวร์', 'ซอฟต์แวร์', 'R&D', 'วาระติดตาม', 'ขอบคุณ'];

  const go = useCallback((dir) => setIdx(i => Math.min(total - 1, Math.max(0, i + dir))), [total]);

  useEffect(() => { if (isOpen) setIdx(0); }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, go, onClose]);

  if (!isOpen) return null;

  // read-only — สะท้อนข้อมูลที่แก้จากหน้าหลักโดยตรง
  const slides = [
    () => <CoverSlide {...data} />,
    () => <AgendaSlide {...data} />,
    () => <SupportSlide {...data} />,
    () => <HardwareSlide {...data} />,
    () => <SoftwareSlide {...data} />,
    () => <RDSlide {...data} />,
    () => <FollowupSlide {...data} />,
    () => <ThankYouSlide {...data} />,
  ];

  return (
    <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm flex flex-col z-[90]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0">
        <div className="flex items-center gap-3 text-white">
          <span className="text-[15px] font-semibold">ตัวอย่าง PowerPoint</span>
          <span className="text-[13px] text-stone-300">สไลด์ {idx + 1} / {total} · {labels[idx]}</span>
        </div>
        <button onClick={onClose} className="text-stone-300 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors" aria-label="ปิด">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Stage */}
      <div className="flex-1 flex items-center justify-center gap-4 px-4 min-h-0">
        <button onClick={() => go(-1)} disabled={idx === 0}
          className="shrink-0 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed" aria-label="ก่อนหน้า">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="w-full max-w-5xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(74,43,41,0.20)] rounded-lg overflow-hidden ring-1 ring-white/10">
          <SlideCanvas>{slides[idx]()}</SlideCanvas>
        </div>
        <button onClick={() => go(1)} disabled={idx === total - 1}
          className="shrink-0 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed" aria-label="ถัดไป">
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Bottom: dots + export */}
      <div className="shrink-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/35 hover:bg-white/60'}`}
              aria-label={`ไปสไลด์ ${i + 1}`} />
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg font-medium text-[14px] text-stone-200 bg-white/10 hover:bg-white/20 transition-colors">
            ปิด
          </button>
          <button onClick={() => onExport()} disabled={exporting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[14px] transition-colors ${exporting ? 'bg-stone-500 text-stone-300 cursor-not-allowed' : 'bg-white text-clay-600 hover:bg-stone-100'}`}>
            {exporting ? <><Loader2 className="h-4 w-4 animate-spin" /> กำลังสร้างไฟล์...</> : <><FileDown className="h-4 w-4" strokeWidth={2} /> Export .pptx</>}
          </button>
        </div>
      </div>
    </div>
  );
}
