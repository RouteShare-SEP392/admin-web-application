import type { Metadata } from "next";
import { VehicleVerificationsView } from "./view";

export const metadata: Metadata = { title: "Duyệt giấy tờ xe" };

export default function VehicleVerificationsPage() {
  return <VehicleVerificationsView />;
}
