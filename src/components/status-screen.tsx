import type { ReactNode } from "react";
import { Logo } from "./logo";

/** Màn hình thông báo toàn trang cho lỗi và trang không tồn tại. */
export function StatusScreen({
  code,
  title,
  description,
  children,
}: {
  code?: string;
  title: string;
  description: string;
  /** Các nút hành động. */
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10 text-center">
      <Logo className="size-14" />
      {code ? (
        <p className="mt-6 text-sm font-semibold tracking-wide text-brand-700">{code}</p>
      ) : null}
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance">{title}</h1>
      <p className="mt-2 max-w-md text-muted text-pretty">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>
    </main>
  );
}
