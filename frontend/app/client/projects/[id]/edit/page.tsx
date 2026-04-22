// @/app/client/projects/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import api from "@/app/lib/axios";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProjectEditForm from "@/components/project/ProjectEditForm";

export default function ClientProjectEditPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                const { data } = await api.get(`/v1/projects/${id}`);

                // 🔍 [수정] 백엔드의 'skills' 필드를 'skillNames'로 변환하여 전달
                const mappedData = {
                    ...data,
                    skillNames: data.skills || [], // 이름 통일
                };

                setInitialData(mappedData);
            } catch (err) {
                alert("데이터 로드 실패 (404/500)");
                router.push("/client/dashboard");
            } finally { setLoading(false); }
        };
        fetchDetail();
    }, [id, router]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center font-black text-[#FF7D00] animate-pulse">
            BOOTING_EDIT_SYSTEM...
        </div>
    );
    if (!initialData) return null;

    return (
        <div className="min-h-screen bg-zinc-50/50">
            <nav className="sticky top-0 z-50 p-6 bg-zinc-50/90 backdrop-blur-md border-b border-zinc-200/70">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-black text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-[0.2em]">
                    <ArrowLeft size={16} /> Back_to_Dash
                </button>
            </nav>
            <main className="px-6 pb-20">
                <ProjectEditForm projectId={id} initialData={initialData} />
            </main>
        </div>
    );
}