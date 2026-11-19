import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitPrintBodyToA4 } from './printViaIframe.js';

test('A4 fit measures the unscaled body and shrinks tall asset details', () => {
  const body = { style: { zoom: '0.5' }, get scrollHeight() {
    assert.equal(this.style.zoom, '1', 'always reset a previous print scale before measuring');
    return 1800;
  } };
  fitPrintBodyToA4(body);
  const availableHeight = 277 * (96 / 25.4);
  assert.equal(Number(body.style.zoom), (availableHeight - 2) / 1800);
});

test('A4 fit preserves natural size for short reports and keeps the minimum readable scale', () => {
  const short = { style: { zoom: '0.8' }, scrollHeight: 500 };
  fitPrintBodyToA4(short);
  assert.equal(short.style.zoom, '1');
  const tall = { style: {}, scrollHeight: 9000 };
  fitPrintBodyToA4(tall);
  assert.equal(tall.style.zoom, '0.4');
  assert.doesNotThrow(() => fitPrintBodyToA4(null));
});
