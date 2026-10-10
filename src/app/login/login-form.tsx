"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { MOCK_ADMIN_CREDENTIALS, resolveMockMode } from "@/lib/mock-mode";

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const showDemoAccount = resolveMockMode() === "all";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      if (response.ok) {
        // Tải lại toàn trang để proxy đọc cookie phiên vừa được đặt.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/");
        return;
      }
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Đăng nhập thất bại. Vui lòng thử lại.");
    } catch {
      setError("Không kết nối được máy chủ. Vui lòng thử lại.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Email hoặc số điện thoại" htmlFor="identifier">
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
          autoFocus
        />
      </Field>
      <Field label="Mật khẩu" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </Field>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={submitting || !identifier.trim() || !password}
      >
        {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>

      {showDemoAccount ? (
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-900">
          <p className="font-semibold">Đang chạy bằng dữ liệu mẫu</p>
          <p className="mt-1">
            Tài khoản: <code className="font-semibold">{MOCK_ADMIN_CREDENTIALS.identifier}</code>
            <br />
            Mật khẩu: <code className="font-semibold">{MOCK_ADMIN_CREDENTIALS.password}</code>
          </p>
          <button
            type="button"
            className="mt-2 font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900"
            onClick={() => {
              setIdentifier(MOCK_ADMIN_CREDENTIALS.identifier);
              setPassword(MOCK_ADMIN_CREDENTIALS.password);
            }}
          >
            Điền sẵn tài khoản mẫu
          </button>
        </div>
      ) : null}
    </form>
  );
}
