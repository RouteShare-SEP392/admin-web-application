"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function ConfirmationDialog({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} aria-labelledby="confirmation-title" className="rs-confirm-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line bg-white p-0 text-ink shadow-xl" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="flex items-center justify-between border-b border-line px-6 py-4">
      <h2 id="confirmation-title" className="font-semibold">{title}</h2>
      <button type="button" aria-label="Đóng xác nhận" disabled={busy} onClick={onClose} className="rounded-lg p-2 text-muted transition-colors hover:bg-gray-100 disabled:opacity-40"><X className="size-4" /></button>
    </div>
    <div className="max-h-[75dvh] space-y-5 overflow-y-auto p-6">{children}</div>
  </dialog>;
}
