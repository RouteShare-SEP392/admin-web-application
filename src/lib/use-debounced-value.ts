import { useEffect, useState } from "react";

/** Trả về giá trị sau khi nó ngừng thay đổi `delayMs`, để không gọi API ở mỗi phím gõ. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
