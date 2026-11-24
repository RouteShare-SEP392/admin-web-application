"use client";
import { ExternalLink, FileImage, Minus, Plus } from "lucide-react";
import { useState } from "react";

export function VerificationDocumentViewer({ front, back }: { front: string | null; back: string | null }) {
  const [side, setSide] = useState<"front" | "back">("front");
  const [zoom, setZoom] = useState(1);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = side === "front" ? front : back;
  return <section className="flex min-w-0 flex-col bg-gray-100/80" aria-label="Ảnh giấy tờ">
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="flex rounded-lg bg-gray-200/60 p-1">{(["front", "back"] as const).map((value) => <button key={value} type="button" aria-pressed={side === value} onClick={() => { setSide(value); setZoom(1); }} className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${side === value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}>{value === "front" ? "Mặt trước" : "Mặt sau"}</button>)}</div>
      {url ? <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700">Ảnh gốc <ExternalLink className="size-3.5" aria-hidden /></a> : null}
    </div>
    <div className="rs-document-canvas h-64 shrink-0 overflow-auto p-4 sm:h-80">
      {url && failedUrl !== url ? <div key={url} className="flex items-center justify-center" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
        {/* Short-lived authorized KYC URLs must not pass through the image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={side === "front" ? "Mặt trước giấy tờ" : "Mặt sau giấy tờ"} onError={() => setFailedUrl(url)} className="block size-full object-contain drop-shadow-lg" />
      </div> : <div className="flex h-full flex-col items-center justify-center text-center"><FileImage className="mb-4 size-10 text-subtle" aria-hidden /><p className="text-sm text-muted">{url ? "Không tải được ảnh giấy tờ." : "Không có ảnh mặt này."}</p>{url ? <button type="button" className="mt-3 text-sm font-medium text-brand-700" onClick={() => setFailedUrl(null)}>Thử lại</button> : null}</div>}
    </div>
    <div className="flex items-center justify-center gap-4 border-t border-line/70 py-2"><button type="button" aria-label="Thu nhỏ ảnh" disabled={!url || zoom <= 1} className="rounded-lg p-2 text-muted hover:bg-white disabled:opacity-30" onClick={() => setZoom((value) => Math.max(1, value - .25))}><Minus className="size-4" /></button><span className="w-10 text-center text-xs tabular-nums text-muted">{Math.round(zoom * 100)}%</span><button type="button" aria-label="Phóng to ảnh" disabled={!url || zoom >= 2} className="rounded-lg p-2 text-muted hover:bg-white disabled:opacity-30" onClick={() => setZoom((value) => Math.min(2, value + .25))}><Plus className="size-4" /></button></div>
  </section>;
}
