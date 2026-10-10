import type { Metadata } from "next";
import { SettingsView } from "./view";

export const metadata: Metadata = { title: "Cấu hình hệ thống" };

export default function SettingsPage() {
  return <SettingsView />;
}
