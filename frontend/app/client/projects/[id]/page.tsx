"use client";

import { useEffect, useState } from "react";
import api from "@/app/lib/axios";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Calendar, DollarSign, Globe, MapPin } from "lucide-react";

interface ProjectDetail {
    projectId: number;
    companyName: string;
    projectName: string;
    budget: number;
    deadline: string;
    detail: string;
    status: string;
    online: boolean;
    offline: boolean;
    location: string | null;
    skills: string[];
}

export default function ClientProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                const { data } = await api.get<ProjectDetail>(`/v1/projects/${id}`);
                setProject(data);
            } catch {
                setError("프로젝트를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        void fetchDetail();
    }, [id]);

    const formatBudget = (amount: number) =>
        new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(amount);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF7D00] border-t-transparent" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6">
                <p className="text-center text-red-600">{error ?? "데이터가 없습니다."}</p>
                <button
                    type="button"
                    onClick={() => router.push("/client/dashboard")}
                    className="rounded-xl bg-zinc-900 px-5 py-2 text-sm font-bold text-white"
                >
                    대시보드로
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 pb-16">
            <nav className="border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur">
                <button
                    type="button"
                    onClick={() => router.push("/client/dashboard")}
                    className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600 hover:text-zinc-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    대시보드
                </button>
            </nav>

            <main className="mx-auto max-w-3xl px-6 py-10">
                <p className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-[#FF7D00]">등록 완료</p>
                <h1 className="mb-6 text-3xl font-black text-zinc-900">{project.projectName}</h1>

                <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
                    <span className="inline-flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {project.companyName}
                    </span>
                    {project.location ? (
                        <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {project.location}
                        </span>
                    ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-zinc-400">
                            <DollarSign className="h-4 w-4" /> 예산
                        </div>
                        <p className="text-xl font-black text-zinc-900">{formatBudget(project.budget)}</p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-zinc-400">
                            <Calendar className="h-4 w-4" /> 마감
                        </div>
                        <p className="text-xl font-black text-zinc-900">{String(project.deadline)}</p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:col-span-2">
                        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-zinc-400">
                            <Globe className="h-4 w-4" /> 근무 방식
                        </div>
                        <p className="text-lg font-bold text-zinc-900">
                            {project.online && project.offline
                                ? "온·오프라인"
                                : project.online
                                  ? "온라인"
                                  : project.offline
                                    ? "오프라인"
                                    : "미지정"}
                        </p>
                    </div>
                </div>

                {project.skills?.length ? (
                    <section className="mt-8">
                        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-zinc-500">스킬</h2>
                        <div className="flex flex-wrap gap-2">
                            {project.skills.map((s) => (
                                <span key={s} className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-zinc-800 ring-1 ring-zinc-200">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </section>
                ) : null}

                <section className="mt-8">
                    <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-zinc-500">상세</h2>
                    <div className="whitespace-pre-wrap rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-700 shadow-sm">
                        {project.detail || "내용 없음"}
                    </div>
                </section>
            </main>
        </div>
    );
}
