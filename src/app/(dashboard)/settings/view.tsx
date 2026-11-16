"use client";

import { gql, type TypedDocumentNode } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card, ErrorState, PageHeader, TableSkeleton } from "@/components/ui/misc";
import { isExistingApiMocked } from "@/lib/mock-mode";

const META = {
  platformFeePercent: ["Phí nền tảng", "%"],
  minCostPerKm: ["Mức chia sẻ tối thiểu mỗi km", "đ/km"],
  maxCostPerKm: ["Mức chia sẻ tối đa mỗi km", "đ/km"],
  defaultSearchRadiusMeters: ["Bán kính tìm mặc định", "m"],
  minDepartureLeadMinutes: ["Thời gian tối thiểu trước khởi hành", "phút"],
  maxWaypointDistanceMeters: ["Khoảng cách điểm nghỉ tối đa", "m"],
  maxStopWaitMinutes: ["Thời gian nghỉ tối đa", "phút"],
  tripScheduleChangeToleranceMinutes: ["Ngưỡng thay đổi giờ khởi hành", "phút"],
  activeUploadSeconds: ["Chu kỳ gửi vị trí", "giây"],
  activeStationarySeconds: ["Chu kỳ khi đứng yên", "giây"],
  activeViewerPollSeconds: ["Chu kỳ tải vị trí", "giây"],
  activeGpsMaxAgeSeconds: ["Tuổi vị trí tối đa", "giây"],
  activeGpsFutureSkewSeconds: ["Độ lệch thời gian GPS", "giây"],
  activeGpsAccuracyMeters: ["Sai số GPS cho phép", "m"],
  activeProximityMeters: ["Khoảng cách xác nhận đến điểm", "m"],
  activeOffRouteMeters: ["Ngưỡng lệch tuyến", "m"],
  activePassedPickupMeters: ["Ngưỡng qua điểm đón", "m"],
} as const;
type Key = keyof typeof META;
type Settings = Record<Key, number>;
const FIELDS = Object.keys(META).join(" ");
const GET: TypedDocumentNode<{ adminSystemSettings: Settings }> = gql`query AdminTypedSettings { adminSystemSettings { ${FIELDS} } }`;
const SAVE: TypedDocumentNode<{ updateSystemSettings: Settings }, { input: Partial<Settings> }> = gql`mutation AdminSaveTypedSettings($input: UpdateSystemSettingsInput!) { updateSystemSettings(input: $input) { ${FIELDS} } }`;

export function SettingsView() {
  const mocked = isExistingApiMocked();
  const query = useQuery(GET, { skip: mocked, fetchPolicy: "network-only" });
  return <>
    <PageHeader title="Cấu hình hệ thống" description="Dùng hợp đồng typed của Backend; chỉ gửi các trường thay đổi, không sửa key tùy ý hoặc ghi đè giá/lịch đã lưu." />
    {mocked ? <Card className="p-5">Cấu hình thật không khả dụng trong chế độ đăng nhập mẫu. Chuyển sang missing/off và đăng nhập ADMIN thật.</Card> : query.loading && !query.data ? <TableSkeleton /> : query.error ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : query.data ? <SettingsForm key={JSON.stringify(query.data.adminSystemSettings)} current={query.data.adminSystemSettings} refresh={() => query.refetch()} /> : null}
  </>;
}

function SettingsForm({ current, refresh }: { current: Settings; refresh: () => Promise<unknown> }) {
  const [save, { loading }] = useMutation(SAVE);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const input: Partial<Settings> = {};
    for (const key of Object.keys(META) as Key[]) {
      const value = Number(values.get(key));
      if (!Number.isFinite(value)) { setMessage("Giá trị cấu hình không hợp lệ."); return; }
      if (value !== current[key]) input[key] = value;
    }
    if (!Object.keys(input).length) { setMessage("Chưa có thay đổi."); return; }
    try {
      const result = await save({ variables: { input } });
      if (!result.data?.updateSystemSettings) { setMessage("Chưa xác nhận được kết quả lưu."); return; }
      setMessage("Backend đã xác nhận lưu cấu hình.");
      await refresh().catch(() => setMessage("Đã lưu; chưa tải lại được dữ liệu. Vui lòng làm mới trang."));
    } catch { setMessage("Không lưu được cấu hình. Kiểm tra giá trị, quyền ADMIN và kết nối."); }
  }
  return <Card className="p-5"><form onSubmit={submit} className="space-y-5">
    <div className="grid gap-5 md:grid-cols-2">{(Object.keys(META) as Key[]).map((key) => <Field key={key} htmlFor={key} label={`${META[key][0]} (${META[key][1]})`}><Input id={key} name={key} type="number" step={key === "platformFeePercent" || key === "minCostPerKm" || key === "maxCostPerKm" ? "any" : "1"} defaultValue={current[key]} required /></Field>)}</div>
    <p className="text-sm text-muted">Backend kiểm tra khoảng giá trị và ràng buộc giữa các trường. Cấu hình khách định kỳ mới trên mobile cần Backend mới tương ứng; không gửi các trường chưa có trong schema hiện tại.</p>
    {message ? <p role="status">{message}</p> : null}
    <Button type="submit" disabled={loading}>{loading ? "Đang lưu…" : "Lưu cấu hình"}</Button>
  </form></Card>;
}
