"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TripStop } from "@/lib/types";
import { decodeSavedRoute, validCoordinate, type Coordinate } from "@/lib/saved-route";
import { Button } from "./ui/button";

/** Read-only saved itinerary. No Directions, geolocation or active vehicle tracking. */
export function TripRouteMap({ stops, polyline }: { stops: TripStop[]; polyline: string | null }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const key = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY;
  const route = decodeSavedRoute(polyline);
  const validStops = stops.filter((stop) => validCoordinate(stop.longitude, stop.latitude));
  const hasPoints = route.length > 0 || validStops.length > 0;
  // Parent views may rebuild the stops array on unrelated query updates.
  const stopSnapshot = JSON.stringify(stops);
  const stableStops = useMemo(() => JSON.parse(stopSnapshot) as TripStop[], [stopSnapshot]);

  useEffect(() => {
    if (!key || !container.current || !hasPoints) return;
    let disposed = false;
    let map: import("@goongmaps/goong-js").Map | undefined;
    let observer: ResizeObserver | undefined;
    async function mount() {
      try {
        const { default: goong } = await import("@goongmaps/goong-js");
        if (disposed || !container.current) return;
        goong.accessToken = key!;
        const saved = decodeSavedRoute(polyline);
        const locations = stableStops.filter((stop) => validCoordinate(stop.longitude, stop.latitude));
        const points: Coordinate[] = [...saved, ...locations.map((stop): Coordinate => [stop.longitude, stop.latitude])];
        map = new goong.Map({ container: container.current, style: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${encodeURIComponent(key!)}`, center: points[0], zoom: 12 });
        map.addControl(new goong.NavigationControl({ showCompass: false }), "top-right");
        map.on("error", () => { if (!disposed) setError("Không tải được bản đồ Goong. Kiểm tra kết nối hoặc quyền tên miền của Map tiles key."); });
        map.on("load", () => {
          if (disposed || !map) return;
          if (saved.length > 1) {
            map.addSource("saved-route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: saved } } });
            map.addLayer({ id: "saved-route-halo", type: "line", source: "saved-route", paint: { "line-color": "#ffffff", "line-width": 8 } });
            map.addLayer({ id: "saved-route-line", type: "line", source: "saved-route", paint: { "line-color": "#1f5c45", "line-width": 4 } });
          }
          locations.forEach((stop) => {
            const marker = document.createElement("button");
            marker.type = "button";
            marker.className = `rs-map-marker rs-map-marker-${stop.stopType.toLowerCase()}`;
            marker.textContent = stop.stopType === "INTERMEDIATE_STOP" ? String(stop.sequenceOrder) : "";
            marker.setAttribute("aria-label", stop.stopName);
            new goong.Marker({ element: marker }).setLngLat([stop.longitude, stop.latitude])
              .setPopup(new goong.Popup({ offset: 18 }).setText(`${stop.stopName} · ${stop.stopAddress}`)).addTo(map!);
          });
          let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
          for (const [lng, lat] of points) { west = Math.min(west, lng); east = Math.max(east, lng); south = Math.min(south, lat); north = Math.max(north, lat); }
          map.fitBounds([[west, south], [east, north]], { padding: 48, maxZoom: 15, duration: 0 });
          setReady(true);
        });
        observer = new ResizeObserver(() => map?.resize());
        observer.observe(container.current);
      } catch { if (!disposed) setError("Không khởi tạo được bản đồ. Trình duyệt cần hỗ trợ WebGL."); }
    }
    void mount();
    return () => { disposed = true; observer?.disconnect(); map?.remove(); };
   }, [key, stableStops, polyline, revision, hasPoints]);

  if (!key) return <div className="rounded-xl border border-line bg-canvas p-5 text-sm text-muted">Chưa cấu hình Map tiles key Goong cho web. Không thay tuyến đã lưu bằng sơ đồ nối thẳng hoặc nhà cung cấp khác.</div>;
  if (!hasPoints) return <p className="rounded-xl bg-canvas p-4 text-sm text-muted">Không có tọa độ hợp lệ để hiển thị bản đồ.</p>;
  return <div className="space-y-2">
    <div className="relative isolate overflow-hidden rounded-xl border border-line">
      <div ref={container} className="h-80 w-full sm:h-96" role="region" aria-label="Bản đồ lộ trình đã lưu" />
      {!ready && !error ? <p className="pointer-events-none absolute top-3 left-3 rounded-lg bg-white px-3 py-2 text-sm shadow-sm" role="status">Đang tải bản đồ Goong…</p> : null}
    </div>
    {error ? <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800"><p>{error}</p><Button className="mt-2" variant="secondary" size="sm" onClick={() => { setError(null); setReady(false); setRevision((value) => value + 1); }}>Thử lại bản đồ</Button></div> : null}
    {!route.length ? <p className="text-xs text-muted">Thiếu hoặc lỗi hình học tuyến đã lưu: chỉ hiển thị điểm dừng, không tự tính lại đường đi.</p> : null}
    {validStops.length !== stops.length ? <p className="text-xs text-red-700">Một số điểm có tọa độ không hợp lệ, không được hiển thị.</p> : null}
  </div>;
}
