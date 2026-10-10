import { cn } from "@/lib/utils";

/** Logo RouteShare, dùng chung file với ứng dụng mobile (assets/routeshare-logo.svg). */
export function Logo({ className }: { className?: string }) {
  return (
    // File SVG tĩnh trong public/, không cần qua bộ tối ưu ảnh của Next.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt=""
      width={44}
      height={44}
      className={cn("shrink-0", className)}
    />
  );
}
