import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { TRIP_STATUS } from "@/lib/labels";
import { MOCK_MODE, MOCK_TOKEN_PREFIX, SESSION_COOKIE } from "@/server/config";
import { recordAudit } from "@/server/mock/audit";
import { vnDateKey } from "@/server/mock/overview";
import { selectTrips, type TripFilter } from "@/server/mock/resolvers";

const HEADERS = [
  "Mã chuyến",
  "Tài xế",
  "Biển số",
  "Điểm đi",
  "Điểm đến",
  "Khởi hành",
  "Trạng thái",
  "Ghế đã đặt",
  "Ghế chia sẻ",
  "Tỷ lệ ghép (%)",
  "Giá mỗi km (đ)",
  "Chia sẻ chi phí (đ)",
];

const FILTERS: Record<string, TripFilter> = {
  all: {},
  lowMatch: { lowMatchOnly: true },
  hasViolation: { hasViolation: true },
  today: { todayOnly: true },
};

const FILTER_LABELS: Record<string, string> = {
  all: "tất cả",
  lowMatch: "ghép dưới 70%",
  hasViolation: "có vi phạm",
  today: "hôm nay",
};

function fail(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

/** "Nguyễn Văn An" -> "Nguyễn V. A." để file xuất không lộ đầy đủ họ tên. */
function maskName(fullName: string): string {
  const [family, ...rest] = fullName.trim().split(/\s+/);
  return [family, ...rest.map((part) => `${part[0]}.`)].join(" ");
}

/** "51H-123.45" -> "51H-***.45": giữ mã tỉnh và hai số cuối. */
function maskPlate(plate: string): string {
  const [prefix, number = ""] = plate.split("-");
  return `${prefix}-${"*".repeat(Math.max(number.length - 3, 1))}${number.slice(-3)}`;
}

function csvCell(value: string | number | null): string {
  let text = value === null ? "" : String(value);
  // Chặn công thức khi mở bằng Excel hoặc Google Sheets.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function formatDeparture(isoTime: string): string {
  const local = new Date(Date.parse(isoTime) + 7 * 3_600_000).toISOString();
  return `${local.slice(0, 10)} ${local.slice(11, 16)}`;
}

/**
 * Xuất CSV danh sách chuyến theo đúng kỳ và bộ lọc đang chọn ở trang tổng quan.
 * File không chứa số điện thoại, email hay địa chỉ; họ tên và biển số được che.
 */
export async function GET(request: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return fail("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401);
  if (MOCK_MODE === "off") {
    return fail("Backend chưa hỗ trợ xuất CSV cho danh sách chuyến.", 501);
  }

  const params = new URL(request.url).searchParams;
  const rangeDays = Number(params.get("rangeDays"));
  const filterKey = params.get("filter") ?? "all";
  if (![7, 14, 30].includes(rangeDays) || !(filterKey in FILTERS)) {
    return fail("Tham số xuất dữ liệu không hợp lệ.", 400);
  }

  const trips = selectTrips({ ...FILTERS[filterKey], departedWithinDays: rangeDays });
  const rows = trips.map((trip) => {
    const stops = [...trip.stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    return [
      trip.tripCode,
      trip.driver ? maskName(trip.driver.fullName) : null,
      trip.vehicle ? maskPlate(trip.vehicle.plateNumber) : null,
      stops[0]?.stopName ?? null,
      stops[stops.length - 1]?.stopName ?? null,
      formatDeparture(trip.departureTime),
      TRIP_STATUS[trip.status].label,
      trip.bookedSeats,
      trip.totalSeatsOffered,
      trip.averageMatchPercent,
      trip.pricing?.baseCostPerKm ?? null,
      trip.sharedCostTotal,
    ];
  });

  const adminId = token.startsWith(MOCK_TOKEN_PREFIX)
    ? token.slice(MOCK_TOKEN_PREFIX.length)
    : "backend-admin";
  const entry = recordAudit(
    adminId,
    "DATA_EXPORTED",
    { type: "EXPORT", id: null, label: "Danh sách chuyến đi (CSV)" },
    `Kỳ ${rangeDays} ngày · bộ lọc: ${FILTER_LABELS[filterKey]} · ${rows.length} dòng`,
  );
  console.info("[audit] Xuất CSV chuyến đi", { adminId, detail: entry.detail });

  // BOM để Excel nhận đúng tiếng Việt có dấu.
  const csv =
    "﻿" + [HEADERS, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const fileName = `routeshare-chuyen-di-${rangeDays}-ngay-${vnDateKey(Date.now())}.csv`;

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fileName}"`,
      "x-row-count": String(rows.length),
      "cache-control": "no-store",
    },
  });
}
