import { Check, ExternalLink, X } from "lucide-react";
import type { ReactNode } from "react";
import { VERIFICATION_STATUS } from "@/lib/labels";
import type { VerificationStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";

/** Phần chung của giấy tờ tài xế và giấy tờ xe mà thẻ cần để hiển thị. */
export interface ReviewableDocument {
  id: string;
  documentNumber: string;
  frontPhotoUrl: string;
  backPhotoUrl: string | null;
  status: VerificationStatus;
  rejectReason: string | null;
  reviewedAt: string | null;
  reviewedBy: { fullName: string } | null;
  createdAt: string;
}

/**
 * Một giấy tờ trong trang hồ sơ tài xế: ảnh hai mặt, thông tin, kết quả xét
 * duyệt, và nút duyệt hoặc từ chối khi giấy tờ còn chờ.
 */
export function DocumentCard({
  title,
  document,
  previous = [],
  facts,
  busy,
  approveBlockedReason,
  onApprove,
  onReject,
}: {
  title: string;
  /** null khi tài xế chưa nộp loại giấy tờ này. */
  document: ReviewableDocument | null;
  /** Các bản nộp cũ hơn của cùng giấy tờ, mới trước. */
  previous?: ReviewableDocument[];
  /** Các dòng thông tin riêng của loại giấy tờ, hiển thị dạng "nhãn: giá trị". */
  facts?: ReactNode;
  busy?: boolean;
  /** Lý do chưa thể phê duyệt; có thì nút Phê duyệt bị khoá và lý do hiện ngay trên thẻ. */
  approveBlockedReason?: string | null;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  if (!document) {
    return (
      <article className="rounded-xl border border-dashed border-line bg-canvas p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">{title}</h3>
          <StatusBadge meta={VERIFICATION_STATUS.NOT_SUBMITTED} />
        </div>
        <p className="mt-2 text-sm text-muted">Tài xế chưa nộp giấy tờ này.</p>
      </article>
    );
  }

  const pending = document.status === "PENDING";

  return (
    <article className="rounded-xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <StatusBadge meta={VERIFICATION_STATUS[document.status]} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Photo label="Mặt trước" url={document.frontPhotoUrl} />
        <Photo label="Mặt sau" url={document.backPhotoUrl} />
      </div>

      <dl className="mt-4 divide-y divide-line text-sm">
        <Row label="Số giấy tờ">{document.documentNumber}</Row>
        {facts}
        <Row label="Nộp lúc">{formatDateTime(document.createdAt)}</Row>
        {document.reviewedAt ? (
          <Row label={document.status === "REJECTED" ? "Từ chối lúc" : "Duyệt lúc"}>
            {formatDateTime(document.reviewedAt)}
            {document.reviewedBy ? ` · ${document.reviewedBy.fullName}` : ""}
          </Row>
        ) : null}
      </dl>

      {document.status === "REJECTED" && document.rejectReason ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          <span className="font-semibold">Lý do từ chối:</span> {document.rejectReason}
        </p>
      ) : null}

      {pending && onApprove && onReject ? (
        <div className="mt-4 border-t border-line pt-4">
          {approveBlockedReason ? (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {approveBlockedReason}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onReject} disabled={busy}>
              <X className="size-4" aria-hidden />
              Từ chối
            </Button>
            <Button size="sm" onClick={onApprove} disabled={busy || Boolean(approveBlockedReason)}>
              <Check className="size-4" aria-hidden />
              {busy ? "Đang xử lý…" : "Phê duyệt"}
            </Button>
          </div>
        </div>
      ) : null}

      {previous.length > 0 ? <PreviousSubmissions documents={previous} /> : null}
    </article>
  );
}

/** Các lần nộp trước, thu gọn mặc định để thẻ tập trung vào bản đang xét. */
function PreviousSubmissions({ documents }: { documents: ReviewableDocument[] }) {
  return (
    <details className="mt-4 border-t border-line pt-3 text-sm">
      <summary className="cursor-pointer font-medium text-brand-700">
        Các lần nộp trước ({documents.length})
      </summary>
      <ul className="mt-2 space-y-2">
        {documents.map((doc) => (
          <li key={doc.id} className="rounded-lg border border-line px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted">
                Nộp {formatDateTime(doc.createdAt)} · số {doc.documentNumber}
              </span>
              <StatusBadge meta={VERIFICATION_STATUS[doc.status]} />
            </div>
            {doc.reviewedAt ? (
              <p className="mt-1 text-muted">
                {doc.status === "REJECTED" ? "Từ chối" : "Duyệt"} lúc {formatDateTime(doc.reviewedAt)}
                {doc.reviewedBy ? ` · ${doc.reviewedBy.fullName}` : ""}
              </p>
            ) : null}
            {doc.status === "REJECTED" && doc.rejectReason ? (
              <p className="mt-1 text-red-800">Lý do: {doc.rejectReason}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Một dòng thông tin trong thẻ giấy tờ; cũng dùng cho tham số `facts`. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right font-medium break-words">{children}</dd>
    </div>
  );
}

function Photo({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="flex aspect-[8/5] items-center justify-center rounded-lg border border-dashed border-line bg-canvas px-2 text-center text-xs text-muted">
        Không có ảnh {label.toLowerCase()}
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group relative block overflow-hidden rounded-lg border border-line bg-canvas"
      aria-label={`${label}: mở ảnh gốc ở tab mới`}
    >
      {/* Ảnh KYC là SAS URL ngắn hạn từ Azure Blob nên không qua bộ tối ưu ảnh. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={label} className="aspect-[8/5] w-full object-contain" />
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/70 px-2 py-1 text-xs font-medium text-white">
        {label}
        <ExternalLink className="size-3.5 opacity-70 group-hover:opacity-100" aria-hidden />
      </span>
    </a>
  );
}
