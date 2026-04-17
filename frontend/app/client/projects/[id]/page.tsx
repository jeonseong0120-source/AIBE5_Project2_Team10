"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/** 상세 전용 UI는 `edit`에 있으므로 기본 경로는 편집 화면으로 보냅니다. */
export default function ClientProjectIdPage() {
    const params = useParams();
    const router = useRouter();

    useEffect(() => {
        const raw = params.id;
        const id = Array.isArray(raw) ? raw[0] : raw;
        if (id) {
            router.replace(`/client/projects/${id}/edit`);
        }
    }, [params, router]);

    return (
        <p className="p-8 text-center text-sm text-zinc-500" aria-live="polite">
            이동 중…
        </p>
    );
}
