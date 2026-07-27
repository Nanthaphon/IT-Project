import React, { useState, useEffect, useMemo } from 'react';
import { X, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, Layers, Eye, Package, Loader2 } from 'lucide-react';
import { db } from '../firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/* ════════════════════════════════════════════════
   CSV parser — รองรับ quoted fields + comma in fields
════════════════════════════════════════════════ */
function parseCSV(text) {
  const cleaned = text.replace(/^﻿/, ''); // strip BOM
  const lines = cleaned.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const out = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        out.push(cur.trim()); cur = '';
      } else cur += c;
    }
    out.push(cur.trim());
    return out;
  };

  const headers = parseLine(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cells = parseLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i] || ''; });
    return row;
  });
  return { headers, rows };
}

/* ════════════════════════════════════════════════
   หา header ใน CSV — case-insensitive + fuzzy
════════════════════════════════════════════════ */
function findHeader(headers, candidates) {
  const norm = (s) => s.toLowerCase().replace(/[\s_-]+/g, '');
  for (const cand of candidates) {
    const target = norm(cand);
    const found = headers.find(h => norm(h) === target);
    if (found) return found;
  }
  return null;
}

/* ════════════════════════════════════════════════
   Map Snipe-IT date (e.g., "02/12/2027" MM/DD/YYYY or DD/MM/YYYY)
   → ISO YYYY-MM-DD
════════════════════════════════════════════════ */
function normalizeDate(s) {
  if (!s) return '';
  const t = String(s).trim();
  if (!t || t === '-') return '';
  // ISO already?
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  // MM/DD/YYYY or DD/MM/YYYY
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    // Assume MM/DD/YYYY (Snipe-IT default)
    const [_, mm, dd, yyyy] = m;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return t;
}

function normalizeCost(s) {
  if (!s) return 0;
  const cleaned = String(s).replace(/[฿,\s]/g, '');
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

/* ════════════════════════════════════════════════
   จัดกลุ่ม Snipe-IT rows → licenses (1 parent + N seats)
════════════════════════════════════════════════ */
function groupLicenses(rows, headerMap, allHeaders) {
  // Column ที่ map กับ field ของระบบแล้ว → ไม่ต้องเก็บใน note อีก
  const mappedHeaders = new Set(Object.values(headerMap).filter(Boolean));
  // Column ที่ระบบ "ไม่สนใจ" (auto-calculate) → ไม่เก็บใน note
  const ignoredHeaders = new Set(['id', 'total', 'avail', 'createdat', 'updatedat', 'admin']);

  const groups = new Map();
  for (const row of rows) {
    const name = (row[headerMap.name] || '').trim();
    if (!name) continue;

    if (!groups.has(name)) {
      groups.set(name, {
        name,
        productKeys: [],
        keyCodes: [],
        seatCosts: [],
        assigneeEmails: [],
        expirationDate: '',
        purchaseDate: '',
        terminationDate: '',
        purchaseOrderNumber: '',
        reassignable: '',
        minQty: 0,
        supplier: '',
        cost: 0,
        notes: '',
        category: '',
        manufacturer: '',
        company: '',
        extras: {},  // 🆕 เก็บ column ที่ไม่รู้จัก
        rows: 0,
      });
    }
    const g = groups.get(name);
    g.rows += 1;

    // 🆕 เก็บ column ที่ไม่รู้จักลง extras
    for (const h of allHeaders) {
      if (mappedHeaders.has(h)) continue;
      if (ignoredHeaders.has(h.toLowerCase().replace(/[\s_-]+/g, ''))) continue;
      const v = (row[h] || '').trim();
      if (!v) continue;
      // ถ้ายังไม่มีค่านี้ → เก็บไว้
      if (!g.extras[h]) g.extras[h] = v;
    }

    // เก็บ Product Key (ทุก row)
    const pk = headerMap.productKey ? (row[headerMap.productKey] || '').trim() : '';
    if (pk) g.productKeys.push(pk);

    // เก็บ assignee email (ถ้ามี)
    const email = headerMap.licensedEmail ? (row[headerMap.licensedEmail] || '').trim() : '';
    if (email) g.assigneeEmails.push(email);

    // ใช้ค่าจาก row แรกที่มี (เผื่อ row อื่นเว้น)
    if (!g.expirationDate && headerMap.expirationDate) {
      g.expirationDate = normalizeDate(row[headerMap.expirationDate]);
    }
    if (!g.purchaseDate && headerMap.purchaseDate) {
      g.purchaseDate = normalizeDate(row[headerMap.purchaseDate]);
    }
    if (!g.supplier && headerMap.supplier) {
      g.supplier = (row[headerMap.supplier] || '').trim();
    }
    if (!g.manufacturer && headerMap.manufacturer) {
      g.manufacturer = (row[headerMap.manufacturer] || '').trim();
    }
    if (!g.category && headerMap.category) {
      g.category = (row[headerMap.category] || '').trim();
    }
    if (!g.company && headerMap.company) {
      g.company = (row[headerMap.company] || '').trim();
    }
    if (!g.notes && headerMap.notes) {
      g.notes = (row[headerMap.notes] || '').trim();
    }
    if (!g.cost && headerMap.cost) {
      g.cost = normalizeCost(row[headerMap.cost]);
    }
    if (!g.terminationDate && headerMap.terminationDate) {
      g.terminationDate = normalizeDate(row[headerMap.terminationDate]);
    }
    if (!g.purchaseOrderNumber && headerMap.purchaseOrderNumber) {
      g.purchaseOrderNumber = (row[headerMap.purchaseOrderNumber] || '').trim();
    }
    if (!g.reassignable && headerMap.reassignable) {
      g.reassignable = (row[headerMap.reassignable] || '').trim();
    }
    if (!g.minQty && headerMap.minQty) {
      g.minQty = Number(row[headerMap.minQty]) || 0;
    }
  }

  // แปลงเป็น array สำหรับ Firestore
  return Array.from(groups.values()).map(g => {
    // สร้าง note: รวม metadata + extras
    const noteParts = [
      g.manufacturer ? `Manufacturer: ${g.manufacturer}` : '',
      g.category ? `Category: ${g.category}` : '',
      g.company ? `Company: ${g.company}` : '',
      g.notes ? `Notes: ${g.notes}` : '',
      // 🆕 รวม extras (column ที่ระบบไม่มี field รองรับ)
      ...Object.entries(g.extras).map(([k, v]) => `${k}: ${v}`),
    ].filter(Boolean);

    return {
      name: g.name,
      productKey: g.productKeys[0] || '',
      keyCode: '',
      supplier: g.supplier || g.manufacturer || '',
      purchaseDate: g.purchaseDate,
      expirationDate: g.expirationDate,
      // 🆕 fields ใหม่ที่เพิ่มในระบบ
      terminationDate: g.terminationDate,
      purchaseOrderNumber: g.purchaseOrderNumber,
      reassignable: g.reassignable,
      minQty: g.minQty,
      cost: g.cost,
      quantity: g.rows,
      availableKeys: g.productKeys,
      note: noteParts.join(' | '),
      _meta: {
        rows: g.rows,
        assigneeEmails: g.assigneeEmails,
        manufacturer: g.manufacturer,
        category: g.category,
        extras: g.extras,
        extrasCount: Object.keys(g.extras).length,
      },
    };
  });
}

/* ════════════════════════════════════════════════
   Modal Component
════════════════════════════════════════════════ */
export default function SnipeITImportModal({ isOpen, onClose, onSuccess }) {
  const [csvText, setCsvText] = useState('');
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // ── parse + group ──
  const parsed = useMemo(() => {
    if (!csvText) return null;
    try {
      const { headers, rows } = parseCSV(csvText);
      if (headers.length === 0) return { error: 'ไม่พบ header ใน CSV' };
      // map Snipe-IT columns
      const headerMap = {
        name:                findHeader(headers, ['Name', 'License Name', 'Software Name']),
        productKey:          findHeader(headers, ['Product Key', 'License Key', 'Key']),
        expirationDate:      findHeader(headers, ['Expiration Date', 'Expiration', 'Expires']),
        purchaseDate:        findHeader(headers, ['Purchase Date']),
        licensedEmail:       findHeader(headers, ['Licensed to Email', 'Licensed Email']),
        licensedName:        findHeader(headers, ['Licensed to Name', 'Licensed Name']),
        manufacturer:        findHeader(headers, ['Manufacturer', 'Maker']),
        category:            findHeader(headers, ['Category']),
        supplier:            findHeader(headers, ['Supplier']),
        company:             findHeader(headers, ['Company']),
        cost:                findHeader(headers, ['Purchase Cost', 'Cost', 'Price']),
        notes:               findHeader(headers, ['Notes', 'Note', 'Remarks']),
        // 🆕 fields ใหม่
        terminationDate:     findHeader(headers, ['Termination Date', 'Terminate Date']),
        purchaseOrderNumber: findHeader(headers, ['Purchase Order Number', 'Purchase Order', 'PO Number', 'Order Number']),
        reassignable:        findHeader(headers, ['Reassignable']),
        minQty:              findHeader(headers, ['Min QTY', 'Minimum Quantity', 'Min Quantity']),
      };
      if (!headerMap.name) return { error: 'ไม่พบคอลัมน์ "Name" — กรุณา export ใหม่พร้อมคอลัมน์ Name' };
      const grouped = groupLicenses(rows, headerMap, headers);
      return { headers, rows, headerMap, grouped };
    } catch (err) {
      return { error: err.message };
    }
  }, [csvText]);

  const handleFile = (file) => {
    setParseError('');
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result);
    reader.onerror = () => setParseError('อ่านไฟล์ไม่สำเร็จ');
    reader.readAsText(file, 'utf-8');
  };

  const handleConfirmImport = async () => {
    if (!parsed?.grouped) return;
    setImporting(true);
    let success = 0; let failed = 0;
    try {
      for (const lic of parsed.grouped) {
        try {
          const { _meta, ...payload } = lic;
          await addDoc(collection(db, 'licenses'), {
            ...payload,
            assignees: [],
            image: null,
            status: 'พร้อมใช้งาน',
            assignedTo: null,
            assignedName: null,
            createdAt: serverTimestamp(),
          });
          success++;
        } catch (e) { failed++; console.error('Failed:', lic.name, e); }
      }
      setImportResult({ success, failed, total: parsed.grouped.length });
      if (failed === 0) onSuccess?.(success);
    } finally { setImporting(false); }
  };

  const reset = () => {
    setCsvText('');
    setParseError('');
    setImporting(false);
    setImportResult(null);
  };

  const close = () => { reset(); onClose(); };

  // 🔒 ล็อก scroll — global observer ใน App.jsx จัดการให้แล้ว

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 z-[90] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(16,47,87,0.04),0_10px_28px_-16px_rgba(16,47,87,0.12)] w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200/60">

        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF', color: '#1E487A' }}>
            <FileSpreadsheet className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className="text-[17px] font-bold text-slate-800">Smart Import จาก Snipe-IT</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">อัปโหลด CSV → ระบบ auto-group เป็น license พร้อม preview ก่อน import</p>
          </div>
          <button onClick={close} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700">
            <X className="h-4.5 w-4.5" strokeWidth={2} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">

          {/* Step 1: Upload */}
          {!csvText && (
            <UploadArea onFile={handleFile} />
          )}

          {/* Step 2: Preview */}
          {csvText && parsed && !importResult && (
            <>
              {parsed.error ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="font-bold text-rose-700">{parsed.error}</p>
                    <p className="text-[13px] text-rose-600 mt-1">กรุณาตรวจสอบไฟล์ และอัปโหลดใหม่</p>
                  </div>
                </div>
              ) : (
                <PreviewSection parsed={parsed} />
              )}
            </>
          )}

          {/* Step 3: Result */}
          {importResult && (
            <ResultSection result={importResult} onClose={close} onAnother={reset} />
          )}
        </div>

        {/* ── Footer ── */}
        {csvText && parsed && !parsed.error && !importResult && (
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
            <button onClick={reset} className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-800 transition-colors">
              ← เลือกไฟล์ใหม่
            </button>
            <div className="flex gap-2.5">
              <button onClick={close} className="px-4 py-2 text-[13px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing || !parsed.grouped?.length}
                className="inline-flex items-center gap-2 px-5 py-2 text-[13px] font-semibold text-white bg-[#1E487A] hover:bg-[#163963] rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} /> กำลัง Import...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" strokeWidth={2.4} /> ยืนยัน Import {parsed.grouped.length} license</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   Upload Area Component
════════════════════════════════════════════════ */
function UploadArea({ onFile }) {
  const [drag, setDrag] = useState(false);

  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={`block cursor-pointer rounded-xl border-2 border-dashed transition-colors p-12 text-center ${
          drag
            ? 'border-[#1E487A] bg-[#1E487A]/5'
            : 'border-slate-300 hover:border-[#1E487A]/50 bg-white hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
          className="hidden"
        />
        <div className="w-14 h-14 rounded-xl bg-[#1E487A]/10 flex items-center justify-center mx-auto mb-4">
          <Upload className="h-7 w-7 text-[#1E487A]" strokeWidth={2} />
        </div>
        <p className="text-[15px] font-bold text-slate-800 mb-1">ลาก CSV จาก Snipe-IT มาวาง</p>
        <p className="text-[13px] text-slate-500">หรือคลิกเพื่อเลือกไฟล์</p>
        <p className="text-[11.5px] text-slate-400 mt-3">รองรับไฟล์ .csv ที่ export จาก Snipe-IT</p>
      </label>

      {/* Info */}
      <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-2">
        <p className="text-[12.5px] font-bold text-blue-900 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" strokeWidth={2.2} />
          ระบบจะทำอะไรให้:
        </p>
        <ul className="text-[12px] text-blue-900/85 space-y-1 pl-5 list-disc">
          <li>อ่าน CSV ทุก row → group ตามชื่อโปรแกรม</li>
          <li>1 ชื่อโปรแกรม = 1 license หลัก + เก็บ Product Key ทุก row เป็น seats</li>
          <li>Map columns: Name / Product Key / Expiration Date / Manufacturer / Purchase Date / Notes</li>
          <li>แสดง preview ก่อน import — ตรวจสอบได้</li>
        </ul>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   Preview Section
════════════════════════════════════════════════ */
function PreviewSection({ parsed }) {
  const { headers, rows, headerMap, grouped } = parsed;
  const totalSeats = grouped.reduce((s, g) => s + g.quantity, 0);
  const mapped = Object.entries(headerMap).filter(([_, v]) => v).map(([k, v]) => ({ field: k, csv: v }));
  const missing = Object.entries(headerMap).filter(([_, v]) => !v).map(([k]) => k);

  return (
    <div className="space-y-4">

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="แถวใน CSV" value={rows.length} color="#64748B" bg="#F1F5F9" />
        <StatBox label="License (หลัง group)" value={grouped.length} color="#1E487A" bg="#EFF6FF" />
        <StatBox label="Seats รวม" value={totalSeats} color="#059669" bg="#ECFDF5" />
      </div>

      {/* Column mapping info */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-[12.5px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" strokeWidth={2.2} />
          จับคู่ Columns สำเร็จ ({mapped.length} ฟิลด์)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {mapped.map(m => (
            <span key={m.field} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
              {m.csv} → <span className="font-bold">{m.field}</span>
            </span>
          ))}
        </div>
        {missing.length > 0 && (
          <p className="text-[11px] text-slate-400 mt-2.5">
            ไม่พบใน CSV (จะเว้นว่าง): {missing.join(', ')}
          </p>
        )}
      </div>

      {/* Grouped licenses list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <p className="text-[13px] font-bold text-slate-700">Preview: {grouped.length} licenses ที่จะนำเข้า</p>
        </div>
        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
          {grouped.map((g, i) => (
            <LicenseRow key={i} lic={g} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LicenseRow({ lic }) {
  const [expand, setExpand] = useState(false);
  const allKeys = lic.availableKeys || [];
  const showKeys = expand ? allKeys : allKeys.slice(0, 3);

  return (
    <div className="px-4 py-3 hover:bg-slate-50/60 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Package className="h-3.5 w-3.5 text-[#1E487A] shrink-0" strokeWidth={2} />
            <p className="text-[13.5px] font-bold text-slate-800 truncate">{lic.name}</p>
            <span className="text-[10.5px] font-bold text-[#1E487A] bg-blue-50 px-2 py-0.5 rounded">{lic.quantity} seats</span>
            {lic._meta?.extrasCount > 0 && (
              <span
                className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                title={Object.keys(lic._meta.extras).join(', ')}
              >
                +{lic._meta.extrasCount} ใน Notes
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-slate-500 ml-5">
            {lic._meta?.manufacturer && <span>🏢 {lic._meta.manufacturer}</span>}
            {lic.expirationDate && <span>📅 หมด: {lic.expirationDate}</span>}
            {lic.terminationDate && <span>⛔ ยกเลิก: {lic.terminationDate}</span>}
            {lic.purchaseOrderNumber && <span>📋 PO: {lic.purchaseOrderNumber}</span>}
            {lic.cost > 0 && <span>💰 ฿{lic.cost.toLocaleString()}</span>}
          </div>
          {allKeys.length > 0 && (
            <div className="ml-5 mt-1.5">
              <div className="flex flex-wrap gap-1">
                {showKeys.map((k, i) => (
                  <span key={i} className="text-[10.5px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[280px]" title={k}>
                    {k.length > 40 ? k.slice(0, 40) + '...' : k}
                  </span>
                ))}
                {allKeys.length > 3 && !expand && (
                  <button onClick={() => setExpand(true)} className="text-[10.5px] font-bold text-[#1E487A] hover:underline">
                    +{allKeys.length - 3} เพิ่มเติม
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color, bg }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: bg }}>
      <p className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: `${color}AA` }}>{label}</p>
      <p className="text-[22px] font-bold tabular-nums leading-tight" style={{ color }}>{value.toLocaleString()}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════
   Result Section
════════════════════════════════════════════════ */
function ResultSection({ result, onClose, onAnother }) {
  return (
    <div className="text-center py-8">
      <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
        result.failed === 0 ? 'bg-emerald-100' : 'bg-amber-100'
      }`}>
        {result.failed === 0
          ? <CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={2} />
          : <AlertTriangle className="h-10 w-10 text-amber-600" strokeWidth={2} />}
      </div>
      <h3 className="text-[20px] font-bold text-slate-800 mb-1">
        {result.failed === 0 ? 'Import สำเร็จ!' : 'Import เสร็จ (มีบาง license พลาด)'}
      </h3>
      <p className="text-[14px] text-slate-500 mb-6">
        นำเข้าสำเร็จ <span className="font-bold text-emerald-600">{result.success}</span> license
        {result.failed > 0 && <> · ล้มเหลว <span className="font-bold text-rose-600">{result.failed}</span></>}
      </p>
      <div className="flex justify-center gap-2.5">
        <button onClick={onAnother} className="px-5 py-2 text-[13px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          Import อีก
        </button>
        <button onClick={onClose} className="px-5 py-2 text-[13px] font-semibold text-white bg-[#1E487A] hover:bg-[#163963] rounded-lg shadow-sm">
          เสร็จสิ้น
        </button>
      </div>
    </div>
  );
}
