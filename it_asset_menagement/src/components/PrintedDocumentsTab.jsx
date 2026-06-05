import React, { useState, useEffect, useRef } from 'react';
import { Printer, FileText, Trash2, Download, RefreshCw, ArrowLeftRight, Upload, FileCheck2, X } from 'lucide-react';
import {
  listPrintedDocumentsByEmployee,
  loadPrintedDocument,
  deletePrintedDocument,
  uploadSignedFile,
  loadSignedFile,
  deleteSignedFile,
} from '../utils/printedDocumentStore.js';
import { printViaIframe } from '../utils/printViaIframe.js';

/**
 * PrintedDocumentsTab
 * ────────────────────
 * แสดงรายการเอกสารที่พิมพ์แล้วของพนักงาน + ปุ่มพิมพ์ซ้ำ / ลบ
 */
export default function PrintedDocumentsTab({ employeeId, employeeName }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reprinting, setReprinting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [downloadingFor, setDownloadingFor] = useState(null);
  const fileInputRefs = useRef({});

  const reload = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const list = await listPrintedDocumentsByEmployee(employeeId);
      setDocs(list);
    } catch (err) {
      console.error('listPrintedDocuments failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [employeeId]);

  const handleReprint = async (docId) => {
    setReprinting(docId);
    try {
      const { html } = await loadPrintedDocument(docId);
      if (!html) throw new Error('เอกสารว่างเปล่า');
      printViaIframe(html);
    } catch (err) {
      alert('โหลดเอกสารไม่สำเร็จ: ' + err.message);
    } finally {
      setReprinting(null);
    }
  };

  const handleDelete = async (docId, label) => {
    if (!window.confirm(`ลบเอกสาร "${label}" ออกจากระบบ?`)) return;
    setDeleting(docId);
    try {
      await deletePrintedDocument(docId);
      await reload();
    } catch (err) {
      alert('ลบไม่สำเร็จ: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleUploadSigned = async (docId, file) => {
    if (!file) return;
    setUploadingFor(docId);
    try {
      await uploadSignedFile(docId, file);
      await reload();
    } catch (err) {
      alert('อัปโหลดไม่สำเร็จ: ' + err.message);
    } finally {
      setUploadingFor(null);
    }
  };

  const handleDownloadSigned = async (docId) => {
    setDownloadingFor(docId);
    try {
      const { dataUrl, fileName } = await loadSignedFile(docId);
      // trigger download
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('โหลดไฟล์ไม่สำเร็จ: ' + err.message);
    } finally {
      setDownloadingFor(null);
    }
  };

  const handleDeleteSigned = async (docId) => {
    if (!window.confirm('ลบไฟล์เซ็นออก? (เก็บเฉพาะ HTML ที่ระบบบันทึกอัตโนมัติ)')) return;
    setDeleting(docId);
    try {
      await deleteSignedFile(docId);
      await reload();
    } catch (err) {
      alert('ลบไฟล์เซ็นไม่สำเร็จ: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const fmtDate = (ts) => {
    if (!ts) return '-';
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const fmtSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-10 h-10 mx-auto mb-3 border-3 border-[#1E487A]/20 border-t-[#1E487A] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">กำลังโหลดรายการเอกสาร...</p>
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="py-14 text-center bg-white rounded-2xl ring-1 ring-slate-200/60">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
          <FileText className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <p className="text-[14px] font-semibold text-slate-600">ยังไม่มีเอกสารที่พิมพ์</p>
        <p className="text-[12.5px] text-slate-400 mt-1">เอกสารใบส่งมอบ / ใบรับคืน ที่พิมพ์ผ่านระบบจะถูกบันทึกที่นี่อัตโนมัติ</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-[#1E487A]" />
          <h4 className="text-[13.5px] font-semibold text-slate-600">เอกสารที่พิมพ์แล้ว ({docs.length})</h4>
        </div>
        <button
          onClick={reload}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-[#1E487A] px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
          title="โหลดใหม่"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
          โหลดใหม่
        </button>
      </div>

      <div className="ring-1 ring-slate-200/60 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
        {docs.map((d) => {
          const isHandover = d.formType === 'handover';
          const typeLabel = isHandover ? 'ใบส่งมอบ' : 'ใบรับคืน';
          const typeCls = isHandover
            ? 'bg-blue-50 text-[#1E487A] ring-blue-200'
            : 'bg-teal-50 text-teal-700 ring-teal-200';
          const Icon = isHandover ? FileText : ArrowLeftRight;

          const hasSigned = !!d.signedFile?.chunks;
          return (
            <div key={d.id} className="p-3.5 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${typeCls} ring-1 ring-inset flex items-center justify-center shrink-0`}>
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-[11px] font-bold ${typeCls} px-1.5 py-0.5 rounded ring-1 ring-inset`}>
                      {typeLabel}
                    </span>
                    <span className="text-[13.5px] font-semibold text-slate-800 font-mono truncate">
                      {d.docNumber || d.id}
                    </span>
                    {hasSigned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 px-1.5 py-0.5 rounded">
                        <FileCheck2 className="h-3 w-3" strokeWidth={2.4} />
                        เซ็นแล้ว
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-slate-500 truncate">
                    {(d.assetNames || []).join(', ') || '-'}
                  </div>
                  <div className="text-[11.5px] text-slate-400 mt-0.5">
                    พิมพ์เมื่อ {fmtDate(d.createdAt)} · ต้นฉบับ {fmtSize(d.sizeBytes)}
                    {hasSigned && ` · ไฟล์เซ็น ${fmtSize(d.signedFile.sizeBytes)}`}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleReprint(d.id)}
                    disabled={reprinting === d.id}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold bg-[#1E487A] hover:bg-[#163963] text-white px-3 py-1.5 rounded-lg shadow-sm disabled:opacity-50"
                    title="พิมพ์ซ้ำ"
                  >
                    {reprinting === d.id ? (
                      <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Printer className="h-3.5 w-3.5" strokeWidth={2} />
                    )}
                    พิมพ์ซ้ำ
                  </button>
                  <button
                    onClick={() => handleDelete(d.id, d.docNumber || d.id)}
                    disabled={deleting === d.id}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                    title="ลบเอกสารทั้งหมด"
                  >
                    {deleting === d.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>

              {/* ── Signed file section ── */}
              <div className="mt-2.5 ml-13 pl-13" style={{ paddingLeft: '52px' }}>
                {hasSigned ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/60 ring-1 ring-inset ring-emerald-200 rounded-lg">
                    <FileCheck2 className="h-4 w-4 text-emerald-600 shrink-0" strokeWidth={2} />
                    <span className="text-[12.5px] font-medium text-emerald-800 flex-1 truncate">
                      {d.signedFile.fileName}
                    </span>
                    <button
                      onClick={() => handleDownloadSigned(d.id)}
                      disabled={downloadingFor === d.id}
                      className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 px-2 py-1 rounded-md disabled:opacity-50"
                      title="ดาวน์โหลดไฟล์เซ็น"
                    >
                      {downloadingFor === d.id ? (
                        <div className="w-3 h-3 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" strokeWidth={2.2} />
                      )}
                      ดาวน์โหลด
                    </button>
                    <button
                      onClick={() => fileInputRefs.current[d.id]?.click()}
                      disabled={uploadingFor === d.id}
                      className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#1E487A] hover:text-white hover:bg-[#1E487A] px-2 py-1 rounded-md disabled:opacity-50"
                      title="อัปโหลดใหม่ทับ"
                    >
                      <Upload className="h-3 w-3" strokeWidth={2.2} />
                      เปลี่ยน
                    </button>
                    <button
                      onClick={() => handleDeleteSigned(d.id)}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-md text-rose-500 hover:bg-rose-100 transition-colors"
                      title="ลบไฟล์เซ็น"
                    >
                      <X className="h-3 w-3" strokeWidth={2.4} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRefs.current[d.id]?.click()}
                    disabled={uploadingFor === d.id}
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#1E487A] bg-white border border-dashed border-[#1E487A]/40 hover:border-[#1E487A] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploadingFor === d.id ? (
                      <>
                        <div className="w-3 h-3 border-2 border-blue-200 border-t-[#1E487A] rounded-full animate-spin" />
                        กำลังอัปโหลด...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3" strokeWidth={2.4} />
                        อัปโหลดไฟล์ที่เซ็นแล้ว (สแกน / ถ่ายรูป — PDF / JPG / PNG)
                      </>
                    )}
                  </button>
                )}

                {/* Hidden file input — one per row */}
                <input
                  type="file"
                  ref={(el) => { fileInputRefs.current[d.id] = el; }}
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadSigned(d.id, f);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
