// Modal frame used by the catalog flows (header / scrolling body / right-aligned footer).
// Measured from catalog-image-modal.png and bulk-upload-image-modal.png.
import type { ReactNode } from 'react';

export function CatalogModal({ title, children, footer, onClose, width = 'w-[45rem]' }: { title: ReactNode; children: ReactNode; footer: ReactNode; onClose: () => void; width?: string }) {
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-overlay-bg" onClick={onClose} />
      <div className={`relative flex max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] flex-col rounded-lg bg-white animate-fade-in ${width}`}>
        <div className="border-0 border-b border-solid border-tertiary-border px-4 py-4.5 font-button text-xl leading-5 text-[rgb(33,33,33)]">{title}</div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
        <div className="flex justify-end gap-3 border-0 border-t border-solid border-tertiary-border px-4 py-3">{footer}</div>
      </div>
    </div>
  );
}

/** Grey-outlined secondary action (Cancel / Discard in the modals). */
export function GreyButton({ children, onClick, className = '' }: { children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-sm border border-solid border-primary-border bg-white px-3 font-button text-lg text-primary-text active:scale-90 transition-all ${className}`}
    >
      {children}
    </button>
  );
}
