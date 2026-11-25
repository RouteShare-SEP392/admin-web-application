import { useState } from 'react';

export type ReceiptBucket = Record<'start' | 'cash' | 'transfer' | 'other', string>;
const methods = [
  { key: 'cash', label: 'Tiền mặt', color: 'bg-brand-600' },
  { key: 'transfer', label: 'VietQR', color: 'bg-sky-600' },
  { key: 'other', label: 'Chưa rõ', color: 'bg-slate-500' },
] as const;
const total = (point: ReceiptBucket) => methods.reduce((sum, m) => sum + Number(point[m.key]), 0);
const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 2 });

export function ReceiptsChart({ buckets, period }: { buckets: ReceiptBucket[]; period: string }) {
  const [selected, setSelected] = useState<string>();
  const peak = Math.max(0, ...buckets.map(total));
  const active = buckets.find(point => point.start === selected) ?? buckets.find(point => total(point) === peak);
  const date = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    ...(period === 'day' ? { hour: '2-digit', hourCycle: 'h23' } : period === 'quarter' ? { month: 'numeric' } : { day: '2-digit' }),
  });
  return <section className="space-y-3 rounded-xl border border-line p-4" aria-label="Biểu đồ cước đã thu">
    <h3 className="font-semibold">Cước đã thu theo thời gian</h3>
    {!peak ? <p className="text-sm text-muted">Chưa ghi nhận tiền cước trong kỳ này.</p> : <>
      <p className="text-sm text-muted">Thang cột: 0 – {vnd.format(peak)} · Giờ Việt Nam</p>
      <div className="overflow-x-auto">
        <div className="flex gap-1" style={{ minWidth: buckets.length * 34 }}>
          {buckets.map(point => <button type="button" key={point.start} className="flex min-w-8 flex-1 flex-col items-center justify-end gap-1 rounded-md px-1 pb-1 text-xs hover:bg-brand-50 aria-pressed:bg-brand-50"
            aria-pressed={active?.start === point.start} aria-label={`${date.format(new Date(point.start))}: ${vnd.format(total(point))}`} onClick={() => setSelected(point.start)}>
            <span aria-hidden className="flex h-32 w-full max-w-8 flex-col justify-end border-b border-line">
              {[...methods].reverse().map(m => <span key={m.key} className={m.color} style={{ height: `${100 * Number(point[m.key]) / peak}%` }} />)}
            </span>
            <span>{date.format(new Date(point.start))}</span>
          </button>)}
        </div>
      </div>
      {active ? <dl className="grid gap-3 rounded-lg bg-brand-50 p-3 text-sm sm:grid-cols-4" aria-live="polite">
        <div><dt>{period === 'day' ? 'Giờ' : period === 'quarter' ? 'Tháng' : 'Ngày'} {date.format(new Date(active.start))}</dt><dd className="font-semibold">{vnd.format(total(active))}</dd></div>
        {methods.map(m => <div key={m.key}><dt><span aria-hidden className={`mr-1 inline-block size-2 rounded-full ${m.color}`} />{m.label}</dt><dd>{vnd.format(Number(active[m.key]))}</dd></div>)}
      </dl> : null}
    </>}
  </section>;
}
