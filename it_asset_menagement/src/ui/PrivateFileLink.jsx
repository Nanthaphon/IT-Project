import React from 'react';
import { parseStorageReference, downloadPrivateAttachment, dataUrlToBlob } from '../utils/privateStorage.js';

export default function PrivateFileLink({ href, download, onClick, ...props }) {
  return <a {...props} href="#" download={download}
    onClick={async event => {
      onClick?.(event);
      event.preventDefault();
      try {
        if (parseStorageReference(href)) await downloadPrivateAttachment(href, download);
        else if (String(href || '').startsWith('data:')) {
          const file = dataUrlToBlob(href);
          const url = URL.createObjectURL(new Blob([file], { type: 'application/octet-stream' }));
          const a = document.createElement('a');
          a.href = url; a.download = download || 'document';
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 30_000);
        } else if (/^https?:\/\//i.test(href || '')) {
          const a = document.createElement('a');
          a.href = href; a.download = download || 'document'; a.rel = 'noopener noreferrer';
          document.body.appendChild(a); a.click(); a.remove();
        } else throw new Error('รูปแบบลิงก์ไฟล์ไม่ถูกต้อง');
      }
      catch (error) { alert('โหลดไฟล์ไม่สำเร็จ: ' + error.message); }
    }} />;
}
