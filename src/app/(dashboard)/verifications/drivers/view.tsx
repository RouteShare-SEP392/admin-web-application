"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { ArrowRight, Clock3, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { PersonCell } from "@/components/person-cell";
import { VerificationDocumentViewer } from "@/components/verification-document-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
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
  PENDING_DRIVER_VERIFICATIONS,
  REVIEW_DRIVER_VERIFICATION,
} from "@/lib/graphql";
import { DRIVER_DOCUMENT_TYPE } from "@/lib/labels";
import { isExistingApiMocked } from "@/lib/mock-mode";
import type { DriverVerificationType, VerificationStatus } from "@/lib/types";
import { errorMessage, formatDate, formatDateTime } from "@/lib/utils";

export function DriverVerificationsView() {
  const { data, loading, error, refetch } = useQuery(PENDING_DRIVER_VERIFICATIONS);
  const [review, { loading: reviewing }] = useMutation(REVIEW_DRIVER_VERIFICATION, {
    refetchQueries: [PENDING_DRIVER_VERIFICATIONS, PENDING_COUNTS],
    awaitRefetchQueries: true,
  });
  const notify = useToast();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<DriverVerificationType | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const all = data?.adminPendingDriverVerifications ?? [];
  const keyword = search.trim().toLowerCase();
  const rows = all.filter((doc) => {
    if (type && doc.type !== type) return false;
    if (!keyword) return true;
    const user = doc.driverProfile.user;
    return [user.fullName, user.email, user.phone, doc.documentNumber].some((value) =>
      value?.toLowerCase().includes(keyword),
    );
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
          ? `Đã phê duyệt ${DRIVER_DOCUMENT_TYPE[selected.type].toLowerCase()} của ${selected.driverProfile.user.fullName}.`
          : `Đã từ chối hồ sơ của ${selected.driverProfile.user.fullName}.`,
      );
      closeDialog();
    } catch (cause) {
      setReviewError(errorMessage(cause));
    }
  }

  return (
    <>
      <PageHeader
        title="Xét duyệt tài xế"
        action={<Button variant="secondary" disabled={loading || reviewing} onClick={() => void refetch()}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />Làm mới</Button>}
        mocked={isExistingApiMocked()}
      />

      <div className="mb-5 flex flex-wrap items-center gap-4 text-sm"><span className="flex items-center gap-2 font-medium"><ShieldCheck className="size-5 text-brand-700" aria-hidden />Bàn xét duyệt</span><span className="text-muted">{data ? `${all.length} giấy tờ chờ duyệt` : "Đang tải hàng chờ"}</span><span className="ml-auto hidden items-center gap-1.5 text-xs text-muted sm:flex"><Clock3 className="size-3.5" aria-hidden />Hồ sơ nộp trước xếp trên</span></div>
      <div className="grid overflow-hidden rounded-2xl border border-line bg-white xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-line bg-gray-50/60 xl:border-r xl:border-b-0">
        <div className="flex flex-col gap-3 border-b border-line p-4">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Tìm hồ sơ"
              placeholder="Tìm người hoặc giấy tờ…"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            aria-label="Loại giấy tờ"
            value={type}
            onChange={(event) => setType(event.target.value as DriverVerificationType | "")}
          >
            <option value="">Tất cả giấy tờ</option>
            <option value="IDENTITY_CARD">{DRIVER_DOCUMENT_TYPE.IDENTITY_CARD}</option>
            <option value="DRIVER_LICENSE">{DRIVER_DOCUMENT_TYPE.DRIVER_LICENSE}</option>
          </Select>
        </div>

        {loading && !data ? (
          <TableSkeleton />
        ) : error && !data ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? "Không còn hồ sơ nào chờ duyệt" : "Không có hồ sơ phù hợp"}
            description={
              all.length === 0
                ? "Hồ sơ mới sẽ xuất hiện ở đây khi tài xế nộp giấy tờ."
                : "Thử đổi từ khoá hoặc bộ lọc."
            }
          />
        ) : (
          <div className="max-h-72 overflow-y-auto p-2 xl:max-h-[65dvh]" aria-label="Hàng chờ xét duyệt">
            {rows.map((doc) => <button key={doc.id} type="button" aria-pressed={active?.id === doc.id} disabled={reviewing} onClick={() => setActiveId(doc.id)} className={`rs-review-queue-item mb-1 block w-full rounded-xl border p-3 text-left ${active?.id === doc.id ? "border-brand-200 bg-white shadow-sm" : "border-transparent hover:bg-white"}`}><span className="mb-2 block truncate text-sm font-semibold">{doc.driverProfile.user.fullName}</span><span className="block text-xs text-muted">{DRIVER_DOCUMENT_TYPE[doc.type]}</span><span className="mt-2 block text-[11px] text-subtle">{formatDateTime(doc.createdAt)}</span></button>)}
          </div>
        )}
        </aside>
        {active ? <section key={active.id} className="rs-review-detail min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5"><div><p className="mb-1 text-[10px] font-semibold tracking-widest text-muted uppercase">Hồ sơ đang xem</p><h2 className="text-lg font-semibold">{active.driverProfile.user.fullName}</h2></div><Badge>Chờ xét duyệt</Badge></div>
          <div className="grid items-stretch lg:grid-cols-[minmax(0,1fr)_220px]">
            <VerificationDocumentViewer front={active.frontPhotoUrl ?? null} back={active.backPhotoUrl ?? null} />
            <div className="min-w-0 space-y-6 border-t border-line p-5 break-words lg:border-t-0 lg:border-l"><section><h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Thông tin giấy tờ</h3><p className="text-sm font-medium">{DRIVER_DOCUMENT_TYPE[active.type]}</p><p className="mt-2 font-mono text-lg tracking-wide">{active.documentNumber}</p>{active.licenseClass ? <div className="mt-2"><Badge>Hạng {active.licenseClass}</Badge></div> : null}</section><section><h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Người nộp</h3><PersonCell person={active.driverProfile.user} /><dl className="mt-3 divide-y divide-line text-sm"><Fact label="Ngày sinh">{formatDate(active.driverProfile.user.dateOfBirth)}</Fact><Fact label="Điện thoại">{active.driverProfile.user.phone ?? "—"}</Fact><Fact label="Kinh nghiệm">{active.driverProfile.experienceYears} năm</Fact></dl></section></div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white px-6 py-4"><span className="text-xs text-muted">Nộp lúc {formatDateTime(active.createdAt)}</span><Button disabled={reviewing || loading || !!error} onClick={() => { setSelectedId(active.id); setReviewError(null); }}>Xem xét quyết định<ArrowRight className="size-4" aria-hidden /></Button></div>
        </section> : <div className="flex min-h-96 items-center justify-center bg-gray-50/30"><EmptyState title={loading ? "Đang tải hồ sơ" : error ? "Chưa tải được hồ sơ" : "Không có hồ sơ để xem"} /></div>}
      </div>
      {error && data ? <ErrorState error={error} onRetry={() => refetch()} /> : null}

      <VerificationReviewDialog
        key={selected?.id}
        open={selected !== null}
        onClose={closeDialog}
        title={selected ? DRIVER_DOCUMENT_TYPE[selected.type] : ""}
        description={selected ? `Hồ sơ của ${selected.driverProfile.user.fullName}` : undefined}
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
              <h3 className="mb-1 text-sm font-semibold">Giấy tờ</h3>
              <dl className="divide-y divide-line">
                <Fact label="Số giấy tờ">{selected.documentNumber}</Fact>
                {selected.licenseClass ? (
                  <Fact label="Hạng bằng lái">{selected.licenseClass}</Fact>
                ) : null}
                <Fact label="Nộp lúc">{formatDateTime(selected.createdAt)}</Fact>
              </dl>
            </section>
            <section>
              <h3 className="mb-1 text-sm font-semibold">Người nộp</h3>
              <dl className="divide-y divide-line">
                <Fact label="Họ tên">{selected.driverProfile.user.fullName}</Fact>
                <Fact label="Ngày sinh">
                  {formatDate(selected.driverProfile.user.dateOfBirth)}
                </Fact>
                <Fact label="Email">{selected.driverProfile.user.email ?? "—"}</Fact>
                <Fact label="Số điện thoại">{selected.driverProfile.user.phone ?? "—"}</Fact>
                <Fact label="Kinh nghiệm lái xe">
                  {selected.driverProfile.experienceYears} năm
                </Fact>
              </dl>
            </section>
          </>
        ) : null}
      </VerificationReviewDialog>
    </>
  );
}
