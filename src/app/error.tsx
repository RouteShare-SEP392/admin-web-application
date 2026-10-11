"use client"; // Ranh giới lỗi bắt buộc là Client Component.

import { useEffect } from "react";
import { StatusScreen } from "@/components/status-screen";
import { Button } from "@/components/ui/button";

/** Lỗi bất ngờ ở các trang ngoài khu vực quản trị (ví dụ trang đăng nhập). */
export default function RootError({
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
    <StatusScreen
      title="Đã có lỗi xảy ra"
      description="Trang không tải được do một lỗi bất ngờ. Bạn thử tải lại; nếu vẫn lỗi, hãy báo cho đội kỹ thuật."
    >
      <Button onClick={() => retry()}>Thử lại</Button>
    </StatusScreen>
  );
}
