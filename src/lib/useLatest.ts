import { useRef } from 'react';

/** A ref that always holds the latest value: timers can call the newest callback without restarting. */
export function useLatest<T>(value: T) {
  const r = useRef(value);
  r.current = value;
  return r;
}
