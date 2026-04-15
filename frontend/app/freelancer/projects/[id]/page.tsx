'use client';

import React, { useEffect, useState } from 'react';
import api from '@/app/lib/axios'; // axios 인스턴스 가져오기
import { useParams } from 'next/navigation';

// 백엔드에서 받아올 프로젝트 데이터 타입 정의
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
    location: string;
    latitude: number;
    longitude: number;
    skills: string[];
}

export default function ProjectDetailPage() {
    // Next.js 클라이언트 컴포넌트에서 params 가져오기
    const params = useParams();
    const id = params?.id as string;

    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjectDetail = async () => {
            if (!id) return;
            
            try {
                // 백엔드 API 호출
                const response = await api.get(`/v1/projects/${id}`);
                setProject(response.data);
            } catch (err: any) {
                console.error("프로젝트 상세 조회 실패:", err);
                setError("프로젝트 정보를 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchProjectDetail();
    }, [id]);

    // 💰 금액 포맷팅 함수
    const formatBudget = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
    }

    if (error || !project) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">{error || "프로젝트를 찾을 수 없습니다."}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* 1. 헤더 영역 */}
            <section className="border-b pb-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
                        {project.status === 'OPEN' ? '모집 중' : project.status}
                    </span>
                    <span className="text-gray-500 text-sm">회사명: {project.companyName}</span>
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{project.projectName}</h1>
                <p className="text-gray-600">{project.location}</p>
            </section>

            {/* 2. 핵심 요약 정보 (Grid) */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-xl">
                <div>
                    <p className="text-gray-400 text-sm">예상 금액</p>
                    <p className="font-bold text-lg">{formatBudget(project.budget)}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-sm">모집 마감일</p>
                    <p className="font-bold text-lg text-red-500">{project.deadline}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-sm">작업 방식</p>
                    <p className="font-bold text-lg">
                        {project.online && project.offline ? "온/오프라인 병행" : project.online ? "원격(온라인)" : "상주(오프라인)"}
                    </p>
                </div>
                <div>
                    <p className="text-gray-400 text-sm">위치</p>
                    <p className="font-bold text-lg truncate">
                        {project.location ? project.location.split(' ')[1] || "지역 미정" : "위치 정보 없음"}
                    </p>
                </div>
            </section>

            {/* 3. 기술 스택 (Skills) */}
            <section className="space-y-3">
                <h3 className="text-xl font-bold">요구 기술 스택</h3>
                <div className="flex flex-wrap gap-2">
                    {project.skills && project.skills.length > 0 ? (
                        project.skills.map((skill, index) => (
                            <span
                                key={index}
                                className="bg-gray-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
                            >
                                {skill}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-500">등록된 기술 스택이 없습니다.</span>
                    )}
                </div>
            </section>

            {/* 4. 프로젝트 상세 내용 */}
            <section className="space-y-3">
                <h3 className="text-xl font-bold">상세 설명</h3>
                <div className="bg-white border p-6 rounded-xl leading-relaxed text-gray-800 whitespace-pre-wrap">
                    {project.detail}
                </div>
            </section>

            {/* 5. 하단 액션 버튼 */}
            <div className="flex justify-center pt-10">
                <button className="w-full md:w-64 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg">
                    이 프로젝트에 지원하기
                </button>
            </div>
        </div>
    );
}
