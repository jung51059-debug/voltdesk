import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { REGION_HEADER, regionFromPathname } from "@/lib/region/config";
import { usAccessDecision,usRuntimeMode } from '@/lib/us/release-gate';

/**
 * Normalizes region headers from the request path. Root layouts use fixed regions.
 * No IP or Accept-Language redirects.
 */
export const PATH_HEADER = "x-ampory-pathname";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const access=usAccessDecision(pathname,usRuntimeMode());
  if(access.isUs&&!access.allowed)return new NextResponse('Not found',{status:404,headers:{'X-Robots-Tag':'noindex, nofollow','Cache-Control':'private, no-store','Content-Type':'text/plain; charset=utf-8'}});
  const region = regionFromPathname(pathname);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REGION_HEADER, region);
  requestHeaders.set(PATH_HEADER, pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
