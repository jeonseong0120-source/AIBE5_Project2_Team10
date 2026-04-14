"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/axios";

export default function OAuthRedirect() {
    const router = useRouter();

    useEffect(() => {
        const processLogin = async () => {
            // 1. 주소창의 # 뒤에 있는 값(Fragment)을 가져옴
            const hash = window.location.hash;

            if (hash) {
                // 2. URLSearchParams를 활용하여 더욱 안전하게 "token" 추출
                const params = new URLSearchParams(hash.slice(1));
                const token = params.get("token");

                if (token) {
                    // 3. 브라우저의 로컬 스토리지에 저장
                    localStorage.setItem("accessToken", token);
                    console.log("✅ 소셜 로그인 성공 토큰 저장 완료");

                    try {
                        // [추가] 토큰 저장 후 즉시 역할을 확인하여 맞춤형 라우팅 진행
                        const res = await api.get("/v1/users/me");
                        const role = res.data.role;

                        if (role === "GUEST" || role === "ROLE_GUEST") {
                            router.replace("/onboarding");
                        } else if (role === "CLIENT" || role === "BOTH" || role === "ROLE_CLIENT" || role === "ROLE_BOTH") {
                            // [요청 반영] 클라이언트나 겸업 유저는 바로 대시보드로 꽂아줍니다!
                            router.replace("/dashboard");
                        } else {
                            // 프리랜서는 메인 페이지나 프로젝트 목록으로 이동
                            router.replace("/");
                        }
                    } catch (err) {
                        console.error("권한 정보 로드 실패", err);
                        router.replace("/");
                    }
                } else {
                    console.error("❌ 토큰을 찾을 수 없습니다.");
                    router.replace("/login?error=token_missing");
                }
            } else {
                console.error("❌ 해시 프래그먼트를 찾을 수 없습니다.");
                router.replace("/login?error=invalid_redirect");
            }
        };

        processLogin();
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="p-8 bg-white shadow-xl rounded-2xl flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-lg font-semibold text-gray-700">보안 인증 처리 중...</p>
                <p className="text-sm text-gray-400 mt-2">잠시만 기다려 주세요</p>
            </div>
        </div>
    );
}
