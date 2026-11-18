import { NextResponse } from "next/server";
import {
  BACKEND_GRAPHQL_URL,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/server/config";

const SIGN_IN_MUTATION = /* GraphQL */ `
  mutation AdminSignIn($input: SignInInput!) {
    signIn(input: $input) {
      accessToken
      user {
        id
        role
        status
      }
    }
  }
`;

interface SignInResult {
  token: string | null;
  role: string | null;
  status: string | null;
  error: string | null;
  httpStatus: number;
}

function fail(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

async function signInBackend(
  identifier: string,
  password: string,
): Promise<SignInResult> {
  const empty = { token: null, role: null, status: null };
  let payload;
  try {
    const response = await fetch(BACKEND_GRAPHQL_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: SIGN_IN_MUTATION,
        variables: { input: { identifier, password } },
      }),
      cache: "no-store",
    });
    payload = await response.json();
  } catch {
    return {
      ...empty,
      error: "Không kết nối được máy chủ RouteShare. Vui lòng thử lại sau.",
      httpStatus: 502,
    };
  }

  const result = payload?.data?.signIn;
  if (!result?.accessToken || !result.user) {
    return {
      ...empty,
      error:
        payload?.errors?.[0]?.message ??
        "Email/số điện thoại hoặc mật khẩu không đúng.",
      httpStatus: 401,
    };
  }
  return {
    token: result.accessToken,
    role: result.user.role,
    status: result.user.status,
    error: null,
    httpStatus: 200,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!identifier || !password) {
    return fail("Vui lòng nhập đầy đủ thông tin đăng nhập.", 400);
  }

  const result = await signInBackend(identifier, password);

  if (!result.token) return fail(result.error ?? "Đăng nhập thất bại.", result.httpStatus);
  if (result.role !== "ADMIN") {
    return fail("Tài khoản này không có quyền truy cập trang quản trị.", 403);
  }
  if (result.status !== "ACTIVE") {
    return fail("Tài khoản quản trị này đang bị khoá.", 403);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
