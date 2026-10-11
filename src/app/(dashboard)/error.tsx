"use client"; // Ranh giới lỗi bắt buộc là Client Component.

import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";

/**
 * Lỗi bất ngờ khi hiển thị một trang quản trị. Thanh điều hướng bên trái vẫn
 * còn nguyên nên quản trị viên chuyển sang trang khác được ngay.
 */
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center" role="alert">
      <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <CircleAlert className="size-6" aria-hidden />
      </span>
      <h1 className="text-xl font-semibold">Trang này gặp lỗi khi hiển thị</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Dữ liệu của bạn không bị ảnh hưởng. Bạn thử tải lại trang; nếu vẫn lỗi, hãy gửi mã
        dưới đây cho đội kỹ thuật.
      </p>
      {error.digest ? (
        <p className="mt-3 rounded-md bg-gray-100 px-2.5 py-1 font-mono text-xs text-muted">
          Mã lỗi: {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()}>Thử lại</Button>
        <Link href="/" className={buttonClass("secondary")}>
          Về trang tổng quan
        </Link>
      </div>
    </Card>
  );
}
