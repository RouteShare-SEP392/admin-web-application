import type { Metadata } from "next";
import { ViolationsView } from "./view";

export const metadata: Metadata = { title: "Vi phạm tài xế" };

export default function ViolationsPage() {
  return <ViolationsView />;
}
