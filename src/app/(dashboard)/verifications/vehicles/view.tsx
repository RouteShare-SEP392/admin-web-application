"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import { useState } from "react";
import { PersonCell } from "@/components/person-cell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import {
  Card,
  EmptyState,
  ErrorState,
  Fact,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { Table, Td, Th, Tr } from "@/components/ui/table";
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
        title="Duyệt giấy tờ xe"
        description="Giấy đăng ký xe đang chờ xét duyệt. Đối chiếu biển số và loại xe với hạng bằng lái của chủ xe."
        mocked={isExistingApiMocked()}
      />

      <Card>
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
          <Table>
            <thead>
              <tr>
                <Th>Phương tiện</Th>
                <Th>Biển số</Th>
                <Th>Chủ xe</Th>
                <Th>Nộp lúc</Th>
                <Th className="text-right">Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((doc) => (
                <Tr key={doc.id}>
                  <Td>
                    <p className="font-medium">
                      {doc.vehicle.make} {doc.vehicle.model}
                    </p>
                    <p className="text-xs text-muted">
                      {VEHICLE_TYPE[doc.vehicle.vehicleType]} · {doc.vehicle.color}
                    </p>
                  </Td>
                  <Td className="font-medium whitespace-nowrap tabular-nums">
                    {doc.vehicle.plateNumber}
                  </Td>
                  <Td>
                    <PersonCell person={doc.vehicle.driverProfile.user} />
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatDateTime(doc.createdAt)}
                  </Td>
                  <Td className="text-right">
                    <Button size="sm" onClick={() => setSelectedId(doc.id)}>
                      Xem xét
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

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
