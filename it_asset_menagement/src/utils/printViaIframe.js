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
 * The iframe also keeps print state inside the current SPA session, so we
 * don't have to deal with popup blockers.
 */
export function printViaIframe(html, { cleanupDelay = 800 } = {}) {
  // Tear down any previous print iframe
  const existing = document.getElementById('__print_iframe');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = '__print_iframe';
  // Off-screen, invisible — does not affect layout
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

  const fire = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('[print] failed:', e);
    } finally {
      // Remove the iframe a bit after print dialog so the user has time to interact
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, cleanupDelay);
    }
  };

  // Write content + wait for images to load before printing
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // If there are images, wait until they're decoded so they show in the print
  const imgs = Array.from(doc.images || []);
  if (imgs.length === 0) {
    // Defer one frame so layout settles
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
  // Safety net: print anyway after 4s if some image hangs
  setTimeout(fire, 4000);
}
