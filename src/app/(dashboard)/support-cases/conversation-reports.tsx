"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";

const LIST = gql`query SupportConversationReports($before: ID) {
  adminBookingIncidentReports(before: $before) { id bookingId enrollmentId description createdAt }
}`;
const DETAIL = gql`query SupportConversationReport($id: ID!, $messageBefore: ID) {
  adminBookingIncidentReport(reportId: $id, messageBefore: $messageBefore) {
    id bookingId enrollmentId reporterId description createdAt
    messages { id senderId body createdAt }
    savedEvidence { id senderId body createdAt }
  }
}`;
const SAVE = gql`mutation SaveSupportConversationEvidence($id: ID!, $messages: [ID!]!) {
  saveBookingIncidentEvidence(reportId: $id, messageIds: $messages)
}`;

type Row = { id: string; bookingId?: string; enrollmentId?: string; description: string; createdAt: string };
type Message = { id: string; senderId?: string; body?: string; createdAt: string };
type Report = Row & { reporterId: string; messages: Message[]; savedEvidence: Message[] };
const card = "space-y-3 rounded-2xl border border-line bg-white p-4";
const date = (value: string) => new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short",
}).format(new Date(value));

function ConversationDetail({ id }: { id: string }) {
  const [before, setBefore] = useState<string>();
  const [feedback, setFeedback] = useState("");
  const { data, loading, error, refetch } = useQuery<{ adminBookingIncidentReport: Report }>(DETAIL, {
    variables: { id, messageBefore: before }, fetchPolicy: "network-only",
  });
  const [save, saving] = useMutation<{ saveBookingIncidentEvidence: number }>(SAVE);
  const report = data?.adminBookingIncidentReport;
  return <section className={card}>
    <h2 className="font-bold">Chi tiết báo cáo hội thoại</h2>
    {loading ? <p role="status">Đang tải…</p> : null}
    {error ? <p role="alert">Không tải được báo cáo. <button onClick={() => void refetch()}>Thử lại</button></p> : null}
    {report && !error ? <>
      <p>{date(report.createdAt)} · {report.enrollmentId ? "Đăng ký định kỳ" : "Lượt đặt"}</p>
      <p className="break-all">{report.enrollmentId ?? report.bookingId}</p>
      <p className="whitespace-pre-wrap break-words">{report.description}</p>
      <h3 className="font-semibold">Tin nhắn liên quan</h3>
      {!report.messages.length && !loading ? <p>Không có tin nhắn trên trang này.</p> : null}
      {report.messages.map((message) => <div key={message.id} className="border-t border-line pt-2">
        <p className="whitespace-pre-wrap break-words">{date(message.createdAt)} · {message.body || "Mốc hội thoại"}</p>
        {message.senderId && !report.savedEvidence.some((item) => item.id === message.id) ? <button
          className="text-brand-700" disabled={saving.loading} onClick={() => {
            setFeedback("");
            void save({ variables: { id, messages: [message.id] } }).then(async ({ data: saved }) => {
              await refetch();
              setFeedback(saved?.saveBookingIncidentEvidence ? "Đã lưu tin nhắn." : "Tin nhắn đã được lưu hoặc không còn khả dụng.");
            }).catch(() => setFeedback("Chưa lưu được tin nhắn. Vui lòng thử lại."));
          }}>Lưu vào hồ sơ</button> : null}
      </div>)}
      <div className="flex flex-wrap gap-3">
        {before ? <button onClick={() => setBefore(undefined)}>Tin nhắn mới nhất</button> : null}
        {report.messages.length === 50 ? <button onClick={() => setBefore(report.messages.at(-1)?.id)}>Tin nhắn cũ hơn</button> : null}
      </div>
      {feedback ? <p role="status">{feedback}</p> : null}
      <h3 className="font-semibold">Tin nhắn đã lưu ({report.savedEvidence.length})</h3>
      {report.savedEvidence.map((message) => <p key={message.id} className="whitespace-pre-wrap break-words">
        {date(message.createdAt)} · {message.body}
      </p>)}
    </> : null}
  </section>;
}

export function ConversationReports() {
  const [before, setBefore] = useState<string>();
  const [selected, setSelected] = useState<string>();
  const { data, loading, error, refetch } = useQuery<{ adminBookingIncidentReports: Row[] }>(LIST, {
    variables: { before }, fetchPolicy: "network-only",
  });
  const rows = data?.adminBookingIncidentReports ?? [];
  return <div className="grid items-start gap-4 xl:grid-cols-2">
    <section className={card}>
      <h2 className="font-bold">Báo cáo hội thoại</h2>
      {loading ? <p role="status">Đang tải…</p> : null}
      {error ? <p role="alert">Không tải được danh sách. <button onClick={() => void refetch()}>Thử lại</button></p> : null}
      {!rows.length && !loading && !error ? <p>Không có báo cáo trên trang này.</p> : null}
      {rows.map((row) => <button key={row.id} aria-pressed={selected === row.id} onClick={() => setSelected(row.id)}
        className="block w-full border-t border-line py-2 text-left">
        <span className="block font-semibold text-brand-700">{row.enrollmentId ? "Đăng ký định kỳ" : "Lượt đặt"} · {date(row.createdAt)}</span>
        <span className="line-clamp-2 break-words">{row.description}</span>
      </button>)}
      <div className="flex gap-3">
        {before ? <button onClick={() => setBefore(undefined)}>Trang đầu</button> : null}
        {rows.length === 20 ? <button onClick={() => setBefore(rows.at(-1)?.id)}>Trang sau</button> : null}
      </div>
    </section>
    {selected ? <ConversationDetail key={selected} id={selected} /> : null}
  </div>;
}
