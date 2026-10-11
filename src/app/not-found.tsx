import type { Metadata } from "next";
import Link from "next/link";
import { StatusScreen } from "@/components/status-screen";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Không tìm thấy trang" };

export default function NotFound() {
  return (
    <StatusScreen
      code="Lỗi 404"
      title="Không tìm thấy trang này"
      description="Đường dẫn có thể đã bị gõ sai, hoặc trang đã được chuyển đi nơi khác."
    >
      <Link href="/" className={buttonClass("primary")}>
        Về trang tổng quan
      </Link>
    </StatusScreen>
  );
}
