"use client";
import { TripChangePolicyCard } from "@/components/trip-operations/trip-change-policy-card";
import { RecurringSettings } from "@/components/trip-operations/recurring-settings";

import { useMutation, useQuery } from "@apollo/client/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import {
  Card,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { SYSTEM_SETTINGS, UPDATE_SYSTEM_SETTINGS } from "@/lib/graphql";
import type { AppSettings, NumericSettingKey } from "@/lib/types";
import { errorMessage } from "@/lib/utils";

interface SettingMeta {
  key: NumericSettingKey;
  label: string;
  description: string;
  unit: string;
  /** Giới hạn giống settings.registry.ts của backend; backend vẫn kiểm tra lại. */
  min: number;
  max: number;
  integer: boolean;
  step?: number;
}

/**
 * Các tham số chỉnh trên trang này. Ngưỡng đổi lịch chuyến và cài đặt chuyến
 * định kỳ có thẻ riêng (TripChangePolicyCard, RecurringSettings).
 */
const SECTIONS: { title: string; settings: SettingMeta[] }[] = [
  {
    title: "Giá và phí",
    settings: [
      {
        key: "platformFeePercent",
        label: "Phí nền tảng",
        description: "Tính trên giá gốc, trừ vào phần của tài xế.",
        unit: "%",
        min: 0,
        max: 100,
        integer: false,
      },
      {
        key: "minCostPerKm",
        label: "Giá sàn mỗi km",
        description: "Mức chia sẻ chi phí thấp nhất cho mỗi km, mỗi ghế.",
        unit: "đ/km/ghế",
        min: 0.01,
        max: Number.MAX_SAFE_INTEGER,
        integer: false,
      },
      {
        key: "maxCostPerKm",
        label: "Giá trần mỗi km",
        description: "Mức phi thương mại cao nhất cho mỗi km, mỗi ghế.",
        unit: "đ/km/ghế",
        min: 0.01,
        max: Number.MAX_SAFE_INTEGER,
        integer: false,
      },
      {
        key: "repeatPassengerDiscountMaxPercent",
        label: "Giảm giá tối đa cho khách quen",
        description: "Bội số của 5.",
        unit: "%",
        min: 5,
        max: 100,
        integer: true,
        step: 5,
      },
    ],
  },
  {
    title: "Tạo và tìm chuyến",
    settings: [
      {
        key: "defaultSearchRadiusMeters",
        label: "Bán kính tìm chuyến mặc định",
        description: "Phạm vi tìm điểm đón, điểm trả quanh vị trí hành khách.",
        unit: "mét",
        min: 500,
        max: 5000,
        integer: true,
      },
      {
        key: "minDepartureLeadMinutes",
        label: "Thời gian tối thiểu trước khởi hành",
        description:
          "Chuyến phải khởi hành sau thời điểm đăng ít nhất chừng này phút.",
        unit: "phút",
        min: 1,
        max: 1440,
        integer: true,
      },
      {
        key: "tripEditCutoffMinutes",
        label: "Hạn chót sửa chuyến",
        description:
          "Tài xế không sửa được chuyến khi còn ít hơn chừng này phút trước giờ chạy.",
        unit: "phút",
        min: 0,
        max: 2147483647,
        integer: true,
      },
      {
        key: "maxWaypointDistanceMeters",
        label: "Khoảng cách tối đa tới điểm dừng",
        description:
          "Điểm đón, điểm trả không được lệch khỏi lộ trình quá khoảng này.",
        unit: "mét",
        min: 100,
        max: 5000,
        integer: true,
      },
      {
        key: "maxStopWaitMinutes",
        label: "Thời gian chờ tối đa tại điểm dừng",
        description: "Thời gian tài xế chờ khách tại mỗi điểm dừng.",
        unit: "phút",
        min: 1,
        max: 1440,
        integer: true,
      },
    ],
  },
  {
    title: "Theo dõi chuyến đang chạy",
    settings: [
      {
        key: "activeUploadSeconds",
        label: "Chu kỳ gửi vị trí khi di chuyển",
        description: "Ứng dụng tài xế gửi GPS mỗi chừng này giây.",
        unit: "giây",
        min: 5,
        max: 60,
        integer: true,
      },
      {
        key: "activeStationarySeconds",
        label: "Chu kỳ gửi vị trí khi đứng yên",
        description: "Tần suất gửi GPS khi xe không di chuyển.",
        unit: "giây",
        min: 5,
        max: 60,
        integer: true,
      },
      {
        key: "activeViewerPollSeconds",
        label: "Chu kỳ cập nhật cho hành khách",
        description:
          "Màn hình theo dõi của hành khách làm mới mỗi chừng này giây.",
        unit: "giây",
        min: 5,
        max: 60,
        integer: true,
      },
      {
        key: "activeGpsMaxAgeSeconds",
        label: "Tuổi tối đa của điểm GPS",
        description: "Điểm GPS cũ hơn bị bỏ qua.",
        unit: "giây",
        min: 10,
        max: 120,
        integer: true,
      },
      {
        key: "activeGpsFutureSkewSeconds",
        label: "Độ lệch giờ tương lai cho phép",
        description:
          "Chấp nhận điểm GPS có thời gian sớm hơn giờ server tối đa chừng này.",
        unit: "giây",
        min: 1,
        max: 10,
        integer: true,
      },
      {
        key: "activeGpsAccuracyMeters",
        label: "Sai số GPS tối đa",
        description: "Điểm GPS có sai số lớn hơn bị bỏ qua.",
        unit: "mét",
        min: 5,
        max: 100,
        integer: true,
      },
      {
        key: "activeProximityMeters",
        label: "Bán kính coi là đã đến điểm",
        description:
          "Xe trong bán kính này được coi là đã tới điểm đón hoặc trả.",
        unit: "mét",
        min: 50,
        max: 500,
        integer: true,
      },
      {
        key: "activeOffRouteMeters",
        label: "Ngưỡng lệch tuyến",
        description:
          "Xe cách lộ trình xa hơn khoảng này bị đánh dấu lệch tuyến.",
        unit: "mét",
        min: 50,
        max: 500,
        integer: true,
      },
      {
        key: "activePassedPickupMeters",
        label: "Ngưỡng đã vượt điểm đón",
        description: "Xe đi quá điểm đón khoảng này được coi là đã vượt qua.",
        unit: "mét",
        min: 50,
        max: 500,
        integer: true,
      },
    ],
  },
];

export function SettingsView() {
  const { data, loading, error, refetch } = useQuery(SYSTEM_SETTINGS, {
    fetchPolicy: "network-only",
  });
  const settings = data?.adminSystemSettings;

  return (
    <>
      <PageHeader
        title="Cấu hình hệ thống"
        description="Các tham số vận hành áp dụng cho toàn nền tảng. Thay đổi có hiệu lực với chuyến và đặt chỗ tạo sau đó."
      />

      <div className="space-y-6">
        <TripChangePolicyCard />
        <RecurringSettings />
        {!settings && loading ? (
          <Card>
            <TableSkeleton />
          </Card>
        ) : !settings ? (
          <Card>
            <ErrorState error={error} onRetry={() => refetch()} />
          </Card>
        ) : (
          SECTIONS.map((section) => (
            <Card key={section.title}>
              <h2 className="border-b border-line px-5 py-3 font-semibold">
                {section.title}
              </h2>
              <ul className="divide-y divide-line">
                {section.settings.map((meta) => (
                  <SettingRow
                    // Gắn giá trị vào key để ô nhập lấy lại giá trị mới sau khi lưu.
                    key={`${meta.key}:${settings[meta.key]}`}
                    meta={meta}
                    settings={settings}
                    onSaved={() => refetch()}
                  />
                ))}
              </ul>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

function SettingRow({
  meta,
  settings,
  onSaved,
}: {
  meta: SettingMeta;
  settings: AppSettings;
  onSaved: () => unknown;
}) {
  const current = settings[meta.key];
  const [value, setValue] = useState(String(current));
  const [rowError, setRowError] = useState<string | null>(null);
  const [update, { loading }] = useMutation(UPDATE_SYSTEM_SETTINGS);
  const notify = useToast();

  const inputId = `setting-${meta.key}`;
  const changed = value.trim() !== String(current);

  function validate(raw: string): number | string {
    const number = Number(raw);
    if (raw === "" || !Number.isFinite(number)) return "Nhập một số hợp lệ.";
    if (meta.integer && !Number.isInteger(number)) return "Nhập số nguyên.";
    if (number < meta.min || number > meta.max) {
      return meta.max >= Number.MAX_SAFE_INTEGER
        ? `Giá trị phải lớn hơn 0.`
        : `Giá trị phải từ ${meta.min} đến ${meta.max}.`;
    }
    if (meta.step && number % meta.step !== 0) {
      return `Giá trị phải là bội số của ${meta.step}.`;
    }
    if (meta.key === "minCostPerKm" && number > settings.maxCostPerKm) {
      return "Giá sàn không được lớn hơn giá trần.";
    }
    if (meta.key === "maxCostPerKm" && number < settings.minCostPerKm) {
      return "Giá trần không được nhỏ hơn giá sàn.";
    }
    return number;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validate(value.trim());
    if (typeof result === "string") {
      setRowError(result);
      return;
    }
    setRowError(null);
    try {
      await update({ variables: { input: { [meta.key]: result } } });
      notify(`Đã lưu "${meta.label}".`);
      await onSaved();
    } catch (cause) {
      setRowError(errorMessage(cause));
    }
  }

  return (
    <li>
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 px-5 py-4"
      >
        <div className="min-w-60 flex-1">
          <label htmlFor={inputId} className="font-medium">
            {meta.label}
          </label>
          <p className="mt-0.5 text-sm text-muted">{meta.description}</p>
        </div>

        <div className="w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-32">
              <Input
                id={inputId}
                inputMode={meta.integer ? "numeric" : "decimal"}
                className="text-right tabular-nums"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                aria-invalid={rowError !== null}
              />
            </div>
            <span className="w-20 text-sm text-muted">{meta.unit}</span>
            <Button type="submit" size="md" disabled={!changed || loading}>
              {loading ? "Đang lưu…" : "Lưu"}
            </Button>
          </div>
          {rowError ? (
            <p className="mt-1.5 text-sm text-red-600" role="alert">
              {rowError}
            </p>
          ) : null}
        </div>
      </form>
    </li>
  );
}
