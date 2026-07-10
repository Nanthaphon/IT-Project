/**
 * printViaIframe — render HTML into a hidden iframe attached to the current
 * document and trigger the browser's print dialog from there.
 *
 * Why: Opening a popup with window.open('','_blank') + document.write() gives
 *      the document a URL of "about:blank", which Chrome then prints as a
 *      header/footer on every page. Using a hidden iframe instead means the
 *      print dialog inherits the main app's URL (which we can also choose to
 *      hide via @page CSS) — no more "about:blank" stamp.
 *
 * Filename: Chrome (and most browsers) use the PARENT window's document.title
 *           as the suggested PDF filename — not the iframe's <title>. So we
 *           read the iframe's <title> and set it on the parent temporarily,
 *           then restore after the dialog closes.
 *
 * Double-print bug fix: a safety-net timer used to fire `fire()` after 4s as
 *           a fallback for hanging image loads. If images finished loading and
 *           the user already cancelled by 4s, the safety timer would re-fire
 *           print — producing 2 dialogs. Now guarded with `hasPrinted` flag
 *           + the safety timer is cancelled when fire() runs normally.
 */
export function printViaIframe(html, { cleanupDelay = 800 } = {}) {
  // Tear down any previous print iframe
  const existing = document.getElementById('__print_iframe');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = '__print_iframe';
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    right:    '0',
    bottom:   '0',
    width:    '0',
    height:   '0',
    border:   '0',
    opacity:  '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(iframe);

  let hasPrinted = false;
  let safetyTimer = null;
  const originalTitle = document.title;

  const fire = () => {
    if (hasPrinted) return;          // 🆕 กัน double-fire (จาก safety timer + onLoad ที่ยิงพร้อมกัน)
    hasPrinted = true;
    if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }

    // 🆕 Browser ใช้ parent document.title เป็น PDF filename — ตั้งจาก iframe title
    let iframeTitle = '';
    try { iframeTitle = iframe.contentDocument?.title || ''; } catch {}
    if (iframeTitle) document.title = iframeTitle;

    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('[print] failed:', e);
    } finally {
      setTimeout(() => {
        document.title = originalTitle;
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, cleanupDelay);
    }
  };

  // Write content + wait for images to load before printing
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const imgs = Array.from(doc.images || []);
  if (imgs.length === 0) {
    setTimeout(fire, 50);
    return;
  }
  let remaining = imgs.length;
  const onDone = () => { if (--remaining <= 0) setTimeout(fire, 50); };
  imgs.forEach(img => {
    if (img.complete) onDone();
    else {
      img.addEventListener('load',  onDone, { once: true });
      img.addEventListener('error', onDone, { once: true });
    }
  });
  // Safety net: print anyway after 4s if some image hangs (cleared inside fire())
  safetyTimer = setTimeout(fire, 4000);
}
