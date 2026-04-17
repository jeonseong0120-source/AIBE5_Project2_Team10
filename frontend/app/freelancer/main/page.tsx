"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** 온보딩 등에서 사용하는 경로를 실제 화면으로 연결합니다. */
export default function FreelancerMainRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/freelancer/explore");
    }, [router]);
    return (
        <p className="p-8 text-center text-sm text-zinc-500" aria-live="polite">
            이동 중…
        </p>
    );
}
