import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Search, Check, AlertCircle } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Field, Button } from '../ui/primitives.jsx';
import { cls } from '../ui/theme.js';
import ConditionCapture from './ConditionCapture.jsx';

export default function CheckoutModal({
  checkoutModal, setCheckoutModal, handleCheckout,
  checkoutSearchTerm, setCheckoutSearchTerm,
  checkoutEmpId, setCheckoutEmpId, employees,
  checkoutRemarks, setCheckoutRemarks,
  licenses, accessories,
  checkoutCondition, setCheckoutCondition,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  if (!checkoutModal.isOpen) return null;

  const isLicense    = checkoutModal.collectionName === 'licenses';
  const isAccessory  = checkoutModal.collectionName === 'accessories';
  const needSelector = isLicense || isAccessory;

  /* Build available slots */
  let availableSlots = [];
  if (isLicense && licenses) {
    const licItem = licenses.find(l => l.id === checkoutModal.assetId);
    if (licItem) {
      const availCount = Math.max(0, Number(licItem.quantity || 0) - (licItem.assignees || []).length);
      for (let i = 0; i < availCount; i++) {
        availableSlots.push({
          index: i,
          label: `สิทธิ์ #${i + 1}`,
          sub: licItem.availableKeys?.[i] || '',
          sub2: licItem.availableKeyCodes?.[i] ? `รหัสอ้างอิง: ${licItem.availableKeyCodes[i]}` : '',
          cost: licItem.availableSeatCosts?.[i] || '',
        });
      }
    }
  }
  if (isAccessory && accessories) {
    const accItem = accessories.find(a => a.id === checkoutModal.assetId);
    if (accItem) {
      const items = Array.isArray(accItem.availableItems) ? accItem.availableItems : (() => {
        const availCount = Math.max(0, Number(accItem.quantity || 0) - (accItem.assignees?.length || 0) - Number(accItem.brokenQuantity || 0));
        return Array.from({ length: availCount }, (_, i) => ({
          sn: accItem.availableSNs?.[i] || '',
          model: accItem.availableModels?.[i] || '',
          cost: accItem.availableCosts?.[i] || '',
          purchaseDate: accItem.availablePurchaseDates?.[i] || '',
          warrantyDate: accItem.availableWarrantyDates?.[i] || '',
        }));
      })();
      items.forEach((it, i) => {
        availableSlots.push({
          index: i,
          label: it.sn ? `SN: ${it.sn}` : `ชิ้นที่ ${i + 1}`,
          sub: it.model || '',
          sub2: '',
          cost: it.cost || '',
          sn: it.sn || '',
          model: it.model || '',
          itemCost: it.cost || '',
          itemPurchaseDate: it.purchaseDate || '',
          itemWarrantyDate: it.warrantyDate || '',
        });
      });
    }
  }

  const selectedIndex = isLicense ? (checkoutModal.seatIndex ?? 0) : (checkoutModal.snIndex ?? 0);

  const selectSlot = (slot) => {
    if (isLicense) {
      setCheckoutModal(prev => ({ ...prev, seatIndex: slot.index }));
    } else {
      setCheckoutModal(prev => ({
        ...prev,
        snIndex: slot.index,
        sn: slot.sn || '',
        itemModel: slot.model || '',
        itemCost: slot.itemCost || '',
        itemPurchaseDate: slot.itemPurchaseDate || '',
        itemWarrantyDate: slot.itemWarrantyDate || '',
      }));
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const term = checkoutSearchTerm.toLowerCase();
    return (
      emp.fullName?.toLowerCase().includes(term) ||
      emp.fullNameEng?.toLowerCase().includes(term) ||
      emp.empId?.toLowerCase().includes(term) ||
      emp.nickname?.toLowerCase().includes(term)
    );
  });

  const close = () => {
    setCheckoutModal({ isOpen: false, assetId: null, collectionName: '', sn: '', snIndex: undefined });
    setCheckoutEmpId('');
    setCheckoutSearchTerm('');
    setCheckoutRemarks('');
    setIsDropdownOpen(false);
  };

  const canSubmit = checkoutEmpId && !(needSelector && availableSlots.length === 0);

  return (
    <Modal open={checkoutModal.isOpen} onClose={close} size="xl">
      <ModalHeader
        icon={LogOut}
        title="ระบุพนักงานที่เบิกจ่าย"
        subtitle={isLicense ? 'เลือกสิทธิ์ที่จะเบิก และเลือกพนักงานผู้รับ' : isAccessory ? 'เลือกชิ้นที่จะเบิก และเลือกพนักงานผู้รับ' : 'เลือกพนักงานที่จะเป็นผู้ครอบครอง'}
        onClose={close}
      />
      <form
        onSubmit={(e) => { if (!checkoutEmpId) { e.preventDefault(); return; } handleCheckout(e); }}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <ModalBody className="space-y-5">
          {/* Item/Seat selector */}
          {needSelector && availableSlots.length > 0 && (
            <Field
              label={isAccessory ? 'เลือกชิ้นที่จะเบิกจ่าย' : 'เลือกสิทธิ์ที่จะเบิกจ่าย'}
              required
            >
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 -mr-1">
                {availableSlots.map((slot) => {
                  const isSelected = selectedIndex === slot.index;
                  return (
                    <label
                      key={slot.index}
                      className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all ring-1 ring-inset ${
                        isSelected ? 'bg-blue-50 ring-2 ring-[#1E487A]' : 'bg-white ring-slate-200 hover:ring-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="slotIndex"
                        value={slot.index}
                        checked={isSelected}
                        onChange={() => selectSlot(slot)}
                        className="mt-1 w-4 h-4 text-[#1E487A] focus:ring-[#1E487A] border-slate-300 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13.5px] font-semibold text-slate-700">{slot.label}</span>
                          {slot.cost && (
                            <span className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-200 px-2 py-0.5 rounded-full tabular-nums">
                              ฿{Number(slot.cost).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {slot.sub && (
                          <div className={`mt-1.5 text-[13px] truncate ${isLicense ? 'font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded-lg ring-1 ring-inset ring-slate-200' : 'text-slate-500'}`}>
                            {slot.sub}
                          </div>
                        )}
                        {slot.sub2 && <div className="mt-0.5 text-[12.5px] text-slate-400 truncate">{slot.sub2}</div>}
                        {!slot.sub && !slot.cost && <div className="mt-0.5 text-[12.5px] text-slate-400">ไม่มีข้อมูลเพิ่มเติม</div>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </Field>
          )}

          {needSelector && availableSlots.length === 0 && (
            <div className="bg-rose-50 ring-1 ring-inset ring-rose-200 text-rose-700 text-[14px] font-medium px-4 py-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={2} />
              ไม่มีรายการที่พร้อมเบิกจ่าย
            </div>
          )}

          {/* Employee selector */}
          <Field label="ค้นหาและเลือกพนักงาน" required>
            <div ref={wrapperRef} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" strokeWidth={2} />
              <input
                type="text"
                placeholder="พิมพ์ชื่อ หรือ รหัสพนักงาน..."
                value={checkoutSearchTerm}
                onChange={(e) => { setCheckoutSearchTerm(e.target.value); setCheckoutEmpId(''); setIsDropdownOpen(true); }}
                onFocus={() => setIsDropdownOpen(true)}
                className={`w-full pl-10 pr-4 py-3 text-[15px] bg-white border rounded-lg outline-none transition-all ${
                  !checkoutEmpId && checkoutSearchTerm
                    ? 'border-amber-300 focus:ring-2 focus:ring-amber-200 focus:border-amber-400'
                    : 'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]'
                }`}
                autoComplete="off"
              />

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1.5 bg-white ring-1 ring-slate-200 rounded-xl shadow-xl shadow-slate-950/10 max-h-[320px] overflow-y-auto">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(emp => (
                      <div
                        key={emp.id}
                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50/60 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-b-0 ${checkoutEmpId === emp.id ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setCheckoutEmpId(emp.id);
                          setCheckoutSearchTerm(`${emp.empId} - ${emp.fullName}${emp.nickname ? ` (${emp.nickname})` : ''}`);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#1E487A] flex items-center justify-center font-semibold text-[15px] shrink-0">
                          {emp.fullName?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-800 truncate">
                            {emp.fullName} {emp.nickname ? <span className="text-slate-400">({emp.nickname})</span> : null}
                          </div>
                          <div className="text-[13px] text-slate-500 truncate">{emp.empId} • {emp.department || '-'}</div>
                        </div>
                        {checkoutEmpId === emp.id && <Check className="h-5 w-5 text-[#1E487A] shrink-0" strokeWidth={2.4} />}
                      </div>
                    ))
                  ) : (
                    <div className="p-5 text-center text-[14px] text-slate-500 font-medium">ไม่พบข้อมูลพนักงาน</div>
                  )}
                </div>
              )}
            </div>
          </Field>

          {/* Remarks */}
          <Field label="เหตุผล / หมายเหตุ (ถ้ามี)">
            <textarea
              value={checkoutRemarks}
              onChange={(e) => setCheckoutRemarks(e.target.value)}
              className={cls.input + ' resize-none'}
              placeholder="ระบุเหตุผลการเบิกจ่าย หรือหมายเหตุเพิ่มเติม..."
              rows="2"
            />
          </Field>

          {/* Condition Capture — เฉพาะ assets หลัก (notebook/computer) เท่านั้น
              license = ไม่ต้องมี | accessory = ไม่ต้องมี (อุปกรณ์เสริมไม่ต้องการ 100-point checklist) */}
          {!isLicense && !isAccessory && checkoutCondition && setCheckoutCondition && (
            <ConditionCapture
              mode="checkout"
              fields={checkoutCondition.fields}
              setFields={(fields) => setCheckoutCondition({ ...checkoutCondition, fields })}
              notes={checkoutCondition.notes}
              setNotes={(notes) => setCheckoutCondition({ ...checkoutCondition, notes })}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={close}>ยกเลิก</Button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 ${
              canSubmit
                ? 'bg-[#1E487A] hover:bg-[#163963] text-white shadow-sm hover:shadow-md focus:ring-[#1E487A]/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            ยืนยันเบิกจ่าย
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
