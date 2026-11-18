import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { SettingsView } from "./view";

export const metadata: Metadata = { title: "Cấu hình hệ thống" };

export default function SettingsPage() {
  return <Suspense fallback={<TableSkeleton />}><SettingsView /></Suspense>;
}
