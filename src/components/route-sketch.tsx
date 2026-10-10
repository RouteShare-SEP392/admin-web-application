import type { TripStop } from "@/lib/types";

const WIDTH = 640;
const HEIGHT = 300;
const PADDING = 36;

interface LatLng {
  latitude: number;
  longitude: number;
}

/** Giải mã chuỗi polyline (độ chính xác 5) mà backend lưu trong trips.route_polyline. */
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    latitude += next();
    longitude += next();
    points.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }
  return points;
}

/**
 * Sơ đồ lộ trình không cần khoá bản đồ: chiếu toạ độ các điểm dừng lên một
 * khung SVG. Đây là hình minh hoạ hình dạng tuyến, không phải bản đồ nền.
 */
export function RouteSketch({
  stops,
  polyline,
}: {
  stops: TripStop[];
  polyline: string | null;
}) {
  const decoded = polyline ? decodePolyline(polyline) : [];
  const path: LatLng[] = decoded.length > 1 ? decoded : stops;
  const all = [...path, ...stops];
  if (all.length < 2) return null;

  // Co kinh độ theo vĩ độ trung bình để hình không bị kéo giãn theo chiều ngang.
  const midLatitude =
    all.reduce((sum, point) => sum + point.latitude, 0) / all.length;
  const scaleX = Math.cos((midLatitude * Math.PI) / 180);
  const xs = all.map((point) => point.longitude * scaleX);
  const ys = all.map((point) => point.latitude);
  const minX = Math.min(...xs);
  const maxY = Math.max(...ys);
  const spanX = Math.max(...xs) - minX || 1;
  const spanY = maxY - Math.min(...ys) || 1;
  const scale = Math.min(
    (WIDTH - PADDING * 2) / spanX,
    (HEIGHT - PADDING * 2) / spanY,
  );
  const offsetX = (WIDTH - spanX * scale) / 2;
  const offsetY = (HEIGHT - spanY * scale) / 2;
  const project = (point: LatLng) => ({
    x: offsetX + (point.longitude * scaleX - minX) * scale,
    y: offsetY + (maxY - point.latitude) * scale,
  });

  const line = path
    .map(project)
    .map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Sơ đồ lộ trình qua ${stops.length} điểm dừng`}
      className="w-full rounded-xl bg-brand-50"
    >
      <polyline
        points={line}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-brand-700"
      />
      {stops.map((stop, index) => {
        const { x, y } = project(stop);
        const isDestination = stop.stopType === "DESTINATION";
        return (
          <g key={stop.id}>
            <title>{stop.stopName}</title>
            <circle
              cx={x}
              cy={y}
              r={13}
              strokeWidth={2}
              className={
                isDestination
                  ? "fill-accent stroke-brand-900"
                  : "fill-white stroke-brand-700"
              }
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              fontWeight={700}
              className="fill-brand-900"
            >
              {index + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
