"use client";
import { gql, type TypedDocumentNode } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useState, type FormEvent } from "react";
import { isExistingApiMocked } from "@/lib/mock-mode";

interface Settings {
  recurringPassengerPriorityMinutes: number;
  recurringDriverCheckLocalTime: string;
  recurringDriverReminderLeadMinutes: number;
}
const fields = gql`fragment RecurringSettingsFields on AppSettings {
  recurringPassengerPriorityMinutes recurringDriverCheckLocalTime recurringDriverReminderLeadMinutes
}`;
const GET: TypedDocumentNode<{ adminSystemSettings: Settings }> = gql`
  query RecurringSettings { adminSystemSettings { ...RecurringSettingsFields } } ${fields}
`;
const SAVE: TypedDocumentNode<{ updateSystemSettings: Settings }, { input: Partial<Settings> }> = gql`
  mutation SaveRecurringSettings($input: UpdateSystemSettingsInput!) {
    updateSystemSettings(input: $input) { ...RecurringSettingsFields }
  } ${fields}
`;
export function RecurringSettings() {
  const mocked = isExistingApiMocked();
  const query = useQuery(GET, { skip: mocked, fetchPolicy: "network-only" });
  const [save, { loading }] = useMutation(SAVE);
  const [message, setMessage] = useState("");
  const current = query.data?.adminSystemSettings;
  if (mocked) return null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!current) return;
    const values = new FormData(event.currentTarget);
    const priority = Number(values.get("priority"));
    const check = String(values.get("check"));
    const lead = Number(values.get("lead"));
    const input: Partial<Settings> = {};
    if (priority !== current.recurringPassengerPriorityMinutes) input.recurringPassengerPriorityMinutes = priority;
    if (check !== current.recurringDriverCheckLocalTime) input.recurringDriverCheckLocalTime = check;
    if (lead !== current.recurringDriverReminderLeadMinutes) input.recurringDriverReminderLeadMinutes = lead;
    if (Object.keys(input).length === 0) {
      setMessage("Chưa có thay đổi.");
      return;
    }
    try {
      const result = await save({ variables: { input } });
      setMessage(result.data?.updateSystemSettings ? "Đã lưu cài đặt định kỳ." : "Chưa xác định được kết quả lưu.");
      await query.refetch().catch(() => {});
    } catch {
      setMessage("Không lưu được cấu hình. Kiểm tra quyền và kết nối.");
    }
  }
  return <section className="bg-white border border-line rounded-2xl p-5 space-y-3">
    <h2 className="font-semibold">Chuyến định kỳ</h2>
    {query.loading && <p>Đang tải…</p>}
    {query.error && <button onClick={() => void query.refetch().catch(() => {})}>Không tải được cấu hình. Thử lại</button>}
    {current && <form onSubmit={submit} className="flex flex-wrap gap-4 items-end">
      <label className="grid gap-1">Ưu tiên khách (phút)<input name="priority" type="number" min={1} max={2147483647} required defaultValue={current.recurringPassengerPriorityMinutes} className="border rounded-lg p-2" /></label>
      <label className="grid gap-1">Giờ kiểm tra hằng ngày (Việt Nam)<input name="check" type="time" required defaultValue={current.recurringDriverCheckLocalTime} className="border rounded-lg p-2" /></label>
      <label className="grid gap-1">Nhắc trước khi hết lịch (phút)<input name="lead" type="number" min={1} max={10080} required defaultValue={current.recurringDriverReminderLeadMinutes} className="border rounded-lg p-2" /></label>
      <button disabled={loading} className="bg-brand-700 text-white rounded-lg px-4 py-2">Lưu</button>
    </form>}
    {message && <p role="status">{message}</p>}
  </section>;
}
