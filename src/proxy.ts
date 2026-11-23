import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth redirect (FE-15). The API sets a non-sensitive `mandy_session=1` cookie next to the
 * httpOnly tokens; the real check is the API answering 401, which the client handles by refreshing.
 */
const AUTH_PAGES = ["/unlock", "/setup", "/recover"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = request.cookies.get("mandy_session")?.value === "1";
  const onAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!signedIn && !onAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/unlock";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // A signed-in user has nothing to unlock or recover: send them on.
  if (signedIn && onAuthPage) {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.pathname = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except the API rewrite, Next internals, static files and the dev styleguide.
  matcher: [
    "/((?!api/|_next/|styleguide|favicon.ico|icon|apple-icon|manifest.webmanifest|opengraph-image|offline|.*\\.[\\w]+$).*)",
  ],
};
