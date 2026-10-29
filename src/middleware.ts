import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/auth/session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected route prefixes
  const isPlatformRoute = pathname.startsWith("/platform");
  const isInstitutionRoute = pathname.startsWith("/institution");
  const isTeacherRoute = pathname.startsWith("/teacher");
  const isStudentRoute = pathname.startsWith("/student");

  if (!isPlatformRoute && !isInstitutionRoute && !isTeacherRoute && !isStudentRoute) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const session = JSON.parse(sessionCookie);

    // Super Admin has cross-portal access
    if (session.isSuperAdmin || session.role === "SUPER_ADMIN") {
      return NextResponse.next();
    }

    // Role-specific route boundaries
    if (isPlatformRoute && session.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized?reason=platform_admin_only", request.url));
    }

    if (isInstitutionRoute && session.role !== "INSTITUTION_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized?reason=institution_admin_only", request.url));
    }

    if (isTeacherRoute && session.role !== "TEACHER" && session.role !== "INSTITUTION_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized?reason=faculty_only", request.url));
    }

    if (isStudentRoute && session.role !== "STUDENT") {
      return NextResponse.redirect(new URL("/unauthorized?reason=students_only", request.url));
    }

    return NextResponse.next();
  } catch {
    // Corrupt cookie, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/platform/:path*",
    "/institution/:path*",
    "/teacher/:path*",
    "/student/:path*",
  ],
};
