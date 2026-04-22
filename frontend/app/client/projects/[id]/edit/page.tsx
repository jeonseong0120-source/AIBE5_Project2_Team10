// @/app/client/projects/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import api from "@/app/lib/axios";
import { useParams, useRouter } from "next/navigation";
import ProjectEditContent from "@/components/project/ProjectEditContent";

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
        <div className="min-h-screen bg-zinc-50 relative">
            <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto no-scrollbar rounded-[2rem]">
                    <ProjectEditContent
                        projectId={id}
                        initialData={initialData}
                        embedded
                        onClose={() => router.back()}
                        onSaved={() => router.push("/client/dashboard")}
                    />
                </div>
            </div>
        </div>
    );
}