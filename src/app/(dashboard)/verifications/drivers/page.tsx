import type { Metadata } from "next";
import { DriverVerificationsView } from "./view";

export const metadata: Metadata = { title: "Duyệt hồ sơ tài xế" };

export default function DriverVerificationsPage() {
  return <DriverVerificationsView />;
}
