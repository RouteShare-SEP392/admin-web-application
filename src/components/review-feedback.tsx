"use client";

import { MessageSquare, Star } from "lucide-react";
import { Avatar } from "./ui/misc";
import { formatDateTime } from "@/lib/utils";
import type { OperationalRow } from "./operational-record-layouts";

/** The current read API projects the persisted rating and comment as `rating/5 · comment`. */
export function parseReviewDetail(detail: string | null) {
  const match = detail?.match(/^([1-5])\/5\s*·\s*([\s\S]*)$/);
  return match
    ? { rating: Number(match[1]), comment: match[2].trim() }
    : { rating: null, comment: detail?.trim() ?? "" };
}

function Stars({ rating }: { rating: number }) {
  return <span className="inline-flex gap-1" role="img" aria-label={`${rating} trên 5 sao`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} aria-hidden className={`size-3.5 ${star <= rating ? "fill-current text-brand-600" : "text-gray-200"}`} />)}</span>;
}

export function ReviewFeedback({ rows }: { rows: OperationalRow[] }) {
  const reviews = rows.map((row) => ({ ...row, ...parseReviewDetail(row.detail) }));
  const rated = reviews.filter((row) => row.rating !== null);
  const average = rated.length ? rated.reduce((sum, row) => sum + row.rating!, 0) / rated.length : null;

  return <div className="grid items-start gap-7 p-5 sm:p-6 xl:grid-cols-[200px_minmax(0,1fr)]">
    <aside className="rounded-xl bg-gray-50 p-5 xl:sticky xl:top-6">
      <h2 className="text-xs font-medium text-muted">Điểm trên trang này</h2>
      <p className="mt-4 flex items-baseline gap-1.5"><span className="text-5xl font-semibold tracking-tight tabular-nums">{average === null ? "—" : average.toLocaleString("vi-VN", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}</span><span className="text-sm text-muted">/ 5</span></p>
      <p className="mt-2 text-xs text-muted">{rated.length} đánh giá có điểm</p>
      <div className="mt-6 space-y-2.5" aria-label="Phân bố điểm trên trang này">{[5, 4, 3, 2, 1].map((score) => {
        const count = rated.filter((row) => row.rating === score).length;
        return <div key={score} className="flex items-center gap-2 text-xs text-muted" aria-label={`${score} sao: ${count} đánh giá`}><span className="w-2 tabular-nums">{score}</span><Star className="size-3 shrink-0" aria-hidden /><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200" aria-hidden><span className="block h-full rounded-full bg-brand-500" style={{ width: `${rated.length ? count / rated.length * 100 : 0}%` }} /></span><span className="w-5 text-right tabular-nums">{count}</span></div>;
      })}</div>
    </aside>
    <section className="min-w-0" aria-label="Phản hồi hành trình">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Phản hồi hành trình</h2><span className="text-xs text-muted">{reviews.length} mục trên trang</span></div>
      <div className="grid gap-4 lg:grid-cols-2">{reviews.map((review) => <article key={review.id} className="rs-record-enter flex min-w-0 flex-col rounded-xl border border-line bg-white p-5 transition-colors hover:border-brand-200">
        <header className="flex items-center gap-3"><Avatar name={review.subject} /><div className="min-w-0"><h3 className="break-words text-sm font-semibold">{review.subject}</h3><p className="mt-1 text-xs text-muted">{review.status === "AS_DRIVER" ? "Nhận xét về tài xế" : review.status === "AS_PASSENGER" ? "Nhận xét về hành khách" : review.status}</p></div></header>
        <div className="mt-5 flex items-center gap-3">{review.rating !== null ? <><Stars rating={review.rating} /><span className="text-sm font-semibold tabular-nums">{review.rating}<span className="font-normal text-muted"> / 5</span></span></> : <span className="text-xs text-muted">Chưa có điểm hợp lệ</span>}</div>
        {review.comment ? <p className="mt-4 flex-1 whitespace-pre-wrap break-words text-sm leading-7">{review.comment}</p> : <div className="mt-4 flex flex-1 items-start gap-2 text-sm text-muted"><MessageSquare className="mt-0.5 size-4 shrink-0 text-gray-300" aria-hidden /><p>Chỉ chấm sao, không kèm nhận xét.</p></div>}
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line/70 pt-3 text-[11px] text-muted"><span className="break-all font-mono" title="Mã đặt chỗ">{review.reference}</span><time dateTime={review.createdAt}>{formatDateTime(review.createdAt)}</time></footer>
      </article>)}</div>
    </section>
  </div>;
}
