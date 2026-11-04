"use client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useState } from "react";
import {
  TRIP_CHANGE_POLICY,
  UPDATE_TRIP_CHANGE_POLICY,
} from "@/lib/trip-operations.graphql";
import { isExistingApiMocked } from "@/lib/mock-mode";
export function TripChangePolicyCard() {
  const mocked = isExistingApiMocked();
  const { data, loading, error, refetch } = useQuery(TRIP_CHANGE_POLICY, {
    skip: mocked,
    fetchPolicy: "network-only",
  });
  const [save, { loading: saving }] = useMutation(UPDATE_TRIP_CHANGE_POLICY);
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  if (mocked) return null;
  async function submit() {
    const minutes = Number(draft);
    if (
      draft == null ||
      draft.trim() === "" ||
      !Number.isInteger(minutes) ||
      minutes < 0 ||
      minutes > 2147483647
    ) {
      setMessage("Nhập số phút nguyên không âm hợp lệ.");
      return;
    }
    try {
      await save({
        variables: { input: { tripScheduleChangeToleranceMinutes: minutes } },
      });
      await refetch();
      setDraft(null);
      setMessage("Đã lưu chính sách cho các thay đổi tiếp theo.");
    } catch {
      setMessage("Không lưu được cấu hình. Kiểm tra quyền và kết nối.");
    }
  }
  return (
    <section className="bg-white border border-line rounded-2xl p-5 space-y-3">
      <h2 className="font-semibold">Ngưỡng đổi giờ giữ booking</h2>
      <p className="text-sm text-muted">
        So với giờ đăng gốc; vượt ngưỡng phải tạo chuyến thay thế. Cấu hình
        không tự sửa các chuyến đã đăng.
      </p>
      {loading && <p>Đang tải…</p>}
      {error && (
        <button onClick={() => void refetch()} className="text-red-700">
          Không tải được cấu hình. Thử lại
        </button>
      )}
      {data && (
        <div className="flex gap-3 items-center">
          <input
            aria-label="Ngưỡng đổi giờ, phút"
            type="number"
            min={0}
            max={2147483647}
            step={1}
            value={
              draft ??
              String(
                data.adminTripChangePolicy.tripScheduleChangeToleranceMinutes,
              )
            }
            onChange={(e) => setDraft(e.target.value)}
            className="border border-line rounded-lg p-2 w-28"
          />
          <span>phút</span>
          <button
            disabled={saving || draft == null}
            onClick={() => void submit()}
            className="bg-brand-700 text-white rounded-lg px-4 py-2 disabled:opacity-40"
          >
            Lưu
          </button>
        </div>
      )}
      {message && (
        <p className="text-sm" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
