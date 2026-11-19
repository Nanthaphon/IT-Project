import React, { useEffect, useState } from 'react';
import { parseStorageReference, resolvePrivateUrl } from '../utils/privateStorage.js';

// Keep application state and edited documents as stable references. Revoke the
// authenticated download when the image changes/unmounts, including late reads.
export default function PrivateImage({ src, alt = '', ...props }) {
  const [loaded, setLoaded] = useState(null);
  const isPrivate = !!parseStorageReference(src);
  useEffect(() => {
    if (!isPrivate) return;
    let cancelled = false;
    let release;
    resolvePrivateUrl(src).then(result => {
      if (cancelled) result.release();
      else { release = result.release; setLoaded({ src, url: result.url }); }
    }).catch(() => { if (!cancelled) setLoaded({ src, url: null }); });
    return () => { cancelled = true; release?.(); };
  }, [src, isPrivate]);
  const url = isPrivate ? (loaded?.src === src ? loaded.url : undefined) : src;
  return <img {...props} src={url || undefined} alt={alt} />;
}
