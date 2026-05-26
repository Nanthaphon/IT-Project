import React, { useState, useEffect, useRef } from 'react';
import {
  User, ArrowRight, ArrowLeft, Calendar, Camera, AlertTriangle, CheckCircle2,
  X, Clock, Pencil, Trash2, Save, Printer, Paperclip, Upload, Download,
  FileText, Image, File, ChevronDown, ChevronUp,
} from 'lucide-react';
import { doc, deleteDoc, updateDoc, collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase.js';
import ConditionCapture, {
  CHECKLIST_FIELDS, FIELD_STATUS_LABELS, EMPTY_FIELDS, flattenFields, migrateFields,
} from './ConditionCapture.jsx';
import PreReturnAssessmentModal from './PreReturnAssessmentModal.jsx';

// helper: คืน label ของสถานะตามฟิลด์ (ถ้าไม่รู้จัก field ใช้ default)
const labelOf = (fieldKey, value) =>
  (FIELD_STATUS_LABELS[fieldKey] || FIELD_STATUS_LABELS.body)[value] || value;

const STATUS_COLOR = {
  normal:  'text-emerald-700 bg-emerald-50 ring-emerald-200',
  scratch: 'text-amber-700 bg-amber-50 ring-amber-200',
  broken:  'text-rose-700 bg-rose-50 ring-rose-200',
};

/* ── format duration as "X ปี Y เดือน Z วัน" (Thai friendly) ── */
function formatDuration(fromTs, toTs) {
  if (!fromTs) return '';
  const ms = (toTs || Date.now()) - fromTs;
  if (ms < 0) return '';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return hours <= 0 ? 'ไม่กี่นาที' : `${hours} ชั่วโมง`;
  }
  if (days < 30) return `${days} วัน`;
  const years  = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remDays = (days % 365) % 30;
  const parts = [];
  if (years)  parts.push(`${years} ปี`);
  if (months) parts.push(`${months} เดือน`);
  if (remDays && !years) parts.push(`${remDays} วัน`);
  return parts.join(' ') || `${days} วัน`;
}

/* ── tx collection name from category ── */
const txCollectionOf = (category) =>
  category === 'accessories' ? 'accessories_transactions'
  : category === 'licenses' ? 'licenses_transactions'
  : 'assets_transactions';

/* ── file helper ── */
const fileIcon = (type) => {
  if (type?.startsWith('image/')) return <Image className="h-4 w-4 text-sky-500" strokeWidth={1.8} />;
  if (type === 'application/pdf')  return <FileText className="h-4 w-4 text-rose-500" strokeWidth={1.8} />;
  return <File className="h-4 w-4 text-slate-400" strokeWidth={1.8} />;
};
const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * OwnershipHistory — แสดงประวัติการครอบครองทรัพย์สิน
 *
 * Props:
 * - assetId: string
 * - transactions: array of all transactions
 * - currentHolder: { empName } | null  (current assignee, optional)
 */
export default function OwnershipHistory({
  assetId, transactions = [], currentHolder = null,
  asset = null,             // optional: full asset object (for print fields)
  employees = [],           // optional: lookup employee details for print
}) {
  const [viewerImage, setViewerImage] = useState(null);
  const [editPeriod, setEditPeriod] = useState(null);
  const [deletePeriod, setDeletePeriod] = useState(null);
  const [printReturnPeriod, setPrintReturnPeriod] = useState(null);

  // กรอง transactions ของ asset นี้ เรียงใหม่ → เก่า
  const relevant = transactions
    .filter(t => t.assetId === assetId)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // จับคู่ checkout-return เป็น "ช่วงครอบครอง"
  const periods = [];
  const checkouts = relevant.filter(t => t.action === 'เบิกจ่าย');
  const returns   = relevant.filter(t => t.action === 'รับคืน');

  checkouts.forEach(co => {
    const matchedReturn = returns.find(r =>
      (co.checkoutId && r.checkoutId === co.checkoutId) ||
      (!co.checkoutId && r.empId === co.empId && r.timestamp > co.timestamp)
    );
    periods.push({ checkout: co, return: matchedReturn });
  });

  if (periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <User className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">ยังไม่เคยส่งมอบให้พนักงานคนใด</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {periods.map((p, i) => {
          const isCurrent = !p.return;
          return (
            <PeriodCard
              key={p.checkout.id || i}
              period={p}
              isCurrent={isCurrent}
              assetId={assetId}
              onPhotoClick={setViewerImage}
              onEdit={() => setEditPeriod(p)}
              onDelete={() => setDeletePeriod(p)}
              onPrintReturn={() => setPrintReturnPeriod(p)}
            />
          );
        })}
      </div>

      {/* Image viewer modal */}
      {viewerImage && (
        <div
          onClick={() => setViewerImage(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <button
            onClick={() => setViewerImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
          <img
            src={viewerImage}
            alt="preview"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

      {/* Edit modal */}
      {editPeriod && (
        <EditPeriodModal
          period={editPeriod}
          onClose={() => setEditPeriod(null)}
        />
      )}

      {/* Delete confirm */}
      {deletePeriod && (
        <DeletePeriodConfirm
          period={deletePeriod}
          onClose={() => setDeletePeriod(null)}
        />
      )}

      {/* IT-FORM-002 pre-print modal */}
      {printReturnPeriod && (
        <PreReturnAssessmentModal
          isOpen={true}
          onClose={() => setPrintReturnPeriod(null)}
          employee={
            employees.find(e => String(e.empId) === String(printReturnPeriod.checkout.empId)) ||
            employees.find(e => e.id === printReturnPeriod.checkout.empId) ||
            { fullName: printReturnPeriod.checkout.empName, empId: printReturnPeriod.checkout.empId }
          }
          mainAsset={asset || { name: printReturnPeriod.checkout.assetName }}
          handoverDate={printReturnPeriod.checkout.timestamp}
          returnDate={printReturnPeriod.return?.timestamp}
          // ── Pre-fill 18 sub-items จาก 6 หมวด in-app ของ tx ทั้ง 2 ขา ──
          inAppFieldsReturn={printReturnPeriod.return?.returnFields}
          inAppFieldsHandover={printReturnPeriod.checkout?.checkoutFields}
        />
      )}
    </>
  );
}

/* ── Period Card ── */
function PeriodCard({ period, isCurrent, assetId, onPhotoClick, onEdit, onDelete, onPrintReturn }) {
  const [expanded, setExpanded] = useState(false);
  const [attachments, setAttachments] = useState(null); // ดึงครั้งเดียวต่อ card เพื่อแสดง count badge
  const { checkout, return: ret } = period;

  const fmt = (ts) => ts ? new Date(ts).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const duration = formatDuration(checkout.timestamp, ret?.timestamp);

  // เช็คความเสียหาย: เทียบ checkout vs return checklist
  const damages = [];
  if (ret?.returnChecklist && checkout?.checkoutChecklist) {
    CHECKLIST_FIELDS.forEach(f => {
      const before = checkout.checkoutChecklist[f.key] || 'normal';
      const after  = ret.returnChecklist[f.key] || 'normal';
      const severity = { normal: 0, scratch: 1, broken: 2 };
      if (severity[after] > severity[before]) {
        damages.push({ field: f.label, fieldKey: f.key, before, after });
      }
    });
  }

  // ── ดึงรายการเอกสารแนบของ period นี้ครั้งเดียว (เบามาก) ──
  useEffect(() => {
    if (!checkout.id) { setAttachments([]); return; }
    const q = query(
      collection(db, 'transaction_attachments'),
      where('checkoutId', '==', checkout.id)
    );
    getDocs(q)
      .then(snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (a.uploadedAt || 0) - (b.uploadedAt || 0));
        setAttachments(items);
      })
      .catch(() => setAttachments([]));
  }, [checkout.id]);

  const attachmentCount = attachments?.length || 0;

  return (
    <div className={`rounded-xl ring-1 ring-inset overflow-hidden ${
      isCurrent ? 'ring-[#1E487A]/30 bg-blue-50/40' : damages.length > 0 ? 'ring-rose-200 bg-rose-50/30' : 'ring-slate-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 py-3">
        {/* ── LEFT: Identity + meta ── */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            isCurrent ? 'bg-[#1E487A] text-white' : 'bg-slate-100 text-slate-500'
          }`}>
            <User className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            {/* Name + current pill */}
            <p className="text-[14px] font-semibold text-slate-800 truncate flex items-center gap-1.5 flex-wrap">
              {checkout.empName || '-'}
              {isCurrent && <span className="text-[11px] font-semibold text-[#1E487A] bg-[#1E487A]/10 px-1.5 py-0.5 rounded">ปัจจุบัน</span>}
            </p>
            {/* Date range */}
            <p className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
              <Calendar className="h-3 w-3" strokeWidth={2} />
              <span>{fmt(checkout.timestamp)}</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span className={ret ? '' : 'text-[#1E487A] font-semibold'}>
                {ret ? fmt(ret.timestamp) : 'ปัจจุบัน'}
              </span>
            </p>
            {/* Status badges row — Duration + Return-status + Attachment count */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {duration && (
                <span className={`inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-md ring-1 ring-inset ${
                  isCurrent
                    ? 'bg-[#1E487A]/8 text-[#1E487A] ring-[#1E487A]/20'
                    : 'bg-slate-50 text-slate-700 ring-slate-200'
                }`}>
                  <Clock className="h-3 w-3" strokeWidth={2.4} />
                  {isCurrent ? 'ครอบครองมาแล้ว' : 'ระยะเวลาใช้งาน'} {duration}
                </span>
              )}
              {damages.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200">
                  <AlertTriangle className="h-3 w-3" strokeWidth={2.4} /> เสียหาย {damages.length} จุด
                </span>
              )}
              {!damages.length && ret && (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} /> คืนปกติ
                </span>
              )}
              {attachmentCount > 0 && (
                <button
                  onClick={() => setExpanded(true)}
                  title="ดูเอกสารแนบ"
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-200 hover:text-slate-900 transition"
                >
                  <Paperclip className="h-3 w-3" strokeWidth={2.4} />
                  {attachmentCount} ไฟล์
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Action buttons (consolidated) ── */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Primary: Print return-form (only if returned) */}
          {ret && (
            <button
              onClick={onPrintReturn}
              title="พิมพ์ใบรับคืน (IT-FORM-002)"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11.5px] font-semibold text-[#1E487A] ring-1 ring-inset ring-[#1E487A]/30 bg-white hover:bg-[#1E487A] hover:text-white hover:ring-[#1E487A] transition"
            >
              <Printer className="h-3.5 w-3.5" strokeWidth={2.2} />
              <span className="hidden sm:inline">ใบรับคืน</span>
            </button>
          )}
          {/* Secondary: Edit (ghost) */}
          <button
            onClick={onEdit}
            title="แก้ไขประวัติช่วงนี้"
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          {/* Secondary: Delete (ghost) */}
          <button
            onClick={onDelete}
            title="ลบประวัติช่วงนี้"
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          {/* Expand toggle (chevron) */}
          <button
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'ย่อ' : 'รายละเอียด'}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[#1E487A] hover:bg-[#1E487A]/10 transition ml-0.5"
          >
            {expanded
              ? <ChevronUp   className="h-4 w-4" strokeWidth={2.4} />
              : <ChevronDown className="h-4 w-4" strokeWidth={2.4} />
            }
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-slate-200 p-4 space-y-4 bg-white">
          {/* Checkout snapshot */}
          <ConditionSnapshot
            label="ตอนส่งมอบ"
            Icon={ArrowRight}
            color="blue"
            fields={checkout.checkoutFields}
            photos={checkout.checkoutPhotos}
            checklist={checkout.checkoutChecklist}
            notes={checkout.checkoutNotes}
            onPhotoClick={onPhotoClick}
          />

          {/* Return snapshot (if returned) */}
          {ret && (
            <ConditionSnapshot
              label="ตอนรับคืน"
              Icon={ArrowLeft}
              color={damages.length > 0 ? 'rose' : 'emerald'}
              fields={ret.returnFields}
              photos={ret.returnPhotos}
              checklist={ret.returnChecklist}
              notes={ret.returnNotes}
              onPhotoClick={onPhotoClick}
            />
          )}

          {/* Damage summary */}
          {damages.length > 0 && (
            <div className="rounded-lg bg-rose-50 ring-1 ring-rose-200 p-3">
              <p className="text-[13px] font-bold text-rose-800 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
                ความเสียหายที่พบเทียบกับตอนส่งมอบ
              </p>
              <ul className="space-y-1">
                {damages.map((d, i) => (
                  <li key={i} className="text-[12.5px] text-rose-700">
                    • <span className="font-semibold">{d.field}:</span> {labelOf(d.fieldKey, d.before)} → {labelOf(d.fieldKey, d.after)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Attachment section (state lifted to PeriodCard) ── */}
          <AttachmentSection
            checkoutId={checkout.id}
            assetId={assetId}
            attachments={attachments}
            setAttachments={setAttachments}
          />
        </div>
      )}
    </div>
  );
}

/* ── Firestore-based file helpers ── */
const FILE_WARN_BYTES  = 1_500_000; // 1.5 MB → แจ้งเตือน
const FILE_MAX_BYTES   = 2_097_152; // 2 MB → บล็อก

// base64 ของ ~693 KB raw ≈ 950,000 ตัวอักษร → ต่ำกว่า Firestore 1 MB/doc อย่างปลอดภัย
const CHUNK_B64_SIZE   = 950_000;

/** Read a File and return its data-URL (base64 with MIME prefix) */
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload  = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
  reader.readAsDataURL(file);
});

/** Open/download a file from a reassembled base64 data-URL */
const openBase64File = (dataUrl, fileName, fileType) => {
  try {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const bytes  = atob(base64);
    const arr    = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: fileType || 'application/octet-stream' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.target   = '_blank';
    a.download = fileName || 'document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch (e) {
    console.error('[openBase64File]', e);
  }
};

/* ── Document type definitions ── */
const DOC_TYPES = [
  {
    value:   'handover',
    label:   'ใบส่งมอบ',
    formNo:  'IT-FORM-001',
    badge:   'bg-blue-50 text-blue-700 ring-blue-200',
    dot:     'bg-blue-500',
    iconBg:  'bg-blue-50',
    iconCol: 'text-blue-600',
  },
  {
    value:   'return',
    label:   'ใบรับคืน',
    formNo:  'IT-FORM-002',
    badge:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot:     'bg-emerald-500',
    iconBg:  'bg-emerald-50',
    iconCol: 'text-emerald-600',
  },
  {
    value:   'other',
    label:   'อื่นๆ',
    formNo:  '',
    badge:   'bg-slate-100 text-slate-600 ring-slate-200',
    dot:     'bg-slate-400',
    iconBg:  'bg-slate-50',
    iconCol: 'text-slate-500',
  },
];
const docTypeOf = (v) => DOC_TYPES.find(d => d.value === v) || DOC_TYPES[2];

/* ══════════════════════════════════════════════════════════════════
   Attachment Section — store files as base64 in Firestore
   (no Firebase Storage required — works on Spark free plan)
   ══════════════════════════════════════════════════════════════════ */
function AttachmentSection({ checkoutId, assetId, attachments, setAttachments }) {
  // state ของ attachments ถูก lift ไป PeriodCard (เพื่อแสดง count badge ใน header)
  const [pendingFile, setPendingFile] = useState(null);
  const [docType,     setDocType]     = useState('handover');
  const [otherLabel,  setOtherLabel]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [openingId, setOpeningId] = useState(null); // id ของ attachment ที่กำลัง fetch chunks
  const [error,     setError]     = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > FILE_MAX_BYTES) {
      setError(`ไฟล์ใหญ่เกินไป (${formatBytes(file.size)}) — รองรับสูงสุด ${formatBytes(FILE_MAX_BYTES)} ต่อไฟล์`);
      return;
    }
    setError('');
    setPendingFile({ file });
    setDocType('handover');
    setOtherLabel('');
  };

  const cancelPending = () => { setPendingFile(null); setError(''); };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    const { file } = pendingFile;
    setError('');
    setSaving(true);
    try {
      const dataUrl  = await fileToBase64(file);
      const base64   = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const mimeType = file.type || 'application/octet-stream';

      // ── ต้องการ chunking เมื่อ base64 เกิน ~950 KB ──
      const needsChunking = base64.length > CHUNK_B64_SIZE;

      const dt = docTypeOf(docType);
      const meta = {
        checkoutId,
        assetId,
        fileName:     file.name,
        fileSize:     file.size,
        fileType:     mimeType,
        fileData:     needsChunking ? null : dataUrl, // เก็บ inline ถ้าเล็กพอ
        isChunked:    needsChunking,
        chunkCount:   0,
        uploadedAt:   Date.now(),
        docType,
        docLabel:     docType === 'other'
                        ? (otherLabel.trim() || 'เอกสารอื่นๆ')
                        : `${dt.label} (${dt.formNo})`,
      };
      const docRef = await addDoc(collection(db, 'transaction_attachments'), meta);

      if (needsChunking) {
        // แบ่ง base64 เป็น chunk แต่ละ chunk ≤ CHUNK_B64_SIZE ตัวอักษร
        const chunks = [];
        for (let i = 0; i < base64.length; i += CHUNK_B64_SIZE) {
          chunks.push(base64.slice(i, i + CHUNK_B64_SIZE));
        }
        // เขียนทุก chunk ลง sub-collection พร้อมกัน
        await Promise.all(
          chunks.map((data, index) =>
            addDoc(collection(db, 'transaction_attachments', docRef.id, 'chunks'), { index, data })
          )
        );
        await updateDoc(docRef, { chunkCount: chunks.length });
        meta.chunkCount = chunks.length;
      }

      setAttachments(prev => [...(prev || []), { id: docRef.id, ...meta }]);
      setPendingFile(null);
    } catch (err) {
      console.error('[attachment save]', err);
      setError('บันทึกไม่สำเร็จ: ' + (err.message || 'โปรดลองอีกครั้ง'));
    } finally {
      setSaving(false);
    }
  };

  /** เปิดไฟล์ — ถ้า chunked ต้อง fetch chunks ก่อน แล้ว reassemble */
  const handleOpen = async (att) => {
    if (!att.isChunked) {
      openBase64File(att.fileData, att.fileName, att.fileType);
      return;
    }
    setOpeningId(att.id);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'transaction_attachments', att.id, 'chunks'),
          orderBy('index')
        )
      );
      const parts = snap.docs
        .map(d => ({ i: d.data().index, d: d.data().data }))
        .sort((a, b) => a.i - b.i)
        .map(c => c.d);
      const dataUrl = `data:${att.fileType};base64,${parts.join('')}`;
      openBase64File(dataUrl, att.fileName, att.fileType);
    } catch (err) {
      setError('เปิดไฟล์ไม่สำเร็จ: ' + (err.message || ''));
    } finally {
      setOpeningId(null);
    }
  };

  const handleDelete = async (att) => {
    try {
      // ถ้า chunked ต้องลบ sub-collection chunks ก่อน
      if (att.isChunked) {
        const snap = await getDocs(
          collection(db, 'transaction_attachments', att.id, 'chunks')
        );
        await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      }
      await deleteDoc(doc(db, 'transaction_attachments', att.id));
      setAttachments(prev => prev.filter(a => a.id !== att.id));
    } catch (err) {
      setError('ลบไม่สำเร็จ: ' + (err.message || ''));
    }
  };

  return (
    <div className="border-t border-dashed border-slate-200 pt-4">
      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5 text-slate-500" strokeWidth={2.2} />
          เอกสารแนบ (ฉบับลงนามแล้ว)
          {attachments?.length > 0 && (
            <span className="text-[11px] font-semibold bg-[#1E487A]/10 text-[#1E487A] px-1.5 py-0.5 rounded-full ml-0.5">
              {attachments.length}
            </span>
          )}
        </p>
        {!pendingFile && !saving && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1E487A] hover:bg-[#1E487A]/8 px-2.5 py-1 rounded-lg ring-1 ring-inset ring-[#1E487A]/20 transition"
          >
            <Upload className="h-3.5 w-3.5" strokeWidth={2.2} />
            แนบไฟล์
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Pending file: pick document type ── */}
      {pendingFile && !saving && (
        <div className="mb-4 rounded-xl ring-2 ring-[#1E487A]/20 bg-[#1E487A]/4 p-4">
          {/* File info row */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-white ring-1 ring-slate-200 flex items-center justify-center shrink-0">
              {fileIcon(pendingFile.file.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 truncate">{pendingFile.file.name}</p>
              <p className={`text-[11px] mt-0.5 ${pendingFile.file.size > FILE_WARN_BYTES ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                {formatBytes(pendingFile.file.size)}{pendingFile.file.size > FILE_WARN_BYTES ? ' — ไฟล์ค่อนข้างใหญ่' : ''}
              </p>
            </div>
            <button onClick={cancelPending} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-white transition">
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {/* Type selector label */}
          <p className="text-[12px] font-bold text-slate-700 mb-2.5">
            ระบุประเภทเอกสาร
            <span className="font-normal text-slate-400 ml-1">(ฉบับที่พนักงานลงนามแล้ว)</span>
          </p>

          {/* Type buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {DOC_TYPES.map(dt => (
              <button
                key={dt.value}
                onClick={() => setDocType(dt.value)}
                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl ring-2 transition-all text-center ${
                  docType === dt.value
                    ? `ring-[#1E487A] bg-white shadow-sm`
                    : 'ring-transparent bg-white/60 hover:bg-white hover:ring-slate-200'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dt.iconBg} ${dt.iconCol}`}>
                  <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                </div>
                <span className={`text-[12.5px] font-bold leading-tight ${docType === dt.value ? 'text-[#1E487A]' : 'text-slate-600'}`}>
                  {dt.label}
                </span>
                {dt.formNo && (
                  <span className={`text-[10.5px] font-medium ${docType === dt.value ? 'text-[#1E487A]/70' : 'text-slate-400'}`}>
                    {dt.formNo}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* "อื่นๆ" description input */}
          {docType === 'other' && (
            <input
              type="text"
              value={otherLabel}
              onChange={(e) => setOtherLabel(e.target.value)}
              placeholder="ระบุชื่อเอกสาร เช่น สัญญายืม, ใบเสร็จ..."
              className="w-full mb-3 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
            />
          )}

          {/* Confirm / cancel */}
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelPending}
              className="px-4 py-2 text-[12.5px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={confirmUpload}
              disabled={docType === 'other' && !otherLabel.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold text-white rounded-lg shadow-sm transition disabled:opacity-50"
              style={{ background: '#1E487A' }}
            >
              <Upload className="h-3.5 w-3.5" strokeWidth={2.2} />
              บันทึก
            </button>
          </div>
        </div>
      )}

      {/* ── Saving indicator ── */}
      {saving && (
        <div className="mb-4 rounded-xl bg-[#1E487A]/4 ring-1 ring-[#1E487A]/15 p-3 flex items-center gap-2.5">
          <div className="w-4 h-4 border-2 border-[#1E487A] border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-[12.5px] font-medium text-slate-700">กำลังบันทึกเอกสาร...</span>
        </div>
      )}

      {/* ── File list ── */}
      {attachments === null ? (
        <p className="text-[12px] text-slate-400 italic py-1">กำลังโหลดเอกสาร...</p>
      ) : attachments.length === 0 && !pendingFile && !saving ? (
        <div className="flex flex-col items-center justify-center py-5 rounded-xl bg-slate-50/60 ring-1 ring-dashed ring-slate-200">
          <Paperclip className="h-6 w-6 mb-1.5 text-slate-300" strokeWidth={1.5} />
          <p className="text-[12px] font-medium text-slate-400">ยังไม่มีเอกสารแนบ</p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            กด "แนบไฟล์" เพื่อแนบใบส่งมอบ / ใบรับคืน ฉบับลงนามแล้ว
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => {
            const dt = docTypeOf(att.docType);
            return (
              <div
                key={att.id}
                className="group flex items-center gap-3 rounded-xl bg-white ring-1 ring-slate-200 px-3 py-2.5 hover:ring-[#1E487A]/30 hover:shadow-sm transition-all"
              >
                {/* Doc-type badge (left strip) */}
                <div className={`shrink-0 flex flex-col items-center justify-center rounded-lg px-2 py-1.5 min-w-[60px] ring-1 ring-inset ${dt.badge}`}>
                  <FileText className="h-4 w-4 mb-0.5" strokeWidth={1.8} />
                  <span className="text-[10.5px] font-bold leading-tight text-center">{dt.label}</span>
                  {dt.formNo && (
                    <span className="text-[9.5px] font-medium opacity-70 leading-tight">{dt.formNo}</span>
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[13px] font-semibold text-slate-800 truncate leading-snug" title={att.fileName}>
                      {att.docType === 'other' && att.docLabel
                        ? att.docLabel
                        : att.fileName}
                    </p>
                    {/* "signed" chip */}
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.5} />
                      ลงนามแล้ว
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {att.docType === 'other' ? att.fileName : ''}
                    {att.docType === 'other' && att.fileName ? ' · ' : ''}
                    {formatBytes(att.fileSize)}
                    {att.uploadedAt
                      ? ` · แนบเมื่อ ${new Date(att.uploadedAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}`
                      : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpen(att)}
                    disabled={openingId === att.id}
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#1E487A] hover:bg-[#1E487A]/8 px-2.5 py-1.5 rounded-lg transition disabled:opacity-60"
                    title="เปิด / ดาวน์โหลด"
                  >
                    {openingId === att.id
                      ? <div className="w-3.5 h-3.5 border-2 border-[#1E487A] border-t-transparent rounded-full animate-spin" />
                      : <Download className="h-3.5 w-3.5" strokeWidth={2} />
                    }
                    <span className="hidden sm:inline">{openingId === att.id ? 'โหลด...' : 'เปิด'}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(att)}
                    title="ลบเอกสาร"
                    className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-[12px] text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2 mt-2 flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

/* ── Snapshot of one event (checkout or return) ── */
function ConditionSnapshot({ label, Icon, color, fields, photos = [], checklist = {}, notes, onPhotoClick }) {
  const colorCls = {
    blue:    'text-blue-700 bg-blue-50 ring-blue-200',
    emerald: 'text-emerald-700 bg-emerald-50 ring-emerald-200',
    rose:    'text-rose-700 bg-rose-50 ring-rose-200',
  }[color];

  // ── migrate ข้อมูลเก่า (key เก่า เช่น screen/body) → key ใหม่ก่อนแสดง ──
  const rawFields = fields && typeof fields === 'object' && Object.keys(fields).length > 0 ? fields : null;
  fields = rawFields ? migrateFields(rawFields) : fields;
  const hasFields = !!rawFields;
  const totalFieldPhotos = hasFields
    ? CHECKLIST_FIELDS.reduce((n, f) => n + ((fields[f.key]?.photos || []).length), 0)
    : 0;

  const hasFlatPhotos = Array.isArray(photos) && photos.length > 0;
  const hasChecklist = checklist && Object.keys(checklist).length > 0;

  return (
    <div>
      <p className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold px-2.5 py-1 rounded-full ring-1 ring-inset mb-2 ${colorCls}`}>
        <Icon className="h-3 w-3" strokeWidth={2.4} />
        {label}
      </p>

      {/* NEW shape: photos grouped per field */}
      {hasFields ? (
        (() => {
          const fieldsWithPhotos    = CHECKLIST_FIELDS.filter(f => (fields[f.key]?.photos || []).length > 0);
          const fieldsWithoutPhotos = CHECKLIST_FIELDS.filter(f => !(fields[f.key]?.photos || []).length);

          if (totalFieldPhotos === 0) {
            return (
              <div className="mb-3">
                <p className="text-[11.5px] text-slate-400 italic mb-2 flex items-center gap-1">
                  <Camera className="h-3 w-3" /> ไม่ได้แนบรูปใดๆ — แสดงเฉพาะสถานะ
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {fieldsWithoutPhotos.map(f => {
                    const v = fields[f.key]?.status || 'normal';
                    return (
                      <span key={f.key} className={`text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ${STATUS_COLOR[v]}`}>
                        <span className="text-slate-700/70 mr-1">{f.label}:</span>
                        <span className="font-semibold">{labelOf(f.key, v)}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-3 mb-3">
              {fieldsWithPhotos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fieldsWithPhotos.map(f => {
                    const cell = fields[f.key];
                    const v = cell.status || 'normal';
                    return (
                      <div key={f.key} className="flex gap-2.5 rounded-lg bg-white ring-1 ring-slate-200 p-2 hover:ring-[#1E487A]/30 hover:shadow-sm transition-all">
                        <div className="flex gap-1 shrink-0">
                          {cell.photos.slice(0, 2).map((src, i) => (
                            <button key={i} type="button" onClick={() => onPhotoClick(src)}
                              className="w-14 h-14 rounded-md overflow-hidden ring-1 ring-slate-200 hover:ring-[#1E487A] transition shrink-0 bg-slate-50">
                              <img src={src} alt={`${f.label}-${i}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                          {cell.photos.length > 2 && (
                            <button type="button" onClick={() => onPhotoClick(cell.photos[2])}
                              className="w-14 h-14 rounded-md ring-1 ring-slate-200 bg-slate-50 text-[10.5px] font-semibold text-slate-500 hover:ring-[#1E487A] hover:text-[#1E487A] transition flex items-center justify-center shrink-0">
                              +{cell.photos.length - 2}
                            </button>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <p className="text-[12.5px] font-semibold text-slate-800 leading-snug line-clamp-2" title={f.label}>{f.label}</p>
                          <span className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${STATUS_COLOR[v]}`}>
                            {labelOf(f.key, v)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {fieldsWithoutPhotos.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.06em] mb-1.5 flex items-center gap-1">
                    <Camera className="h-3 w-3 opacity-60" /> จุดที่ไม่ได้แนบรูป
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {fieldsWithoutPhotos.map(f => {
                      const v = fields[f.key]?.status || 'normal';
                      return (
                        <span key={f.key} className={`text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ${STATUS_COLOR[v]}`}>
                          <span className="text-slate-600 mr-1">{f.label}:</span>
                          <span className="font-semibold">{labelOf(f.key, v)}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()
      ) : (
        <>
          {hasFlatPhotos ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-3">
              {photos.map((src, i) => (
                <button key={i} type="button" onClick={() => onPhotoClick(src)}
                  className="aspect-square rounded-md overflow-hidden ring-1 ring-slate-200 hover:ring-[#1E487A] transition">
                  <img src={src} alt={`p-${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-slate-400 italic mb-3 flex items-center gap-1">
              <Camera className="h-3 w-3" /> ไม่ได้บันทึกรูป
            </p>
          )}
          {hasChecklist && (
            <div className="flex flex-wrap gap-1 mb-2">
              {CHECKLIST_FIELDS.map(f => {
                const v = checklist[f.key] || 'normal';
                return (
                  <span key={f.key} className={`text-[11px] font-medium px-1.5 py-0.5 rounded ring-1 ring-inset ${STATUS_COLOR[v]}`}>
                    {f.label}: {labelOf(f.key, v)}
                  </span>
                );
              })}
            </div>
          )}
        </>
      )}

      {notes && (
        <p className="text-[12.5px] text-slate-600 bg-slate-50 ring-1 ring-slate-200 rounded px-2 py-1.5 mt-1">
          💬 {notes}
        </p>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Edit Period Modal
   ════════════════════════════════════════════════════════════════ */
function EditPeriodModal({ period, onClose }) {
  const { checkout, return: ret } = period;
  const toInputDate = (ts) => ts ? new Date(ts).toISOString().slice(0, 16) : '';

  const buildFieldsFromLegacy = (checklist) => {
    if (!checklist) return EMPTY_FIELDS;
    const out = {};
    CHECKLIST_FIELDS.forEach(f => {
      out[f.key] = { status: checklist[f.key] || 'normal', photos: [] };
    });
    return out;
  };

  const [activeTab, setActiveTab] = useState('checkout');
  const [empName, setEmpName] = useState(checkout.empName || '');
  const [checkoutDate,   setCheckoutDate]   = useState(toInputDate(checkout.timestamp));
  const [checkoutNotes,  setCheckoutNotes]  = useState(checkout.checkoutNotes || '');
  const [checkoutFields, setCheckoutFields] = useState(() =>
    migrateFields(checkout.checkoutFields || buildFieldsFromLegacy(checkout.checkoutChecklist))
  );
  const [returnDate,   setReturnDate]   = useState(toInputDate(ret?.timestamp));
  const [returnNotes,  setReturnNotes]  = useState(ret?.returnNotes || '');
  const [returnFields, setReturnFields] = useState(() =>
    ret ? migrateFields(ret.returnFields || buildFieldsFromLegacy(ret.returnChecklist)) : EMPTY_FIELDS
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const estimateBytes = (fields) =>
    Object.values(fields || {}).reduce((sum, cell) => {
      const photos = cell?.photos || [];
      return sum + photos.reduce((s, b64) => s + (b64?.length || 0), 0);
    }, 0);
  const SOFT_LIMIT = 900_000;
  const HARD_LIMIT = 1_048_576;
  const coBytes = estimateBytes(checkoutFields);
  const rBytes  = ret ? estimateBytes(returnFields) : 0;
  const overSoftCO = coBytes > SOFT_LIMIT;
  const overSoftR  = rBytes > SOFT_LIMIT;
  const overHard   = coBytes > HARD_LIMIT || rBytes > HARD_LIMIT;

  const handleSave = async () => {
    setError('');
    if (overHard) {
      setError('รูปภาพรวมเกิน 1 MB ต่อบันทึก โปรดลบรูปบางส่วนออกก่อน');
      return;
    }
    setSaving(true);
    try {
      const coCol  = txCollectionOf(checkout.category);
      const coFlat = flattenFields(checkoutFields);
      await updateDoc(doc(db, coCol, checkout.id), {
        timestamp:         new Date(checkoutDate).getTime(),
        empName,
        checkoutNotes,
        checkoutFields,
        checkoutChecklist: coFlat.checklist,
        checkoutPhotos:    null,
      });
      if (ret) {
        const rCol  = txCollectionOf(ret.category);
        const rFlat = flattenFields(returnFields);
        await updateDoc(doc(db, rCol, ret.id), {
          timestamp:       returnDate ? new Date(returnDate).getTime() : ret.timestamp,
          empName,
          returnNotes,
          returnFields,
          returnChecklist: rFlat.checklist,
          returnPhotos:    null,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 w-full max-w-3xl max-h-[92vh] ring-1 ring-slate-200/60 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold text-slate-900">แก้ไขประวัติการครอบครอง</h3>
              <p className="text-[12.5px] text-slate-500 truncate">{checkout.empName || '-'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition shrink-0">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex border-b border-slate-100 px-6 shrink-0 bg-white">
          <TabBtn active={activeTab === 'checkout'} onClick={() => setActiveTab('checkout')} color="blue" Icon={ArrowRight}>
            ตอนส่งมอบ
          </TabBtn>
          {ret ? (
            <TabBtn active={activeTab === 'return'} onClick={() => setActiveTab('return')} color="emerald" Icon={ArrowLeft}>
              ตอนรับคืน
            </TabBtn>
          ) : (
            <span className="py-3 px-1 ml-6 text-[13px] text-slate-400 italic flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> ยังไม่มีการรับคืน
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-slate-50/40">
          <div className="bg-white ring-1 ring-slate-200 rounded-xl p-4">
            <label className="block text-[12.5px] font-medium text-slate-600 mb-1">ชื่อพนักงาน</label>
            <input
              type="text"
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
              placeholder="ชื่อ-นามสกุล"
            />
            <p className="text-[11px] text-slate-400 mt-1">การเปลี่ยนชื่อจะมีผลกับทั้งบันทึกส่งมอบและรับคืน</p>
          </div>

          {activeTab === 'checkout' && (
            <>
              <div className="bg-white ring-1 ring-blue-200 rounded-xl p-4 space-y-3">
                <p className="text-[12px] font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} /> ข้อมูลการส่งมอบ
                </p>
                <div>
                  <label className="block text-[12.5px] font-medium text-slate-600 mb-1">วันและเวลา</label>
                  <input
                    type="datetime-local"
                    value={checkoutDate}
                    onChange={(e) => setCheckoutDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
                  />
                </div>
              </div>
              <ConditionCapture
                mode="checkout"
                fields={checkoutFields}
                setFields={setCheckoutFields}
                notes={checkoutNotes}
                setNotes={setCheckoutNotes}
              />
            </>
          )}

          {activeTab === 'return' && ret && (
            <>
              <div className="bg-white ring-1 ring-emerald-200 rounded-xl p-4 space-y-3">
                <p className="text-[12px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} /> ข้อมูลการรับคืน
                </p>
                <div>
                  <label className="block text-[12.5px] font-medium text-slate-600 mb-1">วันและเวลา</label>
                  <input
                    type="datetime-local"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
                  />
                </div>
              </div>
              <ConditionCapture
                mode="return"
                fields={returnFields}
                setFields={setReturnFields}
                notes={returnNotes}
                setNotes={setReturnNotes}
              />
            </>
          )}

          {(overSoftCO || overSoftR) && (
            <div className={`text-[12.5px] rounded-lg px-3 py-2 ring-1 ring-inset ${overHard ? 'text-rose-700 bg-rose-50 ring-rose-200' : 'text-amber-700 bg-amber-50 ring-amber-200'}`}>
              <div className="font-semibold mb-0.5">
                {overHard ? '⛔ ขนาดข้อมูลเกิน 1 MB — บันทึกไม่ได้' : '⚠️ ข้อมูลรูปภาพใกล้เต็มขีดจำกัด'}
              </div>
              <div>
                ตอนส่งมอบ: {(coBytes / 1024).toFixed(0)} KB
                {ret && <> · ตอนรับคืน: {(rBytes / 1024).toFixed(0)} KB</>}
                &nbsp;(จำกัด 1,024 KB / รายการ) — โปรดลดจำนวนรูปลง
              </div>
            </div>
          )}

          {error && (
            <div className="text-[12.5px] text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-2.5 shrink-0">
          <button onClick={onClose} disabled={saving}
            className="px-5 py-2.5 text-[13.5px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-60">
            ยกเลิก
          </button>
          <button onClick={handleSave} disabled={saving || overHard}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold text-white rounded-lg shadow-sm hover:shadow-md transition disabled:opacity-60"
            style={{ background: '#1E487A' }}>
            {saving ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> กำลังบันทึก...</>
            ) : (
              <><Save className="h-3.5 w-3.5" strokeWidth={2.2} /> บันทึกทุกการเปลี่ยนแปลง</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Tab button helper ── */
function TabBtn({ active, onClick, color, Icon, children }) {
  const colorCls = {
    blue:    active ? 'border-blue-500 text-blue-700'       : 'border-transparent text-slate-400 hover:text-slate-700',
    emerald: active ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700',
  }[color];
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 py-3 px-1 mr-6 text-[13.5px] font-medium border-b-2 transition-colors whitespace-nowrap ${colorCls}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   Delete confirm
   ════════════════════════════════════════════════════════════════ */
function DeletePeriodConfirm({ period, onClose }) {
  const { checkout, return: ret } = period;
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    setDeleting(true);
    try {
      await deleteDoc(doc(db, txCollectionOf(checkout.category), checkout.id));
      if (ret) await deleteDoc(doc(db, txCollectionOf(ret.category), ret.id));
      onClose();
    } catch (err) {
      setError(err.message || 'ลบไม่สำเร็จ');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 w-full max-w-md ring-1 ring-slate-200/60 overflow-hidden">
        <div className="px-6 py-5 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <Trash2 className="h-6 w-6" strokeWidth={2} />
          </div>
          <h3 className="text-[17px] font-semibold text-slate-900 mb-1.5">ลบประวัติการครอบครอง</h3>
          <p className="text-[13.5px] text-slate-500 leading-relaxed">
            ลบช่วงครอบครองของ <span className="font-semibold text-slate-700">{checkout.empName}</span>?<br/>
            {ret ? 'จะลบทั้งบันทึกการส่งมอบและการรับคืน' : 'จะลบบันทึกการส่งมอบ (ยังไม่มีการรับคืน)'}
          </p>
          <p className="text-[12px] text-rose-600 mt-2 font-medium">การลบไม่สามารถย้อนกลับได้</p>
          {error && (
            <div className="text-[12.5px] text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2 mt-3 text-left">
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2.5">
          <button onClick={onClose} disabled={deleting}
            className="px-5 py-2.5 text-[13.5px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-60">
            ยกเลิก
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm hover:shadow-md transition disabled:opacity-60">
            {deleting ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> กำลังลบ...</>
            ) : (
              <><Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} /> ยืนยันลบ</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
