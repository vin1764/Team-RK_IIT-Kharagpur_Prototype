import { useEffect } from 'react';
import { create } from 'zustand';

interface ToastState {
  message: string | null;
  show: (m: string) => void;
  hide: () => void;
}

const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));

export const toast = (m: string) => useToast.getState().show(m);

/** For buttons that lead somewhere we have no reference for. */
export const notInPrototype = (what: string) => toast(`${what} isn't part of this prototype`);

export function ToastHost() {
  const { message, hide } = useToast();
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, 2600);
    return () => clearTimeout(t);
  }, [message, hide]);
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-snackbar animate-fade-in" role="status">
      <div className="rounded-sm bg-primary-text text-white px-4 py-2.5 text-lg font-body shadow-lg">{message}</div>
    </div>
  );
}
