// The parent side of the frame ↔ sidebar protocol (types.ts). Accepts only same-origin messages
// from our own iframe; sends to it with the same origin as target.
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { isShowcaseMsg, type FrameMsg, type ShowMsg } from './types';

export type FrameState = Extract<FrameMsg, { type: 'state' }>;
type Body<T> = T extends unknown ? Omit<T, 'rk'> : never;
export type Outgoing = Body<ShowMsg>;

/** How long the frame may take to post 'ready' before the "not responding" notice shows. */
export const READY_TIMEOUT_MS = 4000;

export function useFrameLink(iframe: RefObject<HTMLIFrameElement | null>, onReady: () => void) {
  const [ready, setReady] = useState(false);
  const [stale, setStale] = useState(false);
  const [state, setState] = useState<FrameState | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const readyRef = useRef(false);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const win = iframe.current?.contentWindow;
      if (!win || e.source !== win) return;
      if (!isShowcaseMsg(e.data)) return;
      const m = e.data as FrameMsg;
      if (m.type === 'ready') {
        readyRef.current = true;
        setReady(true);
        setStale(false);
        onReadyRef.current();
      } else if (m.type === 'state') {
        setState(m);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [iframe]);

  const send = useCallback(
    (msg: Outgoing) => {
      const win = iframe.current?.contentWindow;
      if (!win || !readyRef.current) return false;
      win.postMessage({ rk: 'showcase', ...msg } satisfies ShowMsg, window.location.origin);
      return true;
    },
    [iframe],
  );

  /** Call when the iframe's src is (re)set: it must post 'ready' again. */
  const loading = useCallback(() => {
    readyRef.current = false;
    setReady(false);
    setStale(false);
  }, []);

  // The "not responding" notice, re-armed whenever the frame is (re)loading.
  useEffect(() => {
    if (ready) return;
    const t = window.setTimeout(() => {
      if (!readyRef.current) setStale(true);
    }, READY_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [ready]);

  return { ready, stale, state, send, loading };
}
