const KEY = 'staffRemember';

export function rememberEmployee(storage, empId) {
  try {
    if (typeof empId === 'string' && empId.trim()) storage.setItem(KEY, JSON.stringify({ empId: empId.trim().slice(0, 64) }));
    else storage.removeItem(KEY);
  } catch { /* Login still works when browser storage is unavailable. */ }
}

export function readRememberedEmployee(storage) {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return '';
    const saved = JSON.parse(raw);
    const id = typeof saved.empId === 'string' && (!saved.expiry || Date.now() < saved.expiry) ? saved.empId : '';
    rememberEmployee(storage, id); // Strip any legacy password on every read.
    return id.slice(0, 64);
  } catch {
    rememberEmployee(storage, null);
    return '';
  }
}
