"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Field, Textarea } from "./field";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "md" | "xl";
  children: ReactNode;
  footer?: ReactNode;
}

/** Hộp thoại dựa trên <dialog> gốc: trình duyệt lo việc giữ focus và phím Esc. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-2xl bg-white p-0 text-ink shadow-xl",
        size === "xl" ? "max-w-4xl" : "max-w-md",
      )}
    >
      {open ? (
        <div className="flex max-h-[calc(100dvh-4rem)] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-sm text-muted">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="rounded-lg p-1.5 text-muted hover:bg-brand-50 hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </header>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {footer ? (
            <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">
              {footer}
            </footer>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}

interface ReasonDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  reasonLabel: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: (reason: string) => void;
}

/** Xác nhận một thao tác quản trị kèm lý do bắt buộc. */
export function ReasonDialog(props: ReasonDialogProps) {
  // Gắn lại form mỗi lần mở để lý do của lần trước không còn sót.
  return props.open ? <ReasonDialogForm {...props} /> : null;
}

function ReasonDialogForm({
  onClose,
  title,
  description,
  reasonLabel,
  confirmLabel,
  danger,
  busy,
  error,
  onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const inputId = useId();
  const formId = useId();
  const valid = reason.trim().length >= 5;

  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Quay lại
          </Button>
          <Button
            type="submit"
            form={formId}
            variant={danger ? "danger" : "primary"}
            disabled={!valid || busy}
          >
            {busy ? "Đang xử lý…" : confirmLabel}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onConfirm(reason.trim());
        }}
      >
        <Field
          label={reasonLabel}
          htmlFor={inputId}
          hint="Tối thiểu 5 ký tự."
          error={error}
        >
          <Textarea
            id={inputId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            autoFocus
            required
          />
        </Field>
      </form>
    </Dialog>
  );
}
