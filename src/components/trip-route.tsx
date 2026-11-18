import { ArrowRight, CircleDot, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface StopSummary {
  stopName: string;
  sequenceOrder: number;
}

/** Tóm tắt lộ trình trên một dòng: điểm đi → điểm đến, kèm số điểm dừng giữa chừng. */
export function TripRoute({
  stops,
  className,
}: {
  stops: (StopSummary | null)[];
  className?: string;
}) {
  const ordered = stops
    .filter((stop): stop is StopSummary => stop !== null)
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  if (ordered.length === 0) return <span className="text-muted">—</span>;
  const intermediate = ordered.length - 2;

  return (
    <div className={cn("min-w-52 leading-tight", className)}>
      <p className="flex flex-wrap items-center gap-x-1.5 font-medium">
        <span className="inline-flex min-w-0 items-center gap-1.5"><CircleDot className="size-4 shrink-0 text-brand-700" aria-label="Điểm đi" /><span>{ordered[0].stopName}</span></span>
        <ArrowRight className="size-3.5 shrink-0 text-subtle" aria-label="đến" />
        <span className="inline-flex min-w-0 items-center gap-1.5"><MapPin className="size-4 shrink-0 text-red-600" aria-label="Điểm đến" /><span>{ordered[ordered.length - 1].stopName}</span></span>
      </p>
      {intermediate > 0 ? (
        <p className="text-xs text-muted">{intermediate} điểm dừng giữa chừng</p>
      ) : null}
    </div>
  );
}
