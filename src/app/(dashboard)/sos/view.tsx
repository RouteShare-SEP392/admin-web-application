"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { ExternalLink, MapPin, Phone, Siren } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TripRoute } from "@/components/trip-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReasonDialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/field";
import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { Pagination } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { RESOLVE_SOS_EVENT, SAFETY_COUNTS, SOS_EVENTS } from "@/lib/graphql";
import { isProposedApiMocked } from "@/lib/mock-mode";
import type { SosEvent } from "@/lib/types";
import { useUrlState } from "@/lib/use-url-state";
import { cn, errorMessage, formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 10;
const REFRESH_MS = 30_000;
const STATE_OPTIONS = ["open", "resolved"] as const;

/** Sự cố khẩn cấp người dùng bấm trong chuyến; trang tự làm mới để không bỏ sót sự cố mới. */
export function SosView() {
  // Bộ lọc nằm trên URL: /sos?state=open&page=...
  const url = useUrlState();
  const state = url.getOption("state", STATE_OPTIONS);
  const page = url.getPage();
  const notify = useToast();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const { data, previousData, loading, error, refetch } = useQuery(SOS_EVENTS, {
    variables: {
      input: {
        page,
        pageSize: PAGE_SIZE,
        resolved: state === "" ? undefined : state === "resolved",
      },
    },
    pollInterval: REFRESH_MS,
  });
  const [resolve, { loading: resolving }] = useMutation(RESOLVE_SOS_EVENT, {
    refetchQueries: [SOS_EVENTS, SAFETY_COUNTS],
  });
  const result = (data ?? previousData)?.adminSosEvents;
  const target = result?.items.find((event) => event.id === targetId) ?? null;

  async function handleResolve(notes: string) {
    if (!target) return;
    setResolveError(null);
    try {
      await resolve({ variables: { input: { sosEventId: target.id, notes } } });
      notify(`Đã đóng sự cố của ${target.user.fullName}.`);
      setTargetId(null);
    } catch (cause) {
      setResolveError(errorMessage(cause));
    }
  }

  return (
    <>
      <PageHeader
        title="Sự cố SOS"
        description="Các lần người dùng bấm nút khẩn cấp trong chuyến. Sự cố chưa xử lý luôn nằm trên cùng; trang tự làm mới mỗi 30 giây."
        mocked={isProposedApiMocked()}
        action={
          <Select
            aria-label="Tình trạng xử lý"
            value={state}
            onChange={(event) => url.setParams({ state: event.target.value, page: null })}
          >
            <option value="">Tất cả sự cố</option>
            <option value="open">Chưa xử lý</option>
            <option value="resolved">Đã xử lý</option>
          </Select>
        }
      />

      {!result && loading ? (
        <Card>
          <TableSkeleton rows={4} />
        </Card>
      ) : !result ? (
        <Card>
          <ErrorState error={error} onRetry={() => refetch()} />
        </Card>
      ) : result.items.length === 0 ? (
        <Card>
          <EmptyState
            title={state === "open" ? "Không có sự cố nào đang chờ" : "Không có sự cố phù hợp"}
            description="Sự cố mới sẽ xuất hiện ở đây ngay khi người dùng bấm nút khẩn cấp."
          />
        </Card>
      ) : (
        <>
          <ul className="space-y-4">
            {result.items.map((event) => (
              <li key={event.id}>
                <SosCard event={event} onResolve={() => setTargetId(event.id)} />
              </li>
            ))}
          </ul>
          {result.total > result.pageSize ? (
            <Card className="mt-4">
              <Pagination
                page={result.page}
                pageSize={result.pageSize}
                total={result.total}
                onPageChange={(next) => url.setParams({ page: next === 1 ? null : next })}
              />
            </Card>
          ) : null}
        </>
      )}

      <ReasonDialog
        open={target !== null}
        onClose={() => {
          setTargetId(null);
          setResolveError(null);
        }}
        title={target ? `Đóng sự cố của ${target.user.fullName}?` : ""}
        description="Chỉ đóng khi bạn đã liên hệ được người dùng hoặc người thân và xác nhận họ an toàn."
        reasonLabel="Ghi chú xử lý"
        confirmLabel="Đánh dấu đã xử lý"
        busy={resolving}
        error={resolveError}
        onConfirm={handleResolve}
      />
    </>
  );
}

function SosCard({ event, onResolve }: { event: SosEvent; onResolve: () => void }) {
  const open = event.resolvedAt === null;
  const coordinates = `${event.latitude},${event.longitude}`;

  return (
    <Card className={cn("p-5", open && "border-red-300 bg-red-50/40")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex size-11 shrink-0 items-center justify-center rounded-full",
              open ? "bg-red-100 text-red-700" : "bg-gray-100 text-muted",
            )}
          >
            <Siren className="size-5" aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">SOS lúc {formatDateTime(event.triggeredAt)}</h2>
              {open ? <Badge tone="bad">Chưa xử lý</Badge> : <Badge tone="good">Đã xử lý</Badge>}
            </div>
            {event.trip ? (
              <p className="mt-0.5 text-sm text-muted">
                Trong chuyến{" "}
                <Link
                  href={`/trips/${event.trip.id}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {event.trip.tripCode}
                </Link>
              </p>
            ) : null}
          </div>
        </div>
        {open ? <Button onClick={onResolve}>Đánh dấu đã xử lý</Button> : null}
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-3">
        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
            Người bấm SOS
          </h3>
          <div className="flex items-center gap-3">
            <Avatar name={event.user.fullName} src={event.user.avatarUrl} />
            <div className="leading-tight">
              <Link
                href={`/users/${event.user.id}`}
                className="font-medium hover:text-brand-700 hover:underline"
              >
                {event.user.fullName}
              </Link>
              <PhoneLine phone={event.user.phone} />
            </div>
          </div>
          {event.trip?.driver && event.trip.driver.id !== event.user.id ? (
            <p className="mt-3 text-sm">
              <span className="text-muted">Tài xế: </span>
              <Link
                href={`/users/${event.trip.driver.id}`}
                className="font-medium hover:text-brand-700 hover:underline"
              >
                {event.trip.driver.fullName}
              </Link>
              <PhoneLine phone={event.trip.driver.phone} />
            </p>
          ) : null}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
            Vị trí lúc bấm
          </h3>
          <p className="flex items-center gap-1.5 text-sm tabular-nums">
            <MapPin className="size-4 shrink-0 text-muted" aria-hidden />
            {event.latitude.toFixed(5)}, {event.longitude.toFixed(5)}
          </p>
          <a
            href={`https://www.google.com/maps?q=${coordinates}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
          >
            Mở trên Google Maps
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
          {event.trip ? (
            <div className="mt-3 text-sm">
              <TripRoute stops={event.trip.stops} />
            </div>
          ) : null}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
            Liên hệ khẩn cấp
          </h3>
          {event.emergencyContacts.length === 0 ? (
            <p className="text-sm text-muted">Người dùng chưa khai báo liên hệ khẩn cấp.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {event.emergencyContacts.map((contact) => (
                <li key={contact.id}>
                  <span className="font-medium">{contact.name}</span>
                  <span className="text-muted"> · {contact.relationship}</span>
                  <PhoneLine phone={contact.phone} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {event.notes ? (
        <p className="mt-5 border-t border-line pt-4 text-sm">
          <span className="mb-1 block text-muted">
            Ghi chú xử lý
            {event.resolvedBy ? ` · ${event.resolvedBy.fullName}` : ""}
            {event.resolvedAt ? ` · ${formatDateTime(event.resolvedAt)}` : ""}
          </span>
          {event.notes}
        </p>
      ) : null}
    </Card>
  );
}

function PhoneLine({ phone }: { phone: string | null }) {
  if (!phone) return <span className="block text-xs text-muted">Chưa có số điện thoại</span>;
  return (
    <a
      href={`tel:${phone}`}
      className="flex items-center gap-1 text-sm text-brand-700 tabular-nums hover:underline"
    >
      <Phone className="size-3.5" aria-hidden />
      {phone}
    </a>
  );
}
