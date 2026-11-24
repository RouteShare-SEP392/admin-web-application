"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";

export const CATALOG = gql`
  query AdminSupportCatalog {
    adminSupportCatalog {
      topics {
        key
        label
        sortOrder
        enabled
      }
      issues {
        key
        label
        sortOrder
        enabled
        topicKey
        prompt
        audience
        bookingRequirement
        answerRequired
        tripWide
        priority
      }
    }
  }
`;
const SAVE_TOPIC = gql`
  mutation SaveSupportTopic($input: SaveSupportTopicInput!) {
    saveSupportTopic(input: $input) {
      key
    }
  }
`;
const SAVE_ISSUE = gql`
  mutation SaveSupportIssue($input: SaveSupportIssueInput!) {
    saveSupportIssue(input: $input) {
      key
    }
  }
`;

type Topic = {
  key: string;
  label: string;
  sortOrder: number;
  enabled: boolean;
};
type Issue = Topic & {
  topicKey: string;
  prompt: string;
  audience: string;
  bookingRequirement: string;
  answerRequired: boolean;
  tripWide: boolean;
  priority: number;
};
export type Catalog = { topics: Topic[]; issues: Issue[] };
const EMPTY_TOPIC: Topic = { key: "", label: "", sortOrder: 0, enabled: true };
const EMPTY_ISSUE: Issue = {
  ...EMPTY_TOPIC,
  topicKey: "",
  prompt: "",
  audience: "BOTH",
  bookingRequirement: "CONFIRMED_HISTORY",
  answerRequired: false,
  tripWide: false,
  priority: 0,
};
const field = "mt-1 block w-full rounded-xl border border-line bg-white p-2";

export function CatalogEditor() {
  const { data, loading, error, refetch } = useQuery<{
    adminSupportCatalog: Catalog;
  }>(CATALOG, { fetchPolicy: "network-only" });
  const [saveTopic, topicState] = useMutation(SAVE_TOPIC);
  const [saveIssue, issueState] = useMutation(SAVE_ISSUE);
  const [editing, setEditing] = useState<{
    kind: "topic" | "issue";
    existing: boolean;
    topic: Topic;
    issue: Issue;
  }>();
  const [feedback, setFeedback] = useState("");
  const topics = data?.adminSupportCatalog.topics ?? [];
  const issues = data?.adminSupportCatalog.issues ?? [];
  const editTopic = (topic?: Topic) => {
    setFeedback("");
    const { key, label, sortOrder, enabled } = topic ?? EMPTY_TOPIC;
    setEditing({
      kind: "topic",
      existing: Boolean(topic),
      topic: { key, label, sortOrder, enabled },
      issue: EMPTY_ISSUE,
    });
  };
  const editIssue = (issue?: Issue, topicKey = topics[0]?.key ?? "") => {
    setFeedback("");
    const draft = issue ?? { ...EMPTY_ISSUE, topicKey };
    const {
      key,
      label,
      sortOrder,
      enabled,
      prompt,
      audience,
      bookingRequirement,
      answerRequired,
      tripWide,
      priority,
    } = draft;
    setEditing({
      kind: "issue",
      existing: Boolean(issue),
      topic: { key, label, sortOrder, enabled },
      issue: {
        key,
        label,
        sortOrder,
        enabled,
        topicKey: draft.topicKey,
        prompt,
        audience,
        bookingRequirement,
        answerRequired,
        tripWide,
        priority,
      },
    });
  };
  const busy = topicState.loading || issueState.loading;
  const entry = editing?.topic;
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <section className="space-y-3 rounded-2xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Chủ đề và vấn đề</h2>
          <button className="text-brand-700" onClick={() => editTopic()}>
            Thêm chủ đề
          </button>
        </div>
        {loading ? <p role="status">Đang tải danh mục…</p> : null}
        {error ? (
          <p role="alert">
            Không tải được danh mục.{" "}
            <button onClick={() => void refetch()}>Thử lại</button>
          </p>
        ) : null}
        {topics.map((topic) => (
          <div className="space-y-2 border-t border-line pt-3" key={topic.key}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                className="font-semibold text-brand-700"
                onClick={() => editTopic(topic)}
              >
                {topic.label}
              </button>
              <button
                className="text-sm text-brand-700"
                onClick={() => editIssue(undefined, topic.key)}
              >
                Thêm vấn đề
              </button>
            </div>
            {!topic.enabled && <p className="text-sm">Chủ đề đã tắt</p>}
            <ul className="space-y-2">
              {issues
                .filter((item) => item.topicKey === topic.key)
                .map((item) => (
                  <li key={item.key}>
                    <button
                      className="text-left"
                      onClick={() => editIssue(item)}
                    >
                      {item.label}
                      {item.enabled ? "" : " · Đã tắt"}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>
      {editing && entry ? (
        <form
          className="space-y-3 rounded-2xl border border-line bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (busy) return;
            const records = editing.kind === "topic" ? topics : issues;
            if (
              !editing.existing &&
              records.some((item) => item.key === entry.key)
            ) {
              setFeedback("Mã đã được sử dụng. Vui lòng chọn mã khác.");
              return;
            }
            const action =
              editing.kind === "topic"
                ? saveTopic({ variables: { input: entry } })
                : saveIssue({
                    variables: { input: { ...editing.issue, ...entry } },
                  });
            void action
              .then(async () => {
                await refetch();
                setFeedback("Đã lưu danh mục.");
                setEditing(undefined);
              })
              .catch(() =>
                setFeedback("Chưa lưu được. Hãy kiểm tra cấu hình và thử lại."),
              );
          }}
        >
          <h2 className="text-lg font-bold">
            {editing.existing ? "Sửa" : "Thêm"}{" "}
            {editing.kind === "topic" ? "chủ đề" : "vấn đề"}
          </h2>
          <label className="block">
            Mã
            <input
              required
              disabled={editing.existing}
              pattern="[a-z0-9_]{1,80}"
              className={field}
              value={entry.key}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  topic: { ...entry, key: e.target.value },
                })
              }
            />
          </label>
          <label className="block">
            Tên hiển thị
            <input
              required
              maxLength={120}
              className={field}
              value={entry.label}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  topic: { ...entry, label: e.target.value },
                })
              }
            />
          </label>
          <label className="block">
            Thứ tự
            <input
              required
              type="number"
              min={0}
              className={field}
              value={entry.sortOrder}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  topic: { ...entry, sortOrder: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="block">
            <input
              type="checkbox"
              checked={entry.enabled}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  topic: { ...entry, enabled: e.target.checked },
                })
              }
            />{" "}
            Đang bật
          </label>
          {editing.kind === "issue" ? (
            <IssueFields
              issue={editing.issue}
              topics={topics}
              change={(issue) => setEditing({ ...editing, issue })}
            />
          ) : null}
          <button
            className="rounded-xl bg-brand-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
            disabled={busy}
          >
            Lưu
          </button>
          <button
            type="button"
            className="ml-3"
            onClick={() => setEditing(undefined)}
          >
            Hủy
          </button>
        </form>
      ) : null}
      {feedback && <p role="status">{feedback}</p>}
    </div>
  );
}

function IssueFields({
  issue,
  topics,
  change,
}: {
  issue: Issue;
  topics: Topic[];
  change: (issue: Issue) => void;
}) {
  const safety = issue.topicKey === "safety";
  return (
    <>
      <label className="block">
        Chủ đề
        <select
          className={field}
          value={issue.topicKey}
          onChange={(e) => {
            const topicKey = e.target.value;
            change({
              ...issue,
              topicKey,
              tripWide: false,
              answerRequired:
                topicKey === "safety" ? false : issue.answerRequired,
              priority: topicKey === "safety" ? 1 : 0,
            });
          }}
        >
          {topics.map((topic) => (
            <option key={topic.key} value={topic.key}>
              {topic.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Câu hỏi gợi ý
        <input
          className={field}
          maxLength={300}
          value={issue.prompt}
          onChange={(e) => change({ ...issue, prompt: e.target.value })}
        />
      </label>
      <label className="block">
        Ai thấy vấn đề
        <select
          className={field}
          value={issue.audience}
          onChange={(e) =>
            change({
              ...issue,
              audience: e.target.value,
              tripWide: e.target.value === "PASSENGER" ? false : issue.tripWide,
            })
          }
        >
          <option value="BOTH">Cả hai</option>
          <option value="PASSENGER">Hành khách</option>
          <option value="DRIVER">Tài xế</option>
        </select>
      </label>
      <label className="block">
        Điều kiện lượt đặt
        <select
          className={field}
          value={issue.bookingRequirement}
          onChange={(e) =>
            change({
              ...issue,
              bookingRequirement: e.target.value,
              tripWide: false,
            })
          }
        >
          <option value="CONFIRMED_HISTORY">Từng xác nhận</option>
          <option value="BOARD">Đã xác nhận lên xe</option>
          <option value="ABSENCE">Đã ghi vắng mặt</option>
        </select>
      </label>
      <label className="block">
        <input
          type="checkbox"
          disabled={safety}
          checked={issue.answerRequired}
          onChange={(e) =>
            change({ ...issue, answerRequired: e.target.checked })
          }
        />{" "}
        Bắt buộc trả lời
      </label>
      <label className="block">
        <input
          type="checkbox"
          disabled={
            !safety ||
            issue.audience === "PASSENGER" ||
            issue.bookingRequirement !== "CONFIRMED_HISTORY"
          }
          checked={issue.tripWide}
          onChange={(e) => change({ ...issue, tripWide: e.target.checked })}
        />{" "}
        Tài xế có thể báo cho cả chuyến
      </label>
      <label className="block">
        <input
          type="checkbox"
          disabled={safety}
          checked={issue.priority === 1}
          onChange={(e) =>
            change({ ...issue, priority: e.target.checked ? 1 : 0 })
          }
        />{" "}
        Ưu tiên
      </label>
    </>
  );
}
