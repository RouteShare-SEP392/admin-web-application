"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BackLink } from "@/components/back-link";
import { PersonCell } from "@/components/person-cell";
import { TripRoute } from "@/components/trip-route";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { ReasonDialog } from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  ErrorState,
  Fact,
  TableSkeleton,
} from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { OPEN_REPORT_COUNT, REPORT_DETAIL, UPDATE_REPORT_STATUS } from "@/lib/graphql";
import { REPORT_STATUS, REPORT_TYPE, USER_STATUS } from "@/lib/labels";
import { overdueHours } from "@/lib/report-rules";
import type { ReportStatus } from "@/lib/types";
import { errorMessage, formatDateTime } from "@/lib/utils";

type Closing = "RESOLVED" | "REJECTED";

const CLOSING_COPY: Record<Closing, { title: string; description: string; confirm: string }> = {
  RESOLVED: {
    title: "Đánh dấu đã giải quyết?",
    description:
      "Dùng khi báo cáo đúng và bạn đã xử lý xong. Ghi lại bạn đã làm gì để người sau tra cứu.",
    confirm: "Đã giải quyết",
  },
  REJECTED: {
    title: "Bác bỏ báo cáo này?",
    description: "Dùng khi báo cáo không có căn cứ hoặc không vi phạm quy định. Ghi rõ lý do.",
    confirm: "Bác bỏ",
  },
};

export function ReportDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useQuery(REPORT_DETAIL, { variables: { id } });
  const [updateStatus, { loading: updating }] = useMutation(UPDATE_REPORT_STATUS, {
    refetchQueries: [OPEN_REPORT_COUNT],
  });
  const notify = useToast();
  const [closing, setClosing] = useState<Closing | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);

  const report = data?.adminReport;
  const back = <BackLink href="/reports" label="Danh sách báo cáo" />;

  if (!report) {
    return (
      <>
        {back}
        <Card>
          {loading ? <TableSkeleton /> : <ErrorState error={error} onRetry={() => refetch()} />}
        </Card>
      </>
    );
  }

  const isOpen = report.status === "OPEN";
  const isClosed = report.status === "RESOLVED" || report.status === "REJECTED";
  const waited = overdueHours(report);

  /**
   * Cập nhật thất bại thường vì quản trị viên khác vừa xử lý báo cáo này. Tải lại
   * để trang hiện đúng trạng thái và kết quả mới; trả về true nếu trạng thái đã đổi.
   */
  async function reloadAfterFailure(seen: ReportStatus): Promise<boolean> {
    try {
      const { data: fresh } = await refetch();
      const changed = fresh?.adminReport.status !== undefined && fresh.adminReport.status !== seen;
      if (changed) {
        notify("Báo cáo vừa được quản trị viên khác cập nhật. Trang đã hiện trạng thái mới.", "error");
      }
      return changed;
    } catch {
      return false;
    }
  }

  async function takeOver() {
    const seen = report!.status;
    try {
      await updateStatus({ variables: { input: { reportId: id, status: "UNDER_REVIEW" } } });
      notify("Bạn đã nhận xử lý báo cáo này.");
    } catch (cause) {
      if (!(await reloadAfterFailure(seen))) notify(errorMessage(cause), "error");
    }
  }

  async function close(note: string) {
    if (!closing) return;
    const seen = report!.status;
    setCloseError(null);
    try {
      await updateStatus({ variables: { input: { reportId: id, status: closing, note } } });
      notify(closing === "RESOLVED" ? "Đã đóng báo cáo: đã giải quyết." : "Đã bác bỏ báo cáo.");
      setClosing(null);
    } catch (cause) {
      // Báo cáo đã đổi trạng thái thì đóng hộp thoại: ghi chú vừa gõ không còn áp dụng được.
      if (await reloadAfterFailure(seen)) setClosing(null);
      else setCloseError(errorMessage(cause));
    }
  }

  return (
    <>
      {back}

      <Card className="mb-6 flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge meta={REPORT_STATUS[report.status]} />
            {waited !== null ? <Badge tone="bad">Quá hạn</Badge> : null}
          </div>
          <h1 className="text-xl font-semibold">{REPORT_TYPE[report.type]}</h1>
          <p className="mt-1 text-sm text-muted">
            Gửi lúc {formatDateTime(report.createdAt)}
            {waited !== null ? ` · đã chờ ${waited} giờ chưa ai nhận` : ""}
          </p>
        </div>
        {isClosed ? null : (
          <div className="flex flex-wrap gap-2">
            {isOpen ? (
              <Button variant="secondary" onClick={takeOver} disabled={updating}>
                Nhận xử lý
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => setClosing("REJECTED")} disabled={updating}>
              Bác bỏ
            </Button>
            <Button onClick={() => setClosing("RESOLVED")} disabled={updating}>
              Đã giải quyết
            </Button>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Nội dung báo cáo" />
            <p className="px-5 py-4 whitespace-pre-line">{report.description}</p>
          </Card>

          {isClosed ? (
            <Card>
              <CardHeader title="Kết quả xử lý" />
              <dl className="divide-y divide-line px-5 py-2">
                <Fact label="Kết luận">{REPORT_STATUS[report.status].label}</Fact>
                <Fact label="Người xử lý">{report.resolvedBy?.fullName ?? "—"}</Fact>
                <Fact label="Đóng lúc">{formatDateTime(report.resolvedAt)}</Fact>
              </dl>
              {report.resolutionNote ? (
                <p className="border-t border-line px-5 py-4 text-sm">
                  <span className="mb-1 block text-muted">Ghi chú xử lý</span>
                  {report.resolutionNote}
                </p>
              ) : null}
            </Card>
          ) : null}

          {report.trip ? (
            <Card>
              <CardHeader
                title="Chuyến đi liên quan"
                action={
                  <Link
                    href={`/trips/${report.trip.id}`}
                    className={buttonClass("secondary", "sm")}
                  >
                    Mở chuyến {report.trip.tripCode}
                  </Link>
                }
              />
              <div className="space-y-1 p-5">
                <TripRoute stops={report.trip.stops} />
                <p className="text-sm text-muted">
                  Khởi hành {formatDateTime(report.trip.departureTime)}
                </p>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Người bị báo cáo"
              action={<StatusBadge meta={USER_STATUS[report.reportedUser.status]} />}
            />
            <div className="space-y-4 p-5">
              <PersonCell
                person={report.reportedUser}
                href={`/users/${report.reportedUser.id}`}
              />
              <p className="text-sm text-muted">
                Nếu báo cáo đúng và nghiêm trọng, bạn có thể khoá tài khoản ở trang tài khoản
                của người này.
              </p>
              <Link
                href={`/users/${report.reportedUser.id}`}
                className={buttonClass("secondary", "sm")}
              >
                Mở tài khoản
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader title="Người báo cáo" />
            <div className="p-5">
              <PersonCell person={report.reporter} href={`/users/${report.reporter.id}`} />
            </div>
          </Card>
        </div>
      </div>

      <ReasonDialog
        open={closing !== null}
        onClose={() => {
          setClosing(null);
          setCloseError(null);
        }}
        title={closing ? CLOSING_COPY[closing].title : ""}
        description={closing ? CLOSING_COPY[closing].description : undefined}
        reasonLabel="Ghi chú xử lý"
        confirmLabel={closing ? CLOSING_COPY[closing].confirm : ""}
        busy={updating}
        error={closeError}
        onConfirm={close}
      />
    </>
  );
}
