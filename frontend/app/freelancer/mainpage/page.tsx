"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FreelancerMainpageRedirect() {
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
