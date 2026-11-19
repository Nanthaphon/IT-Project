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
import { resolveHtmlStorageReferences, resolvePrivateUrl } from './privateStorage.js';

// Trusted parent-side layout adjustment; stored HTML never supplies executable
// code. Same 277 mm printable height and 0.4 minimum as the asset detail form.
export function fitPrintBodyToA4(body) {
  if (!body) return;
  body.style.zoom = '1';
  const availableHeight = 277 * (96 / 25.4);
  const height = body.scrollHeight;
  if (height > availableHeight) body.style.zoom = String(Math.max(0.4, (availableHeight - 2) / height));
}

export function printViaIframe(html, options = {}) {
  const releases = [];
  return resolveHtmlStorageReferences(html, async ref => {
    const resolved = await resolvePrivateUrl(ref);
    releases.push(resolved.release);
    return resolved.url;
  }).then(resolved => renderPrintIframe(resolved, options, releases)).catch(error => {
    releases.forEach(release => release());
    alert('เตรียมเอกสารไม่สำเร็จ: ' + error.message);
  });
}

function renderPrintIframe(html, { cleanupDelay = 800, fitToOneA4Page = false } = {}, releases = []) {
  // Tear down any previous print iframe
  const existing = document.getElementById('__print_iframe');
  if (existing) { existing.__releaseStorage?.(); existing.remove(); }

  const iframe = document.createElement('iframe');
  iframe.id = '__print_iframe';
  iframe.__releaseStorage = () => releases.forEach(release => release());
  // Stored HTML is data: disable scripts, forms, popups and navigation even
  // for documents saved before Storage was enabled. Printing still works.
  iframe.setAttribute('sandbox', 'allow-same-origin allow-modals');
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
    try { iframeTitle = iframe.contentDocument?.title || ''; } catch { /* Frame may have been replaced. */ }
    if (iframeTitle) document.title = iframeTitle;

    try {
      if (fitToOneA4Page === true) fitPrintBodyToA4(iframe.contentDocument?.body);
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('[print] failed:', e);
    } finally {
      setTimeout(() => {
        document.title = originalTitle;
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        releases.forEach(release => release());
      }, cleanupDelay);
    }
  };

  // Write content + wait for images to load before printing
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  parsed.querySelectorAll('script,iframe,object,embed,form,base,meta[http-equiv]').forEach(node => node.remove());
  parsed.querySelectorAll('*').forEach(node => {
    for (const attribute of [...node.attributes]) {
      if (/^on/i.test(attribute.name) || (/^(href|src|action)$/i.test(attribute.name)
        && /^\s*(javascript|vbscript):/i.test(attribute.value))) node.removeAttribute(attribute.name);
    }
  });
  const csp = parsed.createElement('meta');
  csp.httpEquiv = 'Content-Security-Policy';
  csp.content = "default-src 'none'; img-src data: blob: https:; style-src 'unsafe-inline' https:; font-src data: https:; script-src 'none'; form-action 'none'; base-uri 'none'";
  parsed.head.prepend(csp);
  doc.write('<!doctype html>' + parsed.documentElement.outerHTML);
  doc.close();
  if (fitToOneA4Page === true) {
    iframe.contentWindow.addEventListener('beforeprint', () => fitPrintBodyToA4(doc.body));
  }

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
