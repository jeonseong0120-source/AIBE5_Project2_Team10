"use client"; // [필수] 클라이언트 전용 기능을 쓰기 위해 추가

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "./lib/axios"; // axios 인스턴스 경로 확인!

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("accessToken");
      console.log("1. 토큰 확인:", token); // 토큰이 있는지 확인

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/v1/users/me");
        console.log("2. 서버 응답 데이터:", res.data.role); // 역할(role)이 어떻게 오는지 확인

        const currentRole = res.data.role;
        if (currentRole === "ROLE_GUEST" || currentRole === "GUEST") {
          console.log("신입 요원 감지! 온보딩 페이지로 강제 배송합니다.");
          router.push("/onboarding");
          return;
        }

        setUser(res.data);
      } catch (err: any) {
        console.error("4. 에러 발생:", err.response?.status, err.message);
        // 만약 여기서 403이 나면 백엔드 SecurityConfig 설정 문제일 확률 99%
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  // 로딩 중일 때 잠깐 보여줄 화면
  if (loading) return <div className="flex min-h-screen items-center justify-center font-black">기지 보안 스캔 중...</div>;

  return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
          <Image
              className="dark:invert"
              src="/next.svg"
              alt="Next.js logo"
              width={100}
              height={20}
              priority
          />

          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            {/* 로그인 상태에 따라 메시지 변경 */}
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              {user ? `${user.nickname} 회원님, 환영합니다 오늘 기분은 어떠신가요?` : "To get started, edit the page.tsx file."}
            </h1>

            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              {user ? `당신의 현재 역할은 [${user.role}] 입니다. 이제 업무를 시작할 수 있습니다.` : "Looking for a starting point or more instructions? Head over to Templates or the Learning center."}
            </p>
          </div>

          <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
            {/* 유저가 없을 때만 로그인 버튼 보여주기 (예시) */}
            {!user && (
                <a
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                    href="/login"
                >
                  로그인하기
                </a>
            )}

            <a
                className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
                href="https://nextjs.org/docs"
                target="_blank"
                rel="noopener noreferrer"
            >
              Documentation
            </a>

            {/* 로그아웃 버튼 (로그인 시에만 노출) */}
            {user && (
                <button
                    onClick={() => { localStorage.removeItem("accessToken"); window.location.reload(); }}
                    className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-red-100 px-5 text-red-500 hover:bg-red-50 md:w-[158px]"
                >
                  로그아웃
                </button>
            )}
          </div>
        </main>
      </div>
  );
}