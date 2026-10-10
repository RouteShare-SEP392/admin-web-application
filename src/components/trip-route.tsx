import { ArrowRight } from "lucide-react";

interface StopSummary {
  stopName: string;
  sequenceOrder: number;
}

/** Tóm tắt lộ trình trên một dòng: điểm đi → điểm đến, kèm số điểm dừng giữa chừng. */
export function TripRoute({ stops }: { stops: (StopSummary | null)[] }) {
  const ordered = stops
    .filter((stop): stop is StopSummary => stop !== null)
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  if (ordered.length === 0) return <span className="text-muted">—</span>;
  const intermediate = ordered.length - 2;

  return (
    <div className="min-w-52 leading-tight">
      <p className="flex flex-wrap items-center gap-x-1.5 font-medium">
        {ordered[0].stopName}
        <ArrowRight className="size-3.5 shrink-0 text-subtle" aria-label="đến" />
        {ordered[ordered.length - 1].stopName}
      </p>
      {intermediate > 0 ? (
        <p className="text-xs text-muted">{intermediate} điểm dừng giữa chừng</p>
      ) : null}
    </div>
  );
}
