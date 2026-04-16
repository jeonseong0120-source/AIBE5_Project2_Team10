"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProjectRegisterForm from "@/components/project/ProjectRegisterForm";
import api from "@/app/lib/axios";

export default function ClientProjectNewPage() {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const gate = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                router.replace("/login");
                return;
            }
            try {
                const res = await api.get("/v1/users/me");
                const role = res.data.role as string;
                if (role === "GUEST" || role === "ROLE_GUEST") {
                        router.replace("/onboarding");
                        return;
                }
                if (role === "FREELANCER" || role === "ROLE_FREELANCER") {
                    router.replace("/");
                    return;
                }
                setReady(true);
            } catch {
                router.replace("/login");
            }
        };
        void gate();
    }, [router]);

    if (!ready) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-mono text-sm font-bold text-zinc-500">
                LOADING…
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 py-12 px-4">
            <ProjectRegisterForm />
        </div>
    );
}
