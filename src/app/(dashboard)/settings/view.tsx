"use client";

import { gql, type TypedDocumentNode } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Banknote, CalendarClock, Check, ChevronRight, LocateFixed, Search, SlidersHorizontal } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card, CardHeader, ErrorState, PageHeader, TableSkeleton } from "@/components/ui/misc";
import { SETTINGS_CATALOG, SETTING_KEYS, validateSettings, type SettingsValues } from "@/lib/settings-catalog";
import { formatCurrency } from "@/lib/utils";

// Keep documents explicit so schema checks do not depend on evaluating UI imports.
const fields = gql`fragment AdminSettingsFields on AppSettings {
  platformFeePercent minCostPerKm maxCostPerKm defaultSearchRadiusMeters minDepartureLeadMinutes
  maxWaypointDistanceMeters maxStopWaitMinutes tripScheduleChangeToleranceMinutes activeUploadSeconds
  activeStationarySeconds activeViewerPollSeconds activeGpsMaxAgeSeconds activeGpsFutureSkewSeconds
  activeGpsAccuracyMeters activeProximityMeters activeOffRouteMeters activePassedPickupMeters
}`;
const GET: TypedDocumentNode<{ adminSystemSettings: SettingsValues }> = gql`query AdminTypedSettings { adminSystemSettings { ...AdminSettingsFields } } ${fields}`;
const SAVE: TypedDocumentNode<{ updateSystemSettings: SettingsValues }, { input: Partial<SettingsValues> }> = gql`mutation AdminSaveTypedSettings($input: UpdateSystemSettingsInput!) { updateSystemSettings(input: $input) { ...AdminSettingsFields } } ${fields}`;

export function SettingsView() {
  const query = useQuery(GET, { fetchPolicy: "network-only" });
  return <>
    <PageHeader title="Cấu hình hệ thống" />
    {query.loading && !query.data ? <TableSkeleton /> : query.error ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : query.data ? <SettingsForm key={JSON.stringify(query.data.adminSystemSettings)} current={query.data.adminSystemSettings} refresh={() => query.refetch()} /> : null}
  </>;
}

function SettingsForm({ current, refresh }: { current: SettingsValues; refresh: () => Promise<unknown> }) {
  const [save, { loading }] = useMutation(SAVE);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<Partial<SettingsValues> | null>(null);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState(SETTINGS_CATALOG.platformFeePercent.group);
  const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries(SETTING_KEYS.map((key) => [key, String(current[key])])));
  const saving = useRef(false);
  const [saved, setSaved] = useState(false);
  const changedCount = SETTING_KEYS.filter((key) => draft[key].trim() === "" || Number(draft[key]) !== current[key]).length;
  useEffect(() => {
    if (!changedCount || saved) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    const guardLink = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const destination = new URL(link.getAttribute("href")!, window.location.href);
      if (destination.href === window.location.href || destination.hash && destination.pathname === window.location.pathname) return;
      if (!window.confirm("Bạn có thay đổi chưa lưu. Rời trang?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", guard);
    document.addEventListener("click", guardLink, true);
    return () => { window.removeEventListener("beforeunload", guard); document.removeEventListener("click", guardLink, true); };
  }, [changedCount, saved]);
  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const values = { ...current };
    for (const key of SETTING_KEYS) {
      const raw = draft[key];
      if (typeof raw !== "string" || !raw.trim()) { setMessage("Không để trống cấu hình."); return; }
      values[key] = Number(raw);
    }
    const error = validateSettings(values);
    if (error) { setMessage(error); return; }
    const changes: Partial<SettingsValues> = {};
    for (const key of SETTING_KEYS) if (values[key] !== current[key]) changes[key] = values[key];
    if (!Object.keys(changes).length) { setMessage("Chưa có thay đổi."); return; }
    setPending(changes);
  }
  async function confirm() {
    if (!pending || loading || saving.current || saved) return;
    saving.current = true;
    try {
      const result = await save({ variables: { input: pending } });
      if (!result.data?.updateSystemSettings) { setMessage("Chưa xác nhận được kết quả lưu. Tải lại trước khi thử tiếp."); return; }
      setPending(null);
      setSaved(true);
      setMessage("Đã lưu cấu hình.");
      await refresh().catch(() => setMessage("Đã lưu; chưa tải lại được dữ liệu. Vui lòng làm mới trang."));
    } catch { setMessage("Chưa xác nhận được kết quả lưu. Vui lòng tải lại trước khi thử tiếp."); }
    finally { saving.current = false; }
  }
  const groups = [...new Set(SETTING_KEYS.map((key) => SETTINGS_CATALOG[key].group))];
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
  const visible = SETTING_KEYS.filter((key) => (!groupFilter || SETTINGS_CATALOG[key].group === groupFilter) && normalize(`${SETTINGS_CATALOG[key].label} ${key} ${SETTINGS_CATALOG[key].effect}`).includes(normalize(search.trim())));
  const groupIcons = [Banknote, CalendarClock, LocateFixed];
  return <form onSubmit={preview} noValidate className="rs-settings-layout grid items-start gap-6 pb-24 lg:grid-cols-[224px_minmax(0,1fr)]">
    <aside className="space-y-5 lg:sticky lg:top-24">
      <div className="relative"><Search aria-hidden className="pointer-events-none absolute left-3 top-3 size-4 text-subtle" /><Input aria-label="Tìm tham số" placeholder="Tìm cấu hình…" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <nav aria-label="Nhóm cấu hình" className="flex gap-1 overflow-x-auto lg:flex-col">
        {groups.map((group, index) => { const Icon = groupIcons[index] ?? SlidersHorizontal; const count = SETTING_KEYS.filter((key) => SETTINGS_CATALOG[key].group === group && (draft[key].trim() === "" || Number(draft[key]) !== current[key])).length; return <button key={group} type="button" aria-current={groupFilter === group ? "true" : undefined} onClick={() => setGroupFilter(group)} className={`rs-settings-tab flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${groupFilter === group ? "bg-white font-semibold text-brand-800 shadow-sm ring-1 ring-line" : "text-muted hover:bg-white/70 hover:text-ink"}`}><Icon className="size-4 shrink-0" aria-hidden /><span className="flex-1">{index === 2 ? "Vị trí & GPS" : group}</span>{count ? <span className="size-5 rounded-full bg-brand-50 text-center text-xs leading-5 text-brand-700">{count}</span> : <ChevronRight className="hidden size-3.5 lg:block" aria-hidden />}</button>; })}
      </nav>
      <p className="hidden px-3 text-xs text-subtle lg:block">{SETTING_KEYS.length} tham số hệ thống</p>
    </aside>
    <div className="min-w-0 space-y-4">
    <fieldset disabled={loading || pending !== null || saved} className="space-y-5">
      {groups.filter((group) => visible.some((key) => SETTINGS_CATALOG[key].group === group)).map((group) => <Card key={group} className="rs-settings-panel overflow-hidden"><CardHeader title={group} /><div className="grid gap-x-6 gap-y-7 p-6 md:grid-cols-2">
        {visible.filter((key) => SETTINGS_CATALOG[key].group === group).map((key) => {
          const meta: { label: string; unit: string; min: number; max?: number; step?: string; effect: string } = SETTINGS_CATALOG[key];
          const changed = draft[key].trim() === "" || Number(draft[key]) !== current[key];
          const value = Number(draft[key]);
          const invalid = !draft[key].trim() || !Number.isFinite(value) || value < meta.min || (meta.max !== undefined && value > meta.max) || (!meta.step && !Number.isInteger(value));
          return <Field key={key} htmlFor={key} label={meta.label} error={changed && invalid ? `Nhập ${meta.step ? "số" : "số nguyên"} từ ${meta.min}${meta.max !== undefined ? ` đến ${meta.max}` : " trở lên"}.` : null}><div className="relative"><Input id={key} name={key} type="number" aria-invalid={changed && invalid} className={`pr-16 ${changed ? "border-brand-300 bg-brand-50/30" : ""}`} min={meta.min} max={meta.max} step={meta.step ?? "1"} value={draft[key]} onChange={(event) => { setDraft((previous) => ({ ...previous, [key]: event.target.value })); setMessage(""); }} required /><span className="pointer-events-none absolute right-3 top-3 text-xs text-muted">{meta.unit}</span></div>{changed ? <p className="text-xs text-muted">Hiện tại: {current[key]} {meta.unit}</p> : null}</Field>;
        })}
      </div></Card>)}
      {!visible.length ? <Card className="p-6 text-sm">Không tìm thấy tham số phù hợp.</Card> : null}
    </fieldset>
    {pending ? <ConfirmationDialog title="Xác nhận thay đổi" busy={loading} onClose={() => setPending(null)}>
      <ul className="space-y-2 text-sm">{SETTING_KEYS.map((key) => {
        const next = pending[key];
        if (next === undefined) return null;
        return <li key={key}>{SETTINGS_CATALOG[key].label}: <strong>{SETTINGS_CATALOG[key].unit === "đ/km" ? formatCurrency(current[key]) : current[key]} → {SETTINGS_CATALOG[key].unit === "đ/km" ? formatCurrency(next) : next}</strong> ({SETTINGS_CATALOG[key].unit})</li>;
      })}</ul>
      <p className="text-sm text-muted">Giá và phí của chuyến đã đăng không thay đổi.</p>
      <div className="flex gap-3"><Button type="button" disabled={loading} onClick={() => void confirm()}>{loading ? "Đang lưu…" : "Xác nhận lưu"}</Button><Button type="button" variant="secondary" disabled={loading} onClick={() => setPending(null)}>Quay lại sửa</Button></div>
      {message ? <p role="status" className="text-sm text-red-700">{message}</p> : null}
    </ConfirmationDialog> : null}
    {message && !pending ? <p role="status" className="flex items-center gap-2 rounded-xl border border-line bg-white p-4 text-sm">{saved ? <Check className="size-4 text-brand-700" aria-hidden /> : null}{message}</p> : null}
    {saved ? <Button variant="secondary" onClick={() => void refresh().catch(() => setMessage("Chưa tải lại được dữ liệu. Vui lòng thử lại."))}>Tải lại cấu hình đã lưu</Button> : null}
    </div>
    {changedCount > 0 && !saved ? <div className="rs-save-bar fixed inset-x-4 bottom-5 z-20 mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 p-3 shadow-lg backdrop-blur lg:left-72"><span className="px-2 text-sm font-medium"><span className="mr-2 inline-block size-2 rounded-full bg-amber-500" />{changedCount} thay đổi chưa lưu</span><div className="flex gap-2"><Button type="button" variant="ghost" disabled={loading || pending !== null} onClick={() => { setDraft(Object.fromEntries(SETTING_KEYS.map((key) => [key, String(current[key])]))); setMessage(""); }}>Hủy</Button><Button type="submit" disabled={loading || pending !== null}>Xem lại thay đổi</Button></div></div> : null}
  </form>;
}
