"use client";

import { useQuery } from "@apollo/client/react";
import {
  Car,
  IdCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Route,
  Settings,
  ShieldAlert,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ME, PENDING_COUNTS } from "@/lib/graphql";
import { resolveMockMode } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui/misc";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "drivers" | "vehicles";
}

const NAV: { title: string | null; items: NavItem[] }[] = [
  {
    title: null,
    items: [{ href: "/", label: "Tổng quan", icon: LayoutDashboard }],
  },
  {
    title: "Xét duyệt",
    items: [
      { href: "/verifications/drivers", label: "Tài xế", icon: IdCard, badge: "drivers" },
      { href: "/verifications/vehicles", label: "Phương tiện", icon: Car, badge: "vehicles" },
    ],
  },
  {
    title: "Quản lý",
    items: [
      { href: "/users", label: "Người dùng", icon: Users },
      { href: "/trips", label: "Chuyến đi", icon: Route },
      { href: "/violations", label: "Vi phạm", icon: ShieldAlert },
    ],
  },
  {
    title: "Hệ thống",
    items: [{ href: "/settings", label: "Cấu hình", icon: Settings }],
  },
];

const MOCK_MODE_LABEL = {
  all: "Dữ liệu mẫu: toàn bộ",
  missing: "Dữ liệu mẫu: các trang chưa có API",
  off: null,
} as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
  // Tải lại toàn trang để xoá cache Apollo của phiên vừa đăng xuất.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/login");
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: meData } = useQuery(ME);
  const { data: pending } = useQuery(PENDING_COUNTS);

  const counts = {
    drivers: pending?.adminPendingDriverVerifications.length ?? 0,
    vehicles: pending?.adminPendingVehicleVerifications.length ?? 0,
  };
  const admin = meData?.me;
  const mockLabel = MOCK_MODE_LABEL[resolveMockMode()];

  return (
    <div className="min-h-dvh lg:pl-64">
      {menuOpen ? (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-brand-900/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-900 text-white transition-transform lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-accent text-brand-900">
              <Route className="size-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block font-semibold">RouteShare</span>
              <span className="block text-xs text-brand-300">Trang quản trị</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Đóng menu"
            className="rounded-lg p-1.5 text-brand-200 hover:bg-white/10 lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Điều hướng chính">
          {NAV.map((group, index) => (
            <div key={group.title ?? index} className="mb-4">
              {group.title ? (
                <p className="px-3 pb-1.5 text-xs font-semibold tracking-wide text-brand-300 uppercase">
                  {group.title}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const count = item.badge ? counts[item.badge] : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-brand-700 text-white"
                            : "text-brand-100 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <item.icon className="size-[18px] shrink-0" aria-hidden />
                        <span className="flex-1">{item.label}</span>
                        {count > 0 ? (
                          <span
                            className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-brand-900 tabular-nums"
                            aria-label={`${count} hồ sơ chờ duyệt`}
                          >
                            {count}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={admin?.fullName ?? "Quản trị"} />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{admin?.fullName ?? "Quản trị viên"}</p>
              <p className="truncate text-xs text-brand-300">{admin?.email ?? ""}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-100 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-[18px]" aria-hidden />
            Đăng xuất
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          aria-label="Mở menu"
          className="rounded-lg p-2 text-ink hover:bg-brand-50"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="size-5" />
        </button>
        <span className="font-semibold">RouteShare Quản trị</span>
        <span className="w-9" />
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {mockLabel ? (
          <p className="mb-5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">
            <span className="font-semibold">{mockLabel}.</span> Thay đổi chỉ lưu tạm trong
            bộ nhớ và mất khi khởi động lại máy chủ.
          </p>
        ) : null}
        {children}
      </main>
    </div>
  );
}
