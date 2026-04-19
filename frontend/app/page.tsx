"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "./lib/axios";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/v1/users/me");
        const currentRole = res.data.role;

        // 1. 게스트는 온보딩으로
        if (currentRole === "ROLE_GUEST" || currentRole === "GUEST") {
          router.push("/onboarding");
          return;
        }

        // [수정] 메인 페이지에서도 CLIENT나 BOTH 권한이면 즉시 대시보드로 이동시킵니다!
        if (currentRole === "CLIENT" || currentRole === "BOTH" || currentRole === "ROLE_CLIENT" || currentRole === "ROLE_BOTH") {
          router.replace("/client/dashboard");
          return;
        }

        setUser(res.data);
      } catch (err: any) {
        console.error("Auth Check Error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (loading) return (
      <div className="flex min-h-screen items-center justify-center bg-white font-black text-[#FF7D00] text-xl animate-pulse">
        DevNear 기지 보안 스캔 중...
      </div>
  );

  return (
      <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-[#FF7D00]/30">
        {/* 네비게이션 바 (간결하게) */}
        <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
          <div className="text-2xl font-black tracking-tighter text-[#FF7D00]">
            <img
                src="/devnear-logo.png" 
                alt="DevNear_Logo"
                className="h-8 w-auto object-contain inline-block mr-2" 
            />
            DevNear
          </div>
          <div className="flex gap-8 items-center font-medium text-zinc-600">
            <a href="#" className="hover:text-black transition-colors text-sm">프로젝트 찾기</a>
            <a href="#" className="hover:text-black transition-colors text-sm">프리랜서 찾기</a>
            {!user && (
                <a href="/login" className="px-5 py-2 bg-black text-white rounded-full text-sm font-semibold hover:bg-zinc-800 transition-all">
                  시작하기
                </a>
            )}
          </div>
        </nav>

        {/* 히어로 섹션 */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-tight text-[#FF7D00] bg-[#FF7D00]/10 rounded-full animate-bounce">
            No.1 프리랜서 매칭 플랫폼
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-zinc-900 mb-8 leading-[1.1]">
            성공적인 비즈니스를 위한<br />
            <span className="text-[#FF7D00]">최적의 에이전트</span>를 만나보세요
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-zinc-500 mb-12 leading-relaxed">
            기술 스택 기반의 정교한 매칭 알고리즘으로<br />
            가장 타당한 프리랜서와 프로젝트를 단숨에 연결합니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
            {!user ? (
                <>
                  <a href="/login" className="flex-1 h-14 flex items-center justify-center bg-[#FF7D00] text-white rounded-2xl font-bold text-lg hover:bg-[#e67000] transform active:scale-95 transition-all shadow-lg shadow-[#FF7D00]/20">
                    무료로 시작하기
                  </a>
                  <a href="#" className="flex-1 h-14 flex items-center justify-center border-2 border-zinc-200 text-zinc-900 rounded-2xl font-bold text-lg hover:bg-zinc-50 transition-all">
                    서비스 둘러보기
                  </a>
                </>
            ) : (
                <a href="/client/mypage" className="flex-1 h-14 flex items-center justify-center bg-black text-white rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all">
                  내 워크스페이스로 이동
                </a>
            )}
          </div>

          {/* 하단 미니 섹션 (숫자 강조) */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24 border-t border-zinc-100 pt-16">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-black">1.2k+</span>
              <span className="text-sm text-zinc-400 font-medium">활동 중인 프리랜서</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-black">98%</span>
              <span className="text-sm text-zinc-400 font-medium">매칭 만족도</span>
            </div>
            <div className="flex flex-col items-center hidden md:flex">
              <span className="text-3xl font-black text-black">2.5b+</span>
              <span className="text-sm text-zinc-400 font-medium">총 프로젝트 예산</span>
            </div>
          </div>
        </main>

        {/* 푸터 */}
        <footer className="py-12 px-8 border-t border-zinc-100 text-center text-zinc-400 text-sm">
          &copy; 2026 DevNear. All rights reserved.
        </footer>
      </div>
  );
}
