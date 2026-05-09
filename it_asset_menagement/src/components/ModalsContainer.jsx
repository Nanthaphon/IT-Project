import React from 'react';

// นำเข้า Modals ทั้งหมดที่แยกไว้แล้ว พร้อมระบุนามสกุลไฟล์ให้ชัดเจน
import AddModal from './AddModal.jsx';
import CheckoutModal from './CheckoutModal.jsx';
import EmployeeDetailsModal from './EmployeeDetailsModal.jsx';
import AssetDetailsModal from './AssetDetailsModal.jsx';
import EditEmpModal from './EditEmpModal.jsx';
import EditAssetModal from './EditAssetModal.jsx';
import EditLicenseModal from './EditLicenseModal.jsx';
import ImportModal from './ImportModal.jsx';
import ReturnModal from './ReturnModal.jsx';
import RepairModal from './RepairModal.jsx';
import ConfirmDeleteModal from './ConfirmDeleteModal.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import ResetPasswordModal from './ResetPasswordModal.jsx';

export default function ModalsContainer(props) {
  return (
    <>
      <AddModal {...props} />
      <CheckoutModal {...props} />
      <EmployeeDetailsModal {...props} />
      <AssetDetailsModal {...props} />
      <EditEmpModal {...props} />
      <EditAssetModal {...props} />
      <EditLicenseModal {...props} />
      <ImportModal {...props} />
      <ReturnModal {...props} />
      <RepairModal {...props} />
      <ConfirmDeleteModal {...props} />
      
      {/* การแมปข้อมูลสำหรับ Modal ที่รับ Props เฉพาะเจาะจง */}
      <ConfirmModal 
        isOpen={props.confirmModal.isOpen} 
        title={props.confirmModal.title} 
        message={props.confirmModal.message} 
        confirmText={props.confirmModal.confirmText} 
        cancelText={props.confirmModal.cancelText} 
        icon={props.confirmModal.icon} 
        onConfirm={props.handleConfirmModalOk} 
        onCancel={props.closeConfirmModal} 
      />
      <ResetPasswordModal 
        isOpen={props.resetPasswordModal} 
        onClose={() => props.setResetPasswordModal(false)} 
        onSuccess={(msg) => props.setCustomAlert({ isOpen: true, title: 'สำเร็จ!', message: msg, type: 'success' })} 
        onError={(msg) => props.setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: msg, type: 'error' })} 
      />
    </>
  );
}