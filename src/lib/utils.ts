import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useCallback, useRef } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Hook that returns a throttled version of a callback.
 * The callback will only fire at most once per `delay` ms.
 * Trailing calls are preserved (the last call during throttle period will fire).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottledCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0);
  const lastArgs = useRef<Parameters<T> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      lastArgs.current = args;

      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callback(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          if (lastArgs.current) {
            callback(...lastArgs.current);
          }
          timeoutRef.current = null;
        }, delay - (now - lastCall.current));
      }
    }) as T,
    [callback, delay]
  );
}
