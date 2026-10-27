"use client";
import { TripChangePolicyCard } from "@/components/trip-operations/trip-change-policy-card";
import { RecurringSettings } from "@/components/trip-operations/recurring-settings";

import { useMutation, useQuery } from "@apollo/client/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { SYSTEM_SETTINGS, UPDATE_SYSTEM_SETTING } from "@/lib/graphql";
import type { SystemSetting } from "@/lib/types";
import { errorMessage, formatDateTime } from "@/lib/utils";

/** Tên hiển thị và đơn vị cho các khoá cấu hình đã biết; khoá lạ hiển thị nguyên tên khoá. */
const SETTING_META: Record<string, { label: string; unit: string }> = {
  PLATFORM_FEE_PERCENT: { label: "Phí nền tảng", unit: "%" },
  MIN_COST_PER_KM: { label: "Giá sàn mỗi km", unit: "đ/km/ghế" },
  MAX_COST_PER_KM: { label: "Giá trần mỗi km", unit: "đ/km/ghế" },
  SEARCH_RADIUS_METERS: { label: "Bán kính tìm chuyến", unit: "mét" },
  MIN_DEPARTURE_LEAD_MINUTES: {
    label: "Thời gian chờ tối thiểu trước khởi hành",
    unit: "phút",
  },
  BOOKING_EXPIRY_MINUTES: {
    label: "Thời hạn phản hồi yêu cầu đặt chỗ",
    unit: "phút",
  },
  NO_SHOW_STRIKE_LIMIT: { label: "Giới hạn số lần bỏ chuyến", unit: "lần" },
};

export function SettingsView() {
  const { data, loading, error, refetch } = useQuery(SYSTEM_SETTINGS);
  const settings = data?.adminSystemSettings;

  return (
    <>
      <PageHeader
        title="Cấu hình hệ thống"
        description="Các tham số vận hành áp dụng cho toàn nền tảng. Thay đổi có hiệu lực với chuyến và đặt chỗ tạo sau đó."
      />

      <TripChangePolicyCard />
      <RecurringSettings />
      <Card>
        {!settings && loading ? (
          <TableSkeleton />
        ) : !settings ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : settings.length === 0 ? (
          <EmptyState title="Chưa có cấu hình nào" />
        ) : (
          <ul className="divide-y divide-line">
            {settings.map((setting) => (
              <SettingRow key={setting.id} setting={setting} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function SettingRow({ setting }: { setting: SystemSetting }) {
  const [value, setValue] = useState(setting.settingValue);
  const [rowError, setRowError] = useState<string | null>(null);
  const [update, { loading }] = useMutation(UPDATE_SYSTEM_SETTING);
  const notify = useToast();

  const meta = SETTING_META[setting.settingKey];
  const label = meta?.label ?? setting.settingKey;
  const inputId = `setting-${setting.settingKey}`;
  const changed = value.trim() !== setting.settingValue;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setRowError(null);
    try {
      const result = await update({
        variables: {
          input: { settingKey: setting.settingKey, settingValue: value.trim() },
        },
      });
      setValue(
        result.data?.adminUpdateSystemSetting.settingValue ?? value.trim(),
      );
      notify(`Đã lưu "${label}".`);
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
            {label}
          </label>
          {setting.description ? (
            <p className="mt-0.5 text-sm text-muted">{setting.description}</p>
          ) : null}
          <p className="mt-1 text-xs text-subtle">
            Cập nhật lần cuối {formatDateTime(setting.updatedAt)}
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-32">
              <Input
                id={inputId}
                inputMode="decimal"
                className="text-right tabular-nums"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                aria-invalid={rowError !== null}
              />
            </div>
            <span className="w-20 text-sm text-muted">{meta?.unit ?? ""}</span>
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
