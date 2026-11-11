import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[5fr_6fr]">
      <aside className="relative isolate hidden flex-col justify-between overflow-hidden bg-brand-900 p-10 text-white lg:flex">
        <div
          aria-hidden
          className="absolute -right-24 -bottom-24 -z-10 size-80 rounded-full border-[48px] border-brand-700/60"
        />
        <div className="flex items-center gap-3">
          <img
            src="/routeshare-logo.png"
            alt="RouteShare"
            className="size-10 shrink-0 rounded-xl object-contain"
          />
          <span className="text-lg font-semibold">RouteShare</span>
        </div>

        <div>
          <p className="text-3xl leading-snug font-semibold text-balance">
            Đi chung một đoạn đường, chia sẻ đúng phần chi phí.
          </p>
          <p className="mt-4 max-w-md text-brand-200">
            Trang quản trị dành cho đội vận hành: xét duyệt tài xế và phương tiện, theo dõi
            chuyến đi, xử lý vi phạm.
          </p>
        </div>

        <p className="flex items-center gap-2 text-sm text-brand-300">
          <ShieldCheck className="size-4" aria-hidden />
          Chỉ tài khoản có vai trò quản trị viên mới đăng nhập được.
        </p>

      </aside>

      <main className="flex items-center justify-center bg-canvas px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img
              src="/routeshare-logo.png"
              alt="RouteShare"
              className="size-10 shrink-0 rounded-xl object-contain"
            />
            <span className="text-lg font-semibold">RouteShare</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập quản trị</h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            Dùng email hoặc số điện thoại của tài khoản quản trị viên.
          </p>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
