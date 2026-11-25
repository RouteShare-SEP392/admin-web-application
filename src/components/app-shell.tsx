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
  Wallet,
  History,
  ClipboardList,
  CreditCard,
  Star,
  Bell,
  LifeBuoy,
  ScrollText,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ME, PENDING_COUNTS } from "@/lib/graphql";
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
    title: "Vận hành",
    items: [
      { href: "/users", label: "Người dùng", icon: Users },
      { href: "/trips", label: "Chuyến đi", icon: Route },
      { href: "/journey-history", label: "Lịch sử hành trình", icon: History },
      { href: "/trip-operations", label: "Lịch định kỳ & thay đổi", icon: History },
      { href: "/operations/bookings", label: "Đặt chỗ", icon: ClipboardList },
      { href: "/violations", label: "Phản ánh & điểm tuân thủ", icon: ShieldAlert },
      { href: "/operations/reviews", label: "Đánh giá", icon: Star },
      { href: "/support-cases", label: "Yêu cầu hỗ trợ", icon: LifeBuoy },
    ],
  },
  {
    title: "Tài chính",
    items: [
      { href: "/operations/payments", label: "Thu tiền & đối soát", icon: CreditCard },
      { href: "/payouts", label: "Chi trả tài xế", icon: Wallet },
      { href: "/driver-fees", label: "Ví phí & Báo cáo tài xế", icon: Wallet },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { href: "/operations/notifications", label: "Thông báo", icon: Bell },
      { href: "/operations/audit", label: "Nhật ký quản trị", icon: ScrollText },
      { href: "/settings", label: "Cấu hình hệ thống", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
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
  const currentSection = NAV.flatMap((group) => group.items).find((item) => isActive(pathname, item.href));

  return (
    <div className="min-h-dvh lg:pl-72">
      <a href="#admin-content" className="sr-only fixed top-3 left-3 z-50 rounded-lg bg-white px-4 py-3 text-brand-900 shadow-lg focus:not-sr-only">Đến nội dung chính</a>
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
          "rs-app-sidebar fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-white text-ink transition-transform lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-line px-5">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
            <img
              src="/routeshare-logo.png"
              alt="RouteShare"
              className="size-8 shrink-0 rounded-lg object-contain"
            />
            <span className="leading-tight">
              <span className="block font-semibold">RouteShare</span>
              <span className="mt-1 block text-[10px] font-medium tracking-[0.16em] text-muted uppercase">Quản trị vận hành</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Đóng menu"
              className="rounded-lg p-1.5 text-muted hover:bg-gray-100 lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="rs-sidebar-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-2" aria-label="Điều hướng chính">
          {NAV.map((group, index) => (
            <div key={group.title ?? index} className="mb-4" data-nav-group={group.title ?? "Tổng quan"}>
              {group.title ? (
                <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-widest text-subtle uppercase">
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
                          "rs-nav-link flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-brand-50 text-brand-800"
                            : "text-muted hover:bg-gray-50 hover:text-ink",
                        )}
                      >
                        <item.icon className="size-[18px] shrink-0" aria-hidden />
                        <span className="flex-1">{item.label}</span>
                        {count > 0 ? (
                          <span
                            className={cn("rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums", active ? "bg-brand-700 text-white" : "bg-gray-100 text-muted")}
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

        <div className="shrink-0 border-t border-line p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={admin?.fullName ?? "Quản trị"} />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{admin?.fullName ?? "Quản trị viên"}</p>
              <p className="truncate text-xs text-muted">{admin?.email ?? ""}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-gray-100 hover:text-ink"
          >
            <LogOut className="size-[18px]" aria-hidden />
            Đăng xuất
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
        <button
          type="button"
          aria-label="Mở menu"
          aria-expanded={menuOpen}
          className="rounded-lg p-3 text-ink hover:bg-brand-50 lg:hidden"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="size-5" />
        </button>
        <div className="min-w-0 flex-1 text-sm"><span className="hidden text-muted sm:inline">RouteShare <span className="mx-2 text-subtle">/</span></span><span className="font-medium">{currentSection?.label ?? "Chi tiết"}</span></div>
      </header>

      <main id="admin-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
        <div key={pathname} className="rs-page-enter">{children}</div>
      </main>
    </div>
  );
}
