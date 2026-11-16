"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

    </form>
  );
}
