"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OAuthRedirect() {
    const router = useRouter();

    useEffect(() => {
        // 1. 주소창의 # 뒤에 있는 값(Fragment)을 가져옴
        const hash = window.location.hash;

        if (hash && hash.includes("token=")) {
            // 2. "token=" 뒤의 문자열(JWT)만 추출
            const token = hash.split("token=")[1];

            // 3. 브라우저의 로컬 스토리지에 저장
            localStorage.setItem("accessToken", token);

            console.log("✅ 소셜 로그인 성공 토큰 저장 완료");

            // 4. 메인 화면으로 이동
            router.push("/");
        } else {
            console.error("❌ 토큰을 찾을 수 없습니다.");
            router.push("/login?error=token_missing");
        }
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