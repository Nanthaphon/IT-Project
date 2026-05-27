import React, { useState } from 'react';
import {
  Monitor, Key, Plus, X, Search, Package, Trash2,
  ChevronDown, ChevronUp, CheckCircle2,
} from 'lucide-react';

/**
 * AssetLicenseTab — แสดงและจัดการ License ที่ผูกกับ asset นี้โดยตรง
 * (device-bound: empId = null, isAssetBound = true)
 *
 * Props:
 *   asset          – current asset object (must have .id and .name)
 *   licenses       – full licenses array from Firestore
 *   onAssign(licenseId, seatIndex, assetId, assetName, remarks) – async
 *   onRevoke(licenseId, checkoutId)                             – async
 *   setCustomAlert – App-level alert setter
 */
export default function AssetLicenseTab({ asset, licenses = [], onAssign, onRevoke, setCustomAlert }) {
  const [isAdding,       setIsAdding]       = useState(false);
  const [search,         setSearch]         = useState('');
  const [selectedLicId,  setSelectedLicId]  = useState(null);
  const [selectedSeatIdx,setSelectedSeatIdx]= useState(0);
  const [remarks,        setRemarks]        = useState('');
  const [saving,         setSaving]         = useState(false);
  const [revoking,       setRevoking]       = useState(null); // checkoutId ที่กำลัง revoke
  const [expanded,       setExpanded]       = useState(null);

  /* ── License seats bound to this asset ── */
  const boundSeats = [];
  for (const lic of licenses) {
    for (const a of (lic.assignees || [])) {
      if (a.isAssetBound && a.assignedAssetId === asset.id) {
        boundSeats.push({
          ...a,
          licenseId:     lic.id,
          licenseName:   lic.name,
          licenseImage:  lic.image,
          licenseExpiry: lic.expirationDate,
        });
      }
    }
  }

  /* ── Licenses that still have free seats ── */
  const availableLicenses = licenses
    .filter(lic => {
      const total = Number(lic.quantity || 0);
      const used  = (lic.assignees || []).length;
      return used < total;
    })
    .filter(lic => {
      if (!search.trim()) return true;
      return lic.name?.toLowerCase().includes(search.toLowerCase());
    });

  const selectedLicense = licenses.find(l => l.id === selectedLicId);
  const availableCount  = selectedLicense
    ? Math.max(0, Number(selectedLicense.quantity || 0) - (selectedLicense.assignees || []).length)
    : 0;

  /* ── Assign handler ── */
  const handleAssign = async () => {
    if (!selectedLicId) return;
    setSaving(true);
    try {
      await onAssign(selectedLicId, selectedSeatIdx, asset.id, asset.name, remarks);
      setIsAdding(false);
      setSearch(''); setSelectedLicId(null); setSelectedSeatIdx(0); setRemarks('');
    } catch (err) {
      if (setCustomAlert) setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  /* ── Revoke handler ── */
  const handleRevoke = async (licenseId, checkoutId) => {
    setRevoking(checkoutId);
    try {
      await onRevoke(licenseId, checkoutId);
    } catch (err) {
      if (setCustomAlert) setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: err.message, type: 'error' });
    } finally {
      setRevoking(null);
    }
  };

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className="space-y-4 animate-in fade-in duration-200">

      {/* ── Section header ── */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-[#1E487A]" />
          <h4 className="text-[13px] font-semibold text-slate-600">
            ซอฟต์แวร์ / License ที่ติดตั้ง ({boundSeats.length})
          </h4>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold bg-[#1E487A] text-white px-3.5 py-2 rounded-lg hover:bg-[#163963] transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            เพิ่ม License
          </button>
        )}
      </div>

      {/* ── Assign panel (inline) ── */}
      {isAdding && (
        <div className="bg-white ring-2 ring-[#1E487A]/20 rounded-2xl p-5 space-y-4 shadow-sm">
          {/* Panel header */}
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-slate-800 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[#1E487A]" strokeWidth={2} />
              เลือก License ที่ต้องการผูกกับเครื่องนี้
            </p>
            <button
              onClick={() => { setIsAdding(false); setSearch(''); setSelectedLicId(null); setRemarks(''); }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedLicId(null); }}
              placeholder="ค้นหา License..."
              className="w-full pl-9 pr-4 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
            />
          </div>

          {/* License list */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
            {availableLicenses.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="h-8 w-8 mx-auto text-slate-300 mb-2" strokeWidth={1.5} />
                <p className="text-[13px] text-slate-400">ไม่มี License ที่มีสิทธิ์ว่าง</p>
              </div>
            ) : (
              availableLicenses.map(lic => {
                const total  = Number(lic.quantity || 0);
                const used   = (lic.assignees || []).length;
                const avail  = total - used;
                const isSel  = selectedLicId === lic.id;
                return (
                  <button
                    key={lic.id}
                    type="button"
                    onClick={() => { setSelectedLicId(lic.id); setSelectedSeatIdx(0); }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isSel
                        ? 'bg-[#1E487A]/8 ring-2 ring-[#1E487A]/25'
                        : 'bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-200'
                    }`}
                  >
                    {lic.image ? (
                      <img src={lic.image} alt={lic.name} className="w-9 h-9 object-contain rounded-lg shrink-0 bg-white p-1 ring-1 ring-slate-200" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 ring-1 ring-purple-200">
                        <Package className="h-4 w-4 text-purple-500" strokeWidth={1.8} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{lic.name}</p>
                      <p className="text-[11px] text-slate-400">
                        ว่าง {avail}/{total} สิทธิ์
                        {lic.expirationDate && ` · หมดอายุ ${lic.expirationDate}`}
                      </p>
                    </div>
                    {isSel && <CheckCircle2 className="h-4 w-4 text-[#1E487A] shrink-0" strokeWidth={2} />}
                  </button>
                );
              })
            )}
          </div>

          {/* Seat selector + key preview */}
          {selectedLicense && availableCount > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              {availableCount > 1 && (
                <div>
                  <label className="block text-[12.5px] font-medium text-slate-600 mb-1">เลือก Seat / Slot</label>
                  <select
                    value={selectedSeatIdx}
                    onChange={e => setSelectedSeatIdx(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
                  >
                    {Array.from({ length: availableCount }, (_, i) => (
                      <option key={i} value={i}>
                        Seat {i + 1}
                        {selectedLicense.availableKeys?.[i]
                          ? ` — ${selectedLicense.availableKeys[i]}`
                          : ' — (ไม่มี Key)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {selectedLicense.availableKeys?.[selectedSeatIdx] && (
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[11px] text-slate-400 mb-0.5">Product Key ที่จะใช้</p>
                  <p className="font-mono text-[13px] font-semibold text-slate-800">
                    {selectedLicense.availableKeys[selectedSeatIdx]}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-[12.5px] font-medium text-slate-600 mb-1">หมายเหตุ (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="เช่น ติดตั้งโดย IT, License OEM ประจำเครื่อง..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
                />
              </div>
            </div>
          )}

          {/* Action row */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setSearch(''); setSelectedLicId(null); setRemarks(''); }}
              className="px-4 py-2 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={!selectedLicId || saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white rounded-lg shadow-sm transition disabled:opacity-50"
              style={{ background: '#1E487A' }}
            >
              {saving ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> กำลังบันทึก...</>
              ) : (
                <><Monitor className="h-3.5 w-3.5" strokeWidth={2.2} /> ผูก License กับเครื่องนี้</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Bound seats list ── */}
      {boundSeats.length === 0 && !isAdding ? (
        <div className="py-14 text-center bg-white rounded-2xl ring-1 ring-slate-200/60">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
            <Package className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <p className="text-[14px] font-semibold text-slate-500">ยังไม่มี License ที่ผูกกับเครื่องนี้</p>
          <p className="text-[12.5px] text-slate-400 mt-1">
            กดปุ่ม "เพิ่ม License" เพื่อผูก License กับทรัพย์สินนี้
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {boundSeats.map(seat => {
            const isExp = expanded === seat.checkoutId;
            return (
              <div key={seat.checkoutId} className="bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden">
                {/* Row header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 ring-1 ring-purple-200">
                    {seat.licenseImage
                      ? <img src={seat.licenseImage} alt="" className="w-7 h-7 object-contain" />
                      : <Package className="h-4 w-4 text-purple-500" strokeWidth={1.8} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-slate-800 truncate">{seat.licenseName}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full ring-1 ring-inset ring-purple-200">
                        <Monitor className="h-2.5 w-2.5" strokeWidth={2.5} />
                        ติดตั้งบนเครื่องนี้
                      </span>
                      {seat.checkoutDate && (
                        <span className="text-[11px] text-slate-400">เมื่อ {seat.checkoutDate}</span>
                      )}
                      {seat.productKey && (
                        <span className="inline-flex items-center gap-0.5 text-[10.5px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          <Key className="h-2.5 w-2.5" strokeWidth={2} />
                          {seat.productKey.length > 22
                            ? seat.productKey.slice(0, 22) + '…'
                            : seat.productKey}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setExpanded(isExp ? null : seat.checkoutId)}
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg transition"
                      title={isExp ? 'ย่อ' : 'ดูรายละเอียด'}
                    >
                      {isExp ? <ChevronUp className="h-4 w-4" strokeWidth={2} /> : <ChevronDown className="h-4 w-4" strokeWidth={2} />}
                    </button>
                    <button
                      onClick={() => handleRevoke(seat.licenseId, seat.checkoutId)}
                      disabled={revoking === seat.checkoutId}
                      className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-rose-600 bg-rose-50 ring-1 ring-inset ring-rose-200 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition disabled:opacity-60"
                      title="ยกเลิกการผูก License"
                    >
                      {revoking === seat.checkoutId
                        ? <div className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                        : <Trash2 className="h-3 w-3" strokeWidth={2} />
                      }
                      ยกเลิก
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExp && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-[12.5px]">
                      {seat.productKey && (
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-[11px] text-slate-400 mb-0.5">Product Key</p>
                          <p className="font-mono font-semibold text-slate-800 bg-white px-2.5 py-1.5 rounded ring-1 ring-slate-200 inline-block break-all">
                            {seat.productKey}
                          </p>
                        </div>
                      )}
                      {seat.keyCode && (
                        <div>
                          <p className="text-[11px] text-slate-400 mb-0.5">รหัสอ้างอิง</p>
                          <p className="font-medium text-slate-700">{seat.keyCode}</p>
                        </div>
                      )}
                      {seat.seatCost && (
                        <div>
                          <p className="text-[11px] text-slate-400 mb-0.5">ราคา</p>
                          <p className="font-medium text-slate-700">฿{Number(seat.seatCost).toLocaleString()}</p>
                        </div>
                      )}
                      {seat.licenseExpiry && (
                        <div>
                          <p className="text-[11px] text-slate-400 mb-0.5">วันหมดอายุ</p>
                          <p className="font-medium text-slate-700">{seat.licenseExpiry}</p>
                        </div>
                      )}
                      {seat.remarks && (
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-[11px] text-slate-400 mb-0.5">หมายเหตุ</p>
                          <p className="font-medium text-slate-700">{seat.remarks}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
