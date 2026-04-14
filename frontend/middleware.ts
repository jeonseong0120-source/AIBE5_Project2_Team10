import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. 쿠키나 헤더가 아닌, 클라이언트에서 토큰을 어떻게 넘기는지에 따라 다름.
  // 현재 구조상 accessToken을 localStorage에 저장하고 있으므로, 
  // Next.js middleware(서버 사이드)에서는 localStorage를 직접 읽을 수 없습니다!
  // 따라서 클라이언트 사이드(브라우저)에서 각 페이지 렌더링 시 권한을 체크하거나,
  // 로그인 시 토큰을 쿠키(Cookie)에도 저장하도록 변경해야 완벽한 미들웨어 제어가 가능합니다.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};