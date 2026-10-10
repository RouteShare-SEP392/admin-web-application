import type { Metadata } from "next";
import { TripsView } from "./view";

export const metadata: Metadata = { title: "Chuyến đi" };

export default function TripsPage() {
  return <TripsView />;
}
