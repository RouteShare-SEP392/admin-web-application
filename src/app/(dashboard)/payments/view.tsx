"use client";

import { useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { Pagination, Table, Td, Th, Tr } from "@/components/ui/table";
import { PAYMENTS } from "@/lib/graphql";
import { PAYMENT_METHOD, PAYMENT_STATUS, SETTLEMENT_STATUS } from "@/lib/labels";
import type { PaymentMethod, PaymentStatus } from "@/lib/types";
import { useUrlSearchText, useUrlState } from "@/lib/use-url-state";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

const PAGE_SIZE = 10;
// RouteShare chưa hỗ trợ hoàn tiền, nên bộ lọc chỉ gồm các trạng thái có thể xảy ra.
const STATUS_OPTIONS = ["PAID", "PENDING", "FAILED"] as const satisfies readonly PaymentStatus[];
const METHOD_OPTIONS = ["VIETQR", "MOMO", "CASH"] as const satisfies readonly PaymentMethod[];

export function PaymentsView() {
  // Bộ lọc nằm trên URL: /payments?q=...&status=...&method=...&page=...
  const url = useUrlState();
  const status = url.getOption("status", STATUS_OPTIONS);
  const method = url.getOption("method", METHOD_OPTIONS);
  const page = url.getPage();
  const query = url.getText("q");
  const [search, setSearch] = useUrlSearchText(query, (q) => url.setParams({ q, page: null }));

  const { data, previousData, loading, error, refetch } = useQuery(PAYMENTS, {
    variables: {
      input: {
        page,
        pageSize: PAGE_SIZE,
        search: query || undefined,
        status: status || undefined,
        method: method || undefined,
      },
    },
  });
  const result = (data ?? previousData)?.adminPayments;

  return (
    <>
      <PageHeader
        title="Thanh toán"
        description="Các lần hành khách thanh toán sau chuyến. RouteShare không giữ tiền hộ: trang này chỉ để tra cứu và đối soát."
      />

      {result ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile
            label="Đã thanh toán"
            value={formatCurrency(result.summary.paidAmount)}
            note="tổng các giao dịch thành công"
          />
          <SummaryTile
            label="Phí nền tảng"
            value={formatCurrency(result.summary.platformFee)}
            note="phần nền tảng thu trên giao dịch thành công"
          />
          <SummaryTile
            label="Chờ thanh toán"
            value={formatCurrency(result.summary.pendingAmount)}
            note="chuyến đã xong, khách chưa trả"
          />
          <SummaryTile
            label="Giao dịch thất bại"
            value={formatNumber(result.summary.failedCount)}
            note="cần liên hệ khách để trả lại"
            warn={result.summary.failedCount > 0}
          />
        </div>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-56 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Tìm giao dịch"
              placeholder="Tìm theo mã đặt chỗ, mã giao dịch, tên người trả"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            aria-label="Phương thức thanh toán"
            value={method}
            onChange={(event) => url.setParams({ method: event.target.value, page: null })}
          >
            <option value="">Mọi phương thức</option>
            {METHOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PAYMENT_METHOD[option]}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Trạng thái thanh toán"
            value={status}
            onChange={(event) => url.setParams({ status: event.target.value, page: null })}
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PAYMENT_STATUS[option].label}
              </option>
            ))}
          </Select>
        </div>

        {!result && loading ? (
          <TableSkeleton />
        ) : !result ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : result.items.length === 0 ? (
          <EmptyState
            title="Không có giao dịch phù hợp"
            description="Thử đổi từ khoá hoặc bộ lọc."
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Đặt chỗ</Th>
                  <Th>Người trả</Th>
                  <Th>Tài xế nhận</Th>
                  <Th className="text-right">Số tiền</Th>
                  <Th className="text-right">Phí nền tảng</Th>
                  <Th>Phương thức</Th>
                  <Th>Trạng thái</Th>
                  <Th>Chuyển cho tài xế</Th>
                  <Th>Tạo lúc</Th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((payment) => (
                  <Tr key={payment.id}>
                    <Td>
                      <Link
                        href={`/bookings/${payment.booking.id}`}
                        className="font-semibold whitespace-nowrap text-brand-700 tabular-nums hover:underline"
                      >
                        {payment.booking.bookingCode}
                      </Link>
                      {payment.transactionReference ? (
                        <p className="text-xs text-muted tabular-nums">
                          {payment.transactionReference}
                        </p>
                      ) : null}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <Link
                        href={`/users/${payment.payer.id}`}
                        className="hover:text-brand-700 hover:underline"
                      >
                        {payment.payer.fullName}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <Link
                        href={`/users/${payment.payee.id}`}
                        className="hover:text-brand-700 hover:underline"
                      >
                        {payment.payee.fullName}
                      </Link>
                    </Td>
                    <Td className="text-right font-medium whitespace-nowrap tabular-nums">
                      {formatCurrency(payment.amount)}
                    </Td>
                    <Td className="text-right whitespace-nowrap text-muted tabular-nums">
                      {formatCurrency(payment.platformFee)}
                    </Td>
                    <Td className="whitespace-nowrap">{PAYMENT_METHOD[payment.method]}</Td>
                    <Td>
                      <StatusBadge meta={PAYMENT_STATUS[payment.status]} />
                    </Td>
                    <Td>
                      {payment.settlementStatus ? (
                        <StatusBadge meta={SETTLEMENT_STATUS[payment.settlementStatus]} />
                      ) : (
                        <span className="text-muted">
                          {payment.method === "CASH" ? "Trả trực tiếp" : "—"}
                        </span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {formatDateTime(payment.createdAt)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              onPageChange={(next) => url.setParams({ page: next === 1 ? null : next })}
            />
          </>
        )}
      </Card>
    </>
  );
}

function SummaryTile({
  label,
  value,
  note,
  warn,
}: {
  label: string;
  value: string;
  note: string;
  warn?: boolean;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${warn ? "text-orange-700" : ""}`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-muted">{note}</p>
    </Card>
  );
}
