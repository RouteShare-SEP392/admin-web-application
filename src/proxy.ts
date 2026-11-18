import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/config";

/**
 * Chặn sớm theo sự tồn tại của cookie phiên. Việc xác thực JWT thật sự do
 * backend thực hiện ở mỗi request GraphQL (xem app/api/graphql/route.ts).
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const hasSession = !!token && !token.startsWith("mock:");
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|mock/).*)"],
};
