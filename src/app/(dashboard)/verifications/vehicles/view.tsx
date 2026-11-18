"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { ArrowRight, Car, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { PersonCell } from "@/components/person-cell";
import { VerificationDocumentViewer } from "@/components/verification-document-viewer";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import {
  EmptyState,
  ErrorState,
  Fact,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { VerificationReviewDialog } from "@/components/verification-review-dialog";
import {
  PENDING_COUNTS,
  PENDING_VEHICLE_VERIFICATIONS,
  REVIEW_VEHICLE_VERIFICATION,
} from "@/lib/graphql";
import { VEHICLE_TYPE, VERIFICATION_STATUS } from "@/lib/labels";
import { isExistingApiMocked } from "@/lib/mock-mode";
import type { VerificationStatus } from "@/lib/types";
import { errorMessage, formatDateTime } from "@/lib/utils";

export function VehicleVerificationsView() {
  const { data, loading, error, refetch } = useQuery(PENDING_VEHICLE_VERIFICATIONS);
  const [review, { loading: reviewing }] = useMutation(REVIEW_VEHICLE_VERIFICATION, {
    refetchQueries: [PENDING_VEHICLE_VERIFICATIONS, PENDING_COUNTS],
    awaitRefetchQueries: true,
  });
  const notify = useToast();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const all = data?.adminPendingVehicleVerifications ?? [];
  const keyword = search.trim().toLowerCase();
  const rows = all.filter((doc) => {
    if (!keyword) return true;
    const { vehicle } = doc;
    return [
      vehicle.plateNumber,
      vehicle.make,
      vehicle.model,
      vehicle.driverProfile.user.fullName,
      doc.documentNumber,
    ].some((value) => value.toLowerCase().includes(keyword));
  });
  const selected = all.find((doc) => doc.id === selectedId) ?? null;
  const active = rows.find((doc) => doc.id === activeId) ?? rows[0] ?? null;

  function closeDialog() {
    setSelectedId(null);
    setReviewError(null);
  }

  async function submit(status: VerificationStatus, rejectionReason?: string) {
    if (!selected) return;
    setReviewError(null);
    try {
      await review({
        variables: { input: { verificationId: selected.id, status, rejectionReason } },
      });
      notify(
        status === "APPROVED"
          ? `Đã phê duyệt xe ${selected.vehicle.plateNumber}.`
          : `Đã từ chối giấy tờ xe ${selected.vehicle.plateNumber}.`,
      );
      closeDialog();
    } catch (cause) {
      setReviewError(errorMessage(cause));
    }
  }

  return (
    <>
      <PageHeader
        title="Xét duyệt phương tiện"
        action={<Button variant="secondary" disabled={loading || reviewing} onClick={() => void refetch()}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />Làm mới</Button>}
        mocked={isExistingApiMocked()}
      />

      <div className="mb-5 flex items-center gap-3 text-sm"><Car className="size-5 text-brand-700" aria-hidden /><span className="font-medium">Bàn đối chiếu phương tiện</span><span className="text-muted">{data ? `${all.length} giấy đăng ký chờ duyệt` : "Đang tải hàng chờ"}</span></div>
      <div className="grid overflow-hidden rounded-2xl border border-line bg-white xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-line bg-gray-50/60 xl:border-r xl:border-b-0">
        <div className="border-b border-line p-4">
          <div className="relative max-w-md">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Tìm giấy tờ xe"
              placeholder="Tìm theo biển số, hãng xe, chủ xe"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {loading && !data ? (
          <TableSkeleton />
        ) : error && !data ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? "Không còn xe nào chờ duyệt" : "Không có xe phù hợp"}
            description={
              all.length === 0
                ? "Giấy tờ mới sẽ xuất hiện ở đây khi tài xế đăng ký xe."
                : "Thử đổi từ khoá tìm kiếm."
            }
          />
        ) : (
          <div className="max-h-72 overflow-y-auto p-2 xl:max-h-[65dvh]" aria-label="Phương tiện chờ xét duyệt">{rows.map((doc) => <button key={doc.id} type="button" disabled={reviewing} aria-pressed={active?.id === doc.id} onClick={() => setActiveId(doc.id)} className={`rs-review-queue-item mb-1 block w-full rounded-xl border p-3 text-left ${active?.id === doc.id ? "border-brand-200 bg-white shadow-sm" : "border-transparent hover:bg-white"}`}><span className="block text-sm font-semibold tracking-wide">{doc.vehicle.plateNumber}</span><span className="mt-1 block text-xs text-muted">{doc.vehicle.make} {doc.vehicle.model}</span><span className="mt-2 block truncate text-xs text-muted">{doc.vehicle.driverProfile.user.fullName}</span><span className="mt-2 block text-[11px] text-subtle">{formatDateTime(doc.createdAt)}</span></button>)}</div>
        )}
        </aside>
        {active ? <section key={active.id} className="rs-review-detail min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-5"><div><p className="mb-1 text-[10px] font-semibold tracking-widest text-muted uppercase">{VEHICLE_TYPE[active.vehicle.vehicleType]}</p><h2 className="text-lg font-semibold">{active.vehicle.make} {active.vehicle.model}</h2></div><span className="rounded-lg border-2 border-gray-300 bg-gray-50 px-4 py-2 font-mono text-lg font-semibold tracking-widest">{active.vehicle.plateNumber}</span></div>
          <div className="grid lg:grid-cols-[minmax(0,1fr)_220px]">
            <VerificationDocumentViewer front={active.frontPhotoUrl ?? null} back={active.backPhotoUrl ?? null} />
            <div className="min-w-0 space-y-6 border-t border-line p-5 break-words lg:border-t-0 lg:border-l"><section><h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Phương tiện</h3><dl className="divide-y divide-line text-sm"><Fact label="Màu xe">{active.vehicle.color}</Fact><Fact label="Số chỗ">{active.vehicle.seatCapacity}</Fact><Fact label="Năm sản xuất">{active.vehicle.year ?? "—"}</Fact><Fact label="Số đăng ký">{active.documentNumber}</Fact></dl></section><section><h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Chủ xe</h3><PersonCell person={active.vehicle.driverProfile.user} /><div className="mt-3"><StatusBadge meta={VERIFICATION_STATUS[active.vehicle.driverProfile.verificationStatus]} /></div></section></div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4"><span className="text-xs text-muted">Nộp lúc {formatDateTime(active.createdAt)}</span><Button disabled={reviewing || loading || !!error} onClick={() => { setSelectedId(active.id); setReviewError(null); }}>Xem xét quyết định<ArrowRight className="size-4" aria-hidden /></Button></div>
        </section> : <div className="flex min-h-96 items-center justify-center"><EmptyState title={loading ? "Đang tải hồ sơ" : error ? "Chưa tải được hồ sơ" : "Không có phương tiện để xem"} /></div>}
      </div>
      {error && data ? <ErrorState error={error} onRetry={() => refetch()} /> : null}

      <VerificationReviewDialog
        key={selected?.id}
        open={selected !== null}
        onClose={closeDialog}
        title="Giấy đăng ký xe"
        description={
          selected
            ? `${selected.vehicle.make} ${selected.vehicle.model} · ${selected.vehicle.plateNumber}`
            : undefined
        }
        photos={[
          { label: "Mặt trước", url: selected?.frontPhotoUrl ?? null },
          { label: "Mặt sau", url: selected?.backPhotoUrl ?? null },
        ]}
        busy={reviewing}
        error={reviewError}
        onApprove={() => submit("APPROVED")}
        onReject={(reason) => submit("REJECTED", reason)}
      >
        {selected ? (
          <>
            <section>
              <h3 className="mb-1 text-sm font-semibold">Phương tiện đã khai báo</h3>
              <dl className="divide-y divide-line">
                <Fact label="Biển số">{selected.vehicle.plateNumber}</Fact>
                <Fact label="Hãng và dòng xe">
                  {selected.vehicle.make} {selected.vehicle.model}
                </Fact>
                <Fact label="Loại xe">{VEHICLE_TYPE[selected.vehicle.vehicleType]}</Fact>
                <Fact label="Số chỗ">{selected.vehicle.seatCapacity}</Fact>
                <Fact label="Màu">{selected.vehicle.color}</Fact>
                <Fact label="Năm sản xuất">{selected.vehicle.year ?? "—"}</Fact>
                <Fact label="Số giấy đăng ký">{selected.documentNumber}</Fact>
              </dl>
            </section>
            <section>
              <h3 className="mb-1 text-sm font-semibold">Chủ xe</h3>
              <dl className="divide-y divide-line">
                <Fact label="Họ tên">{selected.vehicle.driverProfile.user.fullName}</Fact>
                <Fact label="Liên hệ">
                  {selected.vehicle.driverProfile.user.phone ??
                    selected.vehicle.driverProfile.user.email ??
                    "—"}
                </Fact>
                <Fact label="Hồ sơ tài xế">
                  <StatusBadge
                    meta={VERIFICATION_STATUS[selected.vehicle.driverProfile.verificationStatus]}
                  />
                </Fact>
              </dl>
            </section>
          </>
        ) : null}
      </VerificationReviewDialog>
    </>
  );
}
