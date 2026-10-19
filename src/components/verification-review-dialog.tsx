"use client";

import { Check, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Field, Textarea } from "./ui/field";

interface Photo {
  label: string;
  url: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  photos: Photo[];
  /** Khối thông tin đối chiếu hiển thị bên cạnh ảnh giấy tờ. */
  children: ReactNode;
  busy: boolean;
  error: string | null;
  onApprove: () => void;
  onReject: (reason: string) => void;
  /** Lý do chưa thể phê duyệt; có thì nút Phê duyệt bị khoá và lý do được hiển thị. */
  approveBlockedReason?: string | null;
  /** Vị trí của hồ sơ trong hàng chờ đang lọc, để chuyển qua lại mà không đóng hộp thoại. */
  queue?: { index: number; total: number; onNavigate: (step: -1 | 1) => void };
  /** Trang gom toàn bộ giấy tờ và phương tiện của tài xế này. */
  profileHref?: string;
}

/** Hộp thoại xem xét một hồ sơ giấy tờ: xem ảnh, đối chiếu, duyệt hoặc từ chối. */
export function VerificationReviewDialog(props: Props) {
  // Gắn lại nội dung mỗi lần mở để trạng thái từ chối của hồ sơ trước không còn sót.
  return props.open ? <ReviewContent {...props} /> : null;
}

function ReviewContent({
  onClose,
  title,
  description,
  photos,
  children,
  busy,
  error,
  onApprove,
  onReject,
  approveBlockedReason,
  queue,
  profileHref,
}: Props) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const reasonId = useId();
  const reasonValid = reason.trim().length >= 5;

  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      description={description}
      size="xl"
      footer={
        rejecting ? (
          <>
            <Button variant="secondary" onClick={() => setRejecting(false)} disabled={busy}>
              Quay lại
            </Button>
            <Button
              variant="danger"
              disabled={!reasonValid || busy}
              onClick={() => onReject(reason.trim())}
            >
              {busy ? "Đang xử lý…" : "Xác nhận từ chối"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setRejecting(true)} disabled={busy}>
              <X className="size-4" aria-hidden />
              Từ chối
            </Button>
            <Button onClick={onApprove} disabled={busy || Boolean(approveBlockedReason)}>
              <Check className="size-4" aria-hidden />
              {busy ? "Đang xử lý…" : "Phê duyệt"}
            </Button>
          </>
        )
      }
    >
      {queue || profileHref ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          {queue ? (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                aria-label="Hồ sơ trước"
                disabled={busy || queue.index === 0}
                onClick={() => queue.onNavigate(-1)}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <span className="text-muted tabular-nums">
                Hồ sơ {queue.index + 1}/{queue.total}
              </span>
              <Button
                variant="secondary"
                size="sm"
                aria-label="Hồ sơ sau"
                disabled={busy || queue.index >= queue.total - 1}
                onClick={() => queue.onNavigate(1)}
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          ) : (
            <span />
          )}
          {profileHref ? (
            <Link href={profileHref} className="font-medium text-brand-700 hover:underline">
              Xem toàn bộ hồ sơ tài xế
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          {photos.map((photo) => (
            <figure key={photo.label}>
              <figcaption className="mb-1.5 flex items-center justify-between text-sm font-medium">
                {photo.label}
                {photo.url ? (
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-brand-700 hover:underline"
                  >
                    Mở ảnh gốc
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : null}
              </figcaption>
              {photo.url ? (
                // Ảnh KYC là SAS URL ngắn hạn từ Azure Blob nên không qua bộ tối ưu ảnh.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.url}
                  alt={photo.label}
                  className="max-h-80 w-full rounded-xl border border-line bg-canvas object-contain"
                />
              ) : (
                <p className="rounded-xl border border-dashed border-line bg-canvas px-4 py-8 text-center text-sm text-muted">
                  Người dùng không nộp ảnh này.
                </p>
              )}
            </figure>
          ))}
        </div>

        <div className="space-y-5">
          {children}

          {approveBlockedReason && !rejecting ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {approveBlockedReason}
            </p>
          ) : null}

          {rejecting ? (
            <Field
              label="Lý do từ chối"
              htmlFor={reasonId}
              hint="Người dùng sẽ thấy lý do này. Tối thiểu 5 ký tự."
            >
              <Textarea
                id={reasonId}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Ví dụ: Ảnh bị mờ, không đọc được số giấy tờ."
                autoFocus
              />
            </Field>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}
