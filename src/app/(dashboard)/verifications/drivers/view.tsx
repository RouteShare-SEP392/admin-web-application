"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import { useState } from "react";
import { PersonCell } from "@/components/person-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
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
  PENDING_DRIVER_VERIFICATIONS,
  REVIEW_DRIVER_VERIFICATION,
} from "@/lib/graphql";
import { DRIVER_DOCUMENT_TYPE } from "@/lib/labels";
import { isExistingApiMocked } from "@/lib/mock-mode";
import type { DriverVerificationType, VerificationStatus } from "@/lib/types";
import { useUrlSearchText, useUrlState } from "@/lib/use-url-state";
import { errorMessage, formatDate, formatDateTime } from "@/lib/utils";

const DOCUMENT_TYPES = [
  "IDENTITY_CARD",
  "DRIVER_LICENSE",
] as const satisfies readonly DriverVerificationType[];

export function DriverVerificationsView() {
  const { data, loading, error, refetch } = useQuery(PENDING_DRIVER_VERIFICATIONS);
  const [review, { loading: reviewing }] = useMutation(REVIEW_DRIVER_VERIFICATION, {
    refetchQueries: [PENDING_DRIVER_VERIFICATIONS, PENDING_COUNTS],
    awaitRefetchQueries: true,
  });
  const notify = useToast();

  // Bộ lọc nằm trên URL: /verifications/drivers?q=...&type=...
  const url = useUrlState();
  const type = url.getOption("type", DOCUMENT_TYPES);
  const query = url.getText("q");
  const [search, setSearch] = useUrlSearchText(query, (q) => url.setParams({ q }));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const all = data?.adminPendingDriverVerifications ?? [];
  const keyword = query.toLowerCase();
  const rows = all.filter((doc) => {
    if (type && doc.type !== type) return false;
    if (!keyword) return true;
    const user = doc.driverProfile.user;
    return [user.fullName, user.email, user.phone, doc.documentNumber].some((value) =>
      value?.toLowerCase().includes(keyword),
    );
  });
  const selected = all.find((doc) => doc.id === selectedId) ?? null;
  const selectedIndex = rows.findIndex((doc) => doc.id === selectedId);

  function navigate(step: -1 | 1) {
    const target = rows[selectedIndex + step];
    if (target) {
      setReviewError(null);
      setSelectedId(target.id);
    }
  }

  function closeDialog() {
    setSelectedId(null);
    setReviewError(null);
  }

  async function submit(status: VerificationStatus, rejectionReason?: string) {
    if (!selected) return;
    setReviewError(null);
    // Xác định hồ sơ kế tiếp trước khi hàng chờ được tải lại và hồ sơ này biến mất.
    const next = rows[selectedIndex + 1] ?? rows[selectedIndex - 1] ?? null;
    try {
      await review({
        variables: { input: { verificationId: selected.id, status, rejectionReason } },
      });
      notify(
        status === "APPROVED"
          ? `Đã phê duyệt ${DRIVER_DOCUMENT_TYPE[selected.type].toLowerCase()} của ${selected.driverProfile.user.fullName}.`
          : `Đã từ chối hồ sơ của ${selected.driverProfile.user.fullName}.`,
      );
      // Chuyển thẳng sang hồ sơ kế tiếp; hết hàng chờ thì đóng hộp thoại.
      setSelectedId(next?.id ?? null);
    } catch (cause) {
      setReviewError(errorMessage(cause));
    }
  }

  return (
    <>
      <PageHeader
        title="Duyệt hồ sơ tài xế"
        description="Căn cước công dân và giấy phép lái xe đang chờ xét duyệt, hồ sơ nộp trước xếp trên."
        mocked={isExistingApiMocked()}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-56 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Tìm hồ sơ"
              placeholder="Tìm theo tên, email, số điện thoại, số giấy tờ"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            aria-label="Loại giấy tờ"
            value={type}
            onChange={(event) => url.setParams({ type: event.target.value })}
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
          <Table>
            <thead>
              <tr>
                <Th>Tài xế</Th>
                <Th>Loại giấy tờ</Th>
                <Th>Số giấy tờ</Th>
                <Th>Nộp lúc</Th>
                <Th className="text-right">Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((doc) => (
                <Tr key={doc.id}>
                  <Td>
                    <PersonCell
                      person={doc.driverProfile.user}
                      href={`/verifications/drivers/${doc.driverProfile.id}`}
                    />
                  </Td>
                  <Td>
                    <span className="mr-2">{DRIVER_DOCUMENT_TYPE[doc.type]}</span>
                    {doc.licenseClass ? <Badge>Hạng {doc.licenseClass}</Badge> : null}
                  </Td>
                  <Td className="tabular-nums">{doc.documentNumber}</Td>
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
        title={selected ? DRIVER_DOCUMENT_TYPE[selected.type] : ""}
        description={selected ? `Hồ sơ của ${selected.driverProfile.user.fullName}` : undefined}
        photos={[
          { label: "Mặt trước", url: selected?.frontPhotoUrl ?? null },
          { label: "Mặt sau", url: selected?.backPhotoUrl ?? null },
        ]}
        busy={reviewing}
        error={reviewError}
        queue={
          selectedIndex >= 0
            ? { index: selectedIndex, total: rows.length, onNavigate: navigate }
            : undefined
        }
        profileHref={selected ? `/verifications/drivers/${selected.driverProfile.id}` : undefined}
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
