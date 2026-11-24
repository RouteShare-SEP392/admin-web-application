"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import { ME } from "@/lib/graphql";
import { ConversationReports } from "./conversation-reports";
import { CATALOG, CatalogEditor, type Catalog } from "./catalog";

const QUEUE = gql`
  query AdminSupportCases(
    $after: ID
    $status: String
    $priority: Int
    $issue: String
    $assignee: ID
  ) {
    adminSupportCases(
      after: $after
      status: $status
      priority: $priority
      issue: $issue
      assignee: $assignee
    ) {
      id
      issueLabel
      status
      priority
      createdAt
      assignedAdminId
      bookingId
      tripId
      subject {
        departure
        pickup
        dropoff
        role
      }
    }
  }
`;
const DETAIL = gql`
  query AdminSupportCase($id: ID!) {
    adminSupportCase(id: $id) {
      id
      issueLabel
      status
      priority
      createdAt
      assignedAdminId
      bookingId
      tripId
      reporterId
      reporterName
      prompt
      answer
      callbackPhone
      handlingIssueKey
      subject {
        departure
        pickup
        dropoff
        role
      }
      finalizedFare
      receiptConfirmedAt
      relatedCaseIds
      journeyEvents {
        kind
        occurredAt
      }
      messages {
        id
        senderId
        body
        createdAt
      }
      savedEvidence {
        id
        senderId
        body
        createdAt
      }
      relatedBookings {
        id
        passengerName
        pickup
        dropoff
        plannedPickupAt
      }
      history {
        actorId
        kind
        createdAt
        response
        internalNote
        relatedCaseId
      }
    }
  }
`;
const CLAIM = gql`
  mutation ClaimSupportCase($id: ID!) {
    claimSupportCase(id: $id) {
      id
      status
      assignedAdminId
    }
  }
`;
const PUBLISH = gql`
  mutation PublishSupportCaseResult(
    $id: ID!
    $response: String!
    $internalNote: String
  ) {
    publishSupportCaseResult(
      id: $id
      response: $response
      internalNote: $internalNote
    ) {
      id
      status
    }
  }
`;
const REASSIGN = gql`
  mutation ReassignSupportCase($id: ID!, $adminId: ID!) {
    reassignSupportCase(id: $id, adminId: $adminId) {
      id
    }
  }
`;
const RECLASSIFY = gql`
  mutation ReclassifySupportCase($id: ID!, $issue: String!, $reason: String!) {
    reclassifySupportCase(id: $id, issue: $issue, reason: $reason) {
      id
    }
  }
`;
const ADMINS = gql`
  query SupportAssignableAdmins {
    supportAssignableAdmins {
      id
      name
    }
  }
`;
const REQUEUE = gql`
  mutation RequeueSupportCase($id: ID!, $reason: String!) {
    requeueSupportCase(id: $id, reason: $reason) { id status assignedAdminId }
  }
`;
const SAVE_EVIDENCE = gql`
  mutation SaveSupportCaseEvidence($id: ID!, $messageId: ID!) {
    saveSupportCaseEvidence(id: $id, messageId: $messageId)
  }
`;
type Admin = { id: string; name: string };

type Row = {
  id: string;
  issueLabel: string;
  status: "QUEUED" | "ASSIGNED" | "RESOLVED";
  priority: number;
  createdAt: string;
  assignedAdminId?: string;
  bookingId?: string;
  tripId?: string;
  subject: {
    departure: string;
    pickup?: string;
    dropoff?: string;
    role: string;
  };
};
type Detail = Row & {
  reporterId: string;
  prompt: string;
  answer: string;
  callbackPhone?: string;
  handlingIssueKey: string;
  reporterName?: string;
  finalizedFare?: string;
  receiptConfirmedAt?: string;
  relatedCaseIds: string[];
  journeyEvents: Array<{ kind: string; occurredAt: string }>;
  messages: Evidence[];
  savedEvidence: Evidence[];
  relatedBookings: Array<{
    id: string;
    passengerName: string;
    pickup: string;
    dropoff: string;
    plannedPickupAt: string;
  }>;
  history: Array<{
    actorId: string;
    kind: string;
    createdAt: string;
    response?: string;
    internalNote?: string;
    relatedCaseId?: string;
  }>;
};
type Evidence = {
  id: string;
  senderId?: string;
  body?: string;
  createdAt: string;
};
const states = {
  QUEUED: "Đã tiếp nhận",
  ASSIGNED: "Đang xử lý",
  RESOLVED: "Đã có kết quả",
};
const eventNames: Record<string, string> = {
  CLAIMED: "Nhận xử lý",
  REASSIGNED: "Đổi người xử lý",
  REQUEUED: "Đưa về hàng đợi",
  RECLASSIFIED: "Đổi loại vấn đề",
  LINKED: "Liên kết hồ sơ",
  RESOLVED: "Công bố kết quả",
  REOPENED: "Mở lại hồ sơ",
};
const journeyNames: Record<string, string> = {
  BOARD: "Đã xác nhận lên xe",
  ALIGHT: "Đã xác nhận xuống xe",
  TRIP_STARTED: "Bắt đầu chuyến",
  TRIP_COMPLETED: "Kết thúc chuyến",
};
const date = (s: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(s));
const field = "rounded-xl border border-line bg-white p-3";
const button =
  "rounded-xl bg-brand-700 px-4 py-2 font-semibold text-white disabled:opacity-50";

function CaseDetail({
  id,
  userId,
  refresh,
  open,
  catalog,
  admins,
  adminsLoaded,
}: {
  id: string;
  userId?: string;
  refresh: () => void;
  open: (id: string) => void;
  catalog?: Catalog;
  admins: Admin[];
  adminsLoaded: boolean;
}) {
  const { data, loading, error, refetch } = useQuery<{
    adminSupportCase: Detail;
  }>(DETAIL, {
    variables: { id },
    fetchPolicy: "network-only",
  });
  const [claim, claimState] = useMutation(CLAIM);
  const [publish, publishState] = useMutation(PUBLISH);
  const [reassign, reassignState] = useMutation(REASSIGN);
  const [requeue, requeueState] = useMutation(REQUEUE);
  const [requeueReason, setRequeueReason] = useState("");
  const [reclassify, classifyState] = useMutation(RECLASSIFY);
  const [saveEvidence, evidenceState] = useMutation(SAVE_EVIDENCE);
  const [response, setResponse] = useState("");
  const [note, setNote] = useState("");
  const [newAdmin, setNewAdmin] = useState("");
  const [newIssue, setNewIssue] = useState("");
  const [reason, setReason] = useState("");
  const row = data?.adminSupportCase;
  const update = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } finally {
      void refetch();
      refresh();
    }
  };
  if (loading && !row) return <p role="status">Đang tải hồ sơ…</p>;
  if (error || !row)
    return (
      <p role="alert">
        Không tải được hồ sơ.{" "}
        <button onClick={() => void refetch()}>Thử lại</button>
      </p>
    );
  return (
    <article className="space-y-5 rounded-2xl border border-line bg-white p-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">{row.issueLabel}</h2>
        <p>
          {states[row.status]} · {row.priority ? "Ưu tiên" : "Thông thường"}
        </p>
        <p className="text-sm">{date(row.createdAt)}</p>
      </div>
      <section>
        <h3 className="font-semibold">Nội dung báo cáo</h3>
        <p>{row.prompt}</p>
        <p className="whitespace-pre-wrap break-words">
          {row.answer || "Người gửi chưa thêm mô tả."}
        </p>
      </section>
      <dl className="grid gap-3 break-all text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold">
            Người gửi ·{" "}
            {row.subject.role === "DRIVER" ? "Tài xế" : "Hành khách"}
          </dt>
          <dd>{row.reporterName || row.reporterId}</dd>
        </div>
        <div>
          <dt className="font-semibold">
            {row.bookingId ? "Lượt đặt" : "Chuyến đi"}
          </dt>
          <dd>{row.bookingId || row.tripId}</dd>
        </div>
        <div>
          <dt className="font-semibold">Người xử lý</dt>
          <dd>
            {admins.find((admin) => admin.id === row.assignedAdminId)?.name ??
              row.assignedAdminId ??
              "Chưa có"}
          </dd>
        </div>
        {row.callbackPhone ? (
          <div>
            <dt className="font-semibold">Điện thoại đã xác thực</dt>
            <dd>{row.callbackPhone}</dd>
          </div>
        ) : null}
      </dl>
      <section className="space-y-2 border-t border-line pt-4">
        <h3 className="font-semibold">Thông tin chuyến</h3>
        <p>
          {date(row.subject.departure)}
          {row.subject.pickup && row.subject.dropoff
            ? ` · ${row.subject.pickup} → ${row.subject.dropoff}`
            : ""}
        </p>
        {row.journeyEvents.map((event) => (
          <p key={`${event.kind}:${event.occurredAt}`}>
            {journeyNames[event.kind] ?? event.kind} · {date(event.occurredAt)}
          </p>
        ))}
        {row.bookingId ? (
          <>
            <p>
              Tiền chuyến đã chốt:{" "}
              {row.finalizedFare == null
                ? "Chưa có dữ liệu"
                : new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(row.finalizedFare))}
            </p>
            <p>
              Xác nhận đã thu:{" "}
              {row.receiptConfirmedAt
                ? date(row.receiptConfirmedAt)
                : "Chưa ghi nhận"}
            </p>
          </>
        ) : null}
        <details>
          <summary className="cursor-pointer font-semibold">
            Tin nhắn liên quan ({row.messages.length})
          </summary>
          {row.messages.length ? (
            row.messages.map((message) => (
              <div
                key={message.id}
                className="mt-2 whitespace-pre-wrap break-words"
              >
                <p>
                  {date(message.createdAt)} · {message.body || "Mốc hội thoại"}
                </p>
                {message.senderId &&
                row.status === "ASSIGNED" &&
                row.assignedAdminId === userId ? (
                  row.savedEvidence.some((item) => item.id === message.id) ? (
                    <p className="text-sm">Đã lưu vào hồ sơ</p>
                  ) : (
                    <button
                      className="text-sm text-brand-700"
                      disabled={evidenceState.loading}
                      onClick={() =>
                        void update(() =>
                          saveEvidence({
                            variables: { id, messageId: message.id },
                          }),
                        ).catch(() => undefined)
                      }
                    >
                      Lưu vào hồ sơ
                    </button>
                  )
                ) : null}
              </div>
            ))
          ) : (
            <p>Không có tin nhắn khả dụng.</p>
          )}
          {evidenceState.error ? (
            <p role="alert">Chưa lưu được tin nhắn.</p>
          ) : null}
        </details>
        {row.savedEvidence.length ? (
          <details>
            <summary className="cursor-pointer font-semibold">
              Tin nhắn đã lưu ({row.savedEvidence.length})
            </summary>
            {row.savedEvidence.map((message) => (
              <p
                key={message.id}
                className="mt-2 whitespace-pre-wrap break-words"
              >
                {date(message.createdAt)} · {message.body}
              </p>
            ))}
          </details>
        ) : null}
        {row.relatedCaseIds.length ? (
          <details>
            <summary className="cursor-pointer font-semibold">
              Hồ sơ liên quan ({row.relatedCaseIds.length})
            </summary>
            {row.relatedCaseIds.map((caseId) => (
              <button
                key={caseId}
                className="block break-all py-1 text-brand-700"
                onClick={() => open(caseId)}
              >
                {caseId}
              </button>
            ))}
          </details>
        ) : null}
        {row.relatedBookings.length ? (
          <details>
            <summary className="cursor-pointer font-semibold">
              Lượt đặt liên quan ({row.relatedBookings.length})
            </summary>
            {row.relatedBookings.map((booking) => (
              <div key={booking.id} className="mt-2 border-t border-line pt-2">
                <p className="font-semibold">{booking.passengerName}</p>
                <p>
                  {booking.pickup} → {booking.dropoff} ·{" "}
                  {date(booking.plannedPickupAt)}
                </p>
              </div>
            ))}
          </details>
        ) : null}
      </section>
      {row.status === "QUEUED" ? (
        <button
          className={button}
          disabled={claimState.loading}
          onClick={() =>
            void update(() => claim({ variables: { id } })).catch(
              () => undefined,
            )
          }
        >
          Nhận xử lý
        </button>
      ) : null}
      {claimState.error ? (
        <p role="alert">
          Chưa nhận được hồ sơ. Hãy kiểm tra trạng thái mới nhất.
        </p>
      ) : null}
      {adminsLoaded && row.status === "ASSIGNED" &&
        !admins.some((admin) => admin.id === row.assignedAdminId) ? (
        <form className="space-y-2" onSubmit={(event) => {
          event.preventDefault();
          if (!requeueReason.trim() || requeueState.loading) return;
          void update(() => requeue({ variables: { id, reason: requeueReason.trim() } }))
            .then(() => setRequeueReason("")).catch(() => undefined);
        }}>
          <p>Người phụ trách hiện không còn quyền xử lý hồ sơ.</p>
          <label className="block font-semibold">Lý do đưa về hàng đợi
            <textarea className={`mt-1 block w-full ${field}`} required maxLength={2000}
              value={requeueReason} onChange={(event) => setRequeueReason(event.target.value)} />
          </label>
          <button className={button} disabled={!requeueReason.trim() || requeueState.loading}>Đưa về hàng đợi</button>
          {requeueState.error ? <p role="alert">Chưa đưa được hồ sơ về hàng đợi. Hãy kiểm tra trạng thái mới nhất.</p> : null}
        </form>
      ) : null}
      {row.status === "ASSIGNED" && row.assignedAdminId === userId ? (
        <>
          <details className="space-y-3">
            <summary className="cursor-pointer font-semibold">
              Đổi loại hoặc chuyển hồ sơ
            </summary>
            <form
              className="space-y-2 pt-2"
              onSubmit={(event) => {
                event.preventDefault();
                void update(() =>
                  reclassify({
                    variables: { id, issue: newIssue, reason: reason.trim() },
                  }),
                )
                  .then(() => {
                    setNewIssue("");
                    setReason("");
                  })
                  .catch(() => undefined);
              }}
            >
              <select
                className={`${field} block w-full`}
                aria-label="Loại xử lý mới"
                value={newIssue}
                onChange={(event) => setNewIssue(event.target.value)}
              >
                <option value="">Chọn loại xử lý mới</option>
                {catalog?.issues
                  .filter(
                    (issue) =>
                      issue.enabled &&
                      issue.key !== row.handlingIssueKey &&
                      (!row.tripId || issue.tripWide),
                  )
                  .map((issue) => (
                    <option key={issue.key} value={issue.key}>
                      {issue.label}
                    </option>
                  ))}
              </select>
              <input
                className={`${field} block w-full`}
                aria-label="Lý do đổi loại"
                placeholder="Lý do đổi loại"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <button
                className={button}
                disabled={!newIssue || !reason.trim() || classifyState.loading}
              >
                Đổi loại xử lý
              </button>
              {classifyState.error ? (
                <p role="alert">Chưa đổi được loại xử lý.</p>
              ) : null}
            </form>
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                void update(() =>
                  reassign({ variables: { id, adminId: newAdmin.trim() } }),
                ).catch(() => undefined);
              }}
            >
              <select
                className={`${field} block w-full`}
                aria-label="Quản trị viên nhận hồ sơ"
                value={newAdmin}
                onChange={(event) => setNewAdmin(event.target.value)}
              >
                <option value="">Chọn người nhận hồ sơ</option>
                {admins
                  .filter((admin) => admin.id !== userId)
                  .map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.name}
                    </option>
                  ))}
              </select>
              <button
                className={button}
                disabled={!newAdmin.trim() || reassignState.loading}
              >
                Chuyển hồ sơ
              </button>
              {reassignState.error ? (
                <p role="alert">Chưa chuyển được hồ sơ.</p>
              ) : null}
            </form>
          </details>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!response.trim()) return;
              void update(() =>
                publish({
                  variables: {
                    id,
                    response: response.trim(),
                    internalNote: note.trim() || null,
                  },
                }),
              )
                .then(() => {
                  setResponse("");
                  setNote("");
                })
                .catch(() => undefined);
            }}
          >
            <label className="block font-semibold">
              Phản hồi gửi người dùng
              <textarea
                required
                maxLength={2000}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
                className={`mt-1 block w-full font-normal ${field}`}
              />
            </label>
            <label className="block font-semibold">
              Ghi chú nội bộ
              <textarea
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className={`mt-1 block w-full font-normal ${field}`}
              />
            </label>
            <button
              className={button}
              disabled={!response.trim() || publishState.loading}
            >
              Công bố kết quả
            </button>
            {publishState.error ? (
              <p role="alert">Chưa công bố được kết quả. Vui lòng thử lại.</p>
            ) : null}
          </form>
        </>
      ) : null}
      <section className="space-y-3">
        <h3 className="font-semibold">Lịch sử xử lý</h3>
        {row.history.length ? (
          row.history.map((event, index) => (
            <div
              className="space-y-1 border-t border-line pt-3"
              key={`${event.createdAt}:${index}`}
            >
              <p className="font-semibold">
                {eventNames[event.kind] ?? event.kind} · {date(event.createdAt)}
              </p>
              {event.response ? (
                <p className="whitespace-pre-wrap">
                  Phản hồi: {event.response}
                </p>
              ) : null}
              {event.internalNote ? (
                <p className="whitespace-pre-wrap">
                  Nội bộ: {event.internalNote}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <p>Chưa có thao tác xử lý.</p>
        )}
      </section>
    </article>
  );
}

export function SupportWorkspace() {
  const { data: session } = useQuery(ME);
  const { data: catalog } = useQuery<{ adminSupportCatalog: Catalog }>(CATALOG);
  const { data: adminData } = useQuery<{ supportAssignableAdmins: Admin[] }>(
    ADMINS,
  );
  const [view, setView] = useState<"queue" | "catalog" | "conversations">("queue");
  const [selected, setSelected] = useState<string>();
  const [status, setStatus] = useState("");
  const [safety, setSafety] = useState(false);
  const [mine, setMine] = useState(false);
  const [assigned, setAssigned] = useState("");
  const [issue, setIssue] = useState("");
  const [after, setAfter] = useState<string>();
  const [trail, setTrail] = useState<(string | undefined)[]>([]);
  const { data, loading, error, refetch } = useQuery<{
    adminSupportCases: Row[];
  }>(QUEUE, {
    variables: {
      after,
      status: status || null,
      priority: safety ? 1 : null,
      issue: issue || null,
      assignee: mine ? session?.me.id : assigned || null,
    },
    fetchPolicy: "network-only",
  });
  const rows = data?.adminSupportCases ?? [];
  const admins = adminData?.supportAssignableAdmins ?? [];
  const reset = () => {
    setAfter(undefined);
    setTrail([]);
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Yêu cầu hỗ trợ</h1>
      <nav aria-label="Quản lý hỗ trợ" className="flex flex-wrap gap-2">
        <button
          className={field}
          aria-pressed={view === "queue"}
          onClick={() => setView("queue")}
        >
          Hàng đợi
        </button>
        <button
          className={field}
          aria-pressed={view === "catalog"}
          onClick={() => setView("catalog")}
        >
          Danh mục
        </button>
        <button className={field} aria-pressed={view === "conversations"}
          onClick={() => setView("conversations")}>Báo cáo hội thoại</button>
      </nav>
      {view === "catalog" ? (
        <CatalogEditor />
      ) : view === "conversations" ? (
        <ConversationReports />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Trạng thái"
              className={field}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                reset();
              }}
            >
              <option value="">Hồ sơ đang mở</option>
              {Object.entries(states).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select
              aria-label="Loại vấn đề"
              className={field}
              value={issue}
              onChange={(e) => {
                setIssue(e.target.value);
                reset();
              }}
            >
              <option value="">Tất cả vấn đề</option>
              {catalog?.adminSupportCatalog.issues.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
            <label>
              <input
                type="checkbox"
                checked={safety}
                onChange={(e) => {
                  setSafety(e.target.checked);
                  reset();
                }}
              />{" "}
              Chỉ hồ sơ ưu tiên
            </label>
            <select
              aria-label="Người phụ trách"
              className={field}
              value={mine ? "mine" : assigned}
              onChange={(e) => {
                setMine(e.target.value === "mine");
                setAssigned(e.target.value === "mine" ? "" : e.target.value);
                reset();
              }}
            >
              <option value="">Tất cả người phụ trách</option>
              {session?.me.id ? (
                <option value="mine">Tôi phụ trách</option>
              ) : null}
              {admins
                .filter((admin) => admin.id !== session?.me.id)
                .map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name}
                  </option>
                ))}
            </select>
            <button className={field} onClick={() => void refetch()}>
              Tải lại
            </button>
          </div>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="p-3">Vấn đề</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3">Tiếp nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-line">
                      <td className="p-3">
                        <button
                          className="text-left font-semibold text-brand-700"
                          aria-pressed={selected === row.id}
                          onClick={() => setSelected(row.id)}
                        >
                          {row.issueLabel}
                        </button>
                        {row.priority ? <p>Ưu tiên</p> : null}
                        <p>
                          {row.subject.role === "DRIVER"
                            ? "Tài xế"
                            : "Hành khách"}{" "}
                          · {date(row.subject.departure)}
                        </p>
                      </td>
                      <td className="p-3">
                        {states[row.status]}
                        <p>
                          {row.assignedAdminId
                            ? row.assignedAdminId === session?.me.id
                              ? "Tôi phụ trách"
                              : (admins.find(
                                  (admin) => admin.id === row.assignedAdminId,
                                )?.name ?? "Đã có người phụ trách")
                            : "Chưa phân công"}
                        </p>
                      </td>
                      <td className="p-3">{date(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading ? (
                <p role="status" className="p-3">
                  Đang tải…
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="p-3">
                  Không tải được hàng đợi.
                </p>
              ) : null}
              {!loading && !error && !rows.length ? (
                <p className="p-3">Không có hồ sơ phù hợp.</p>
              ) : null}
              <div className="flex gap-3 p-3">
                {trail.length ? (
                  <button
                    onClick={() => {
                      setAfter(trail.at(-1));
                      setTrail(trail.slice(0, -1));
                    }}
                  >
                    Trang trước
                  </button>
                ) : null}
                {rows.length === 25 ? (
                  <button
                    onClick={() => {
                      setTrail([...trail, after]);
                      setAfter(rows.at(-1)?.id);
                    }}
                  >
                    Trang sau
                  </button>
                ) : null}
              </div>
            </div>
            {selected ? (
              <CaseDetail
                key={selected}
                id={selected}
                userId={session?.me.id}
                refresh={() => void refetch()}
                open={setSelected}
                catalog={catalog?.adminSupportCatalog}
                admins={admins}
                adminsLoaded={Boolean(adminData)}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
