import { Suspense } from "react";
import { TripOperationsView } from "./view";
export default function Page() {
  return (
    <Suspense fallback={<p>Đang tải…</p>}>
      <TripOperationsView />
    </Suspense>
  );
}
