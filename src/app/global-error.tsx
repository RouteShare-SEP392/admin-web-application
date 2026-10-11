"use client"; // Ranh giới lỗi bắt buộc là Client Component.

import { useEffect } from "react";

/**
 * Lỗi xảy ra ngay trong layout gốc. File này thay thế toàn bộ layout nên phải
 * tự có <html>, <body> và không dùng được CSS chung của ứng dụng.
 */
export default function GlobalError({
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
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f6f8f6",
          color: "#1a1f1c",
        }}
      >
        <title>Đã có lỗi xảy ra · RouteShare Quản trị</title>
        <h1 style={{ margin: 0, fontSize: 24 }}>Đã có lỗi xảy ra</h1>
        <p style={{ margin: 0, maxWidth: 420, color: "#5b6660" }}>
          Trang quản trị không tải được do một lỗi bất ngờ. Bạn thử tải lại; nếu vẫn lỗi, hãy
          báo cho đội kỹ thuật.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            marginTop: 8,
            height: 40,
            padding: "0 16px",
            border: 0,
            borderRadius: 8,
            background: "#1f5c45",
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Thử lại
        </button>
      </body>
    </html>
  );
}
