"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/app/lib/axios";
import ProjectEditForm, { type ProjectEditInitialData } from "@/components/project/ProjectEditForm";

type ProjectDetailResponse = {
    projectId: number;
    projectName: string;
    budget: number;
    deadline: string;
    detail: string;
    online: boolean;
    offline: boolean;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    skills?: string[];
};

function toInitialForm(data: ProjectDetailResponse): ProjectEditInitialData {
    return {
        projectName: data.projectName,
        budget: data.budget,
        deadline: data.deadline,
        detail: data.detail ?? "",
        online: data.online,
        offline: data.offline,
        location: data.location ?? "",
        latitude: data.latitude == null ? "" : String(data.latitude),
        longitude: data.longitude == null ? "" : String(data.longitude),
        skillNames: data.skills ?? [],
    };
}

export default function ClientProjectEditPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [initialData, setInitialData] = useState<ProjectEditInitialData | null>(null);

    useEffect(() => {
        const gateAndLoad = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                router.replace("/login");
                return;
            }

            try {
                const me = await api.get("/v1/users/me");
                const role = me.data.role as string;
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
                return;
            }

            try {
                const projectRes = await api.get<ProjectDetailResponse>(`/v1/projects/${id}`);
                setInitialData(toInitialForm(projectRes.data));
            } catch {
                setError("프로젝트 정보를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            void gateAndLoad();
        }
    }, [id, router]);

    if (!ready || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-mono text-sm font-bold text-zinc-500">
                LOADING…
            </div>
        );
    }

    if (error || !initialData) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6">
                <p className="text-center text-red-600">{error ?? "데이터가 없습니다."}</p>
                <button
                    type="button"
                    onClick={() => router.push(`/client/projects/${id}`)}
                    className="rounded-xl bg-zinc-900 px-5 py-2 text-sm font-bold text-white"
                >
                    상세로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 py-12 px-4">
            <ProjectEditForm projectId={id} initialData={initialData} />
        </div>
    );
}
