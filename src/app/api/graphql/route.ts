import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  BACKEND_GRAPHQL_URL,
  SESSION_COOKIE,
} from "@/server/config";
interface GraphQLRequestBody {
  query: string;
  variables?: Record<string, unknown> | null;
  operationName?: string | null;
}

interface BackendError {
  message?: string;
  extensions?: { code?: string; status?: number };
}

function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json(
    { errors: [{ message, extensions: { code } }] },
    { status },
  );
}

function sessionExpired() {
  const response = errorResponse(
    "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    401,
    "UNAUTHENTICATED",
  );
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

/**
 * Cổng GraphQL duy nhất của admin web: gắn JWT từ cookie httpOnly rồi chuyển
   * tiếp sang backend.
 */
export async function POST(request: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.startsWith("mock:")) return sessionExpired();

  let body: GraphQLRequestBody;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Yêu cầu không hợp lệ.", 400, "BAD_REQUEST");
  }
  if (typeof body?.query !== "string") {
    return errorResponse("Yêu cầu không hợp lệ.", 400, "BAD_REQUEST");
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(BACKEND_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return errorResponse(
      "Không kết nối được máy chủ RouteShare. Vui lòng thử lại sau.",
      502,
      "BACKEND_UNAVAILABLE",
    );
  }

  const payload = await backendResponse.json().catch(() => null);
  if (!payload) {
    return errorResponse(
      "Máy chủ RouteShare trả về dữ liệu không hợp lệ.",
      502,
      "BACKEND_UNAVAILABLE",
    );
  }

  const errors: BackendError[] = Array.isArray(payload.errors) ? payload.errors : [];
  const unauthenticated = errors.some(
    (e) => e.extensions?.status === 401 || e.extensions?.code === "UNAUTHENTICATED",
  );
  if (backendResponse.status === 401 || unauthenticated) return sessionExpired();

  return NextResponse.json(payload);
}
