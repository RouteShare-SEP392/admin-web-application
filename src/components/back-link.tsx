"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { rememberedListUrl } from "@/lib/use-url-state";

/** Link quay về trang danh sách, giữ lại bộ lọc và số trang mà người dùng đang xem trước đó. */
export function BackLink({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(event) => {
        const remembered = rememberedListUrl(href);
        if (remembered && remembered !== href) {
          event.preventDefault();
          router.push(remembered);
        }
      }}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand-700"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
