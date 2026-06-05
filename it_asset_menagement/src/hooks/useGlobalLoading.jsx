import { useState, useCallback, useRef } from 'react';

/**
 * useGlobalLoading — global async loading tracker
 *
 *   const { isLoading, message, startLoading, stopLoading, withLoading } = useGlobalLoading();
 *
 *   // Manual:
 *   startLoading('กำลังบันทึก...');
 *   try { await ... } finally { stopLoading(); }
 *
 *   // Wrapper (recommended):
 *   await withLoading(async () => {
 *     await ...
 *   }, 'กำลังบันทึก...');
 *
 * Uses counter pattern so multiple concurrent ops keep the overlay up.
 */
export default function useGlobalLoading() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  const messageStack = useRef([]); // เก็บข้อความตามลำดับเปิด เพื่อ pop กลับเมื่อ stop

  const startLoading = useCallback((msg = '') => {
    messageStack.current.push(msg);
    setMessage(messageStack.current[messageStack.current.length - 1] || '');
    setCount((c) => c + 1);
  }, []);

  const stopLoading = useCallback(() => {
    messageStack.current.pop();
    setMessage(messageStack.current[messageStack.current.length - 1] || '');
    setCount((c) => Math.max(0, c - 1));
  }, []);

  const withLoading = useCallback(
    async (fn, msg = '') => {
      startLoading(msg);
      try {
        return await fn();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading],
  );

  return {
    isLoading: count > 0,
    message,
    startLoading,
    stopLoading,
    withLoading,
  };
}
