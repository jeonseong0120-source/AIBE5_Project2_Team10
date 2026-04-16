'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import {
    User, Users, CheckCircle, XCircle, Edit,
    Trash2, Activity, DollarSign, Calendar, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 타입 정의 ---
interface UserProfile {
    name: string;
    email: string;
    role: string;
    nickname?: string;
}

export interface ProjectDto {
    projectId: number;
    projectName: string;
    status: string; // OPEN, IN_PROGRESS, CLOSED, COMPLETED
    deadline: string;
    budget: number;
    detail?: string;
    online?: boolean;
    offline?: boolean;
    location?: string;
    latitude?: number;
    longitude?: number;
    skills?: string[];
}

interface ApplicantDto {
    applicationId: number;
    freelancerId: number;
    freelancerName: string;
    matchingScore: number;
    status: string; // PENDING, ACCEPTED, REJECTED
    appliedAt: string;
}

export default function ClientDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [projects, setProjects] = useState<ProjectDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // 필터 상태 ('ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED')
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    // 지원자 모달 상태
    const [selectedProjectForApplicant, setSelectedProjectForApplicant] = useState<ProjectDto | null>(null);
    const [applicants, setApplicants] = useState<ApplicantDto[]>([]);
    const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);

    // [유지] 수정 모달 관련 상태 (팀원 작업물 연결용)
    const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<ProjectDto | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // --- 초기 권한 체크 및 데이터 로드 ---
    useEffect(() => {
        const checkAccess = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                router.replace("/login");
                return;
            }
            try {
                const res = await api.get("/v1/users/me");
                const userData = res.data;

                // 권한 필터링
                if (userData.role.includes("GUEST")) {
                    router.replace("/onboarding");
                    return;
                }
                if (userData.role === "FREELANCER" || userData.role === "ROLE_FREELANCER") {
                    alert("클라이언트 전용 화면입니다.");
                    router.replace("/");
                    return;
                }

                setUser(userData);
                setAuthorized(true);
            } catch (err) {
                router.replace("/login");
            }
        };
        checkAccess();
    }, [router]);

    // 프로젝트 목록 호출
    const fetchMyProjects = async () => {
        try {
            const { data } = await api.get('/v1/projects/me');
            const projectArray = data.content || data || [];
            // COMPLETED 제외 필터링 (마스터의 요구사항)
            const filtered = projectArray.filter((p: ProjectDto) => p.status !== 'COMPLETED');
            setProjects(filtered);
        } catch (err) {
            console.error("데이터 로드 실패", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authorized) fetchMyProjects();
    }, [authorized]);

    // --- 핸들러 함수들 ---

    // 프로젝트 상태 변경 (시작/마감)
    const handleStatusChange = async (projectId: number, action: 'start' | 'close') => {
        const msg = action === 'start' ? '시작' : '마감';
        if (!confirm(`프로젝트를 ${msg} 처리하시겠습니까?`)) return;
        try {
            await api.patch(`/v1/projects/${projectId}/${action}`);
            alert('상태가 변경되었습니다.');
            fetchMyProjects();
        } catch (err) {
            alert('변경 실패');
        }
    };

    // 프로젝트 삭제
    const handleDeleteProject = async (projectId: number) => {
        if (!confirm('정말 삭제하시겠습니까? 복구할 수 없습니다.')) return;
        try {
            await api.delete(`/v1/projects/${projectId}`);
            alert('삭제되었습니다.');
            fetchMyProjects();
        } catch (err) {
            alert('삭제 실패');
        }
    };

    // [유지] 수정 버튼 클릭 핸들러 (데이터 미리 불러오기)
    const handleEditProjectClick = async (projectId: number) => {
        try {
            const { data } = await api.get(`/v1/projects/${projectId}`);
            setSelectedProjectForEdit(data);
            setIsEditModalOpen(true);
            // 💡 여기서 팀원분이 만든 모달을 띄우게 됩니다.
            console.log("수정 데이터 로드 완료:", data);
        } catch (error) {
            alert('정보를 불러오지 못했습니다.');
        }
    };

    // 지원자 목록 보기
    const handleViewApplicants = async (project: ProjectDto) => {
        setSelectedProjectForApplicant(project);
        setIsApplicantModalOpen(true);
        try {
            // API 경로 주의: /v1/ 포함 여부 확인 필요
            const { data } = await api.get(`/v1/projects/${project.projectId}/applications`);
            setApplicants(data);
        } catch (err) {
            setApplicants([]);
        }
    };

    // 지원자 수락/거절
    const handleApplicationStatus = async (applicationId: number, status: 'ACCEPTED' | 'REJECTED') => {
        const msg = status === 'ACCEPTED' ? '수락' : '거절';
        if (!confirm(`해당 지원자를 ${msg} 하시겠습니까?`)) return;
        try {
            await api.patch(`/v1/applications/${applicationId}/status`, { status });
            alert(`${msg} 되었습니다.`);
            if (selectedProjectForApplicant) handleViewApplicants(selectedProjectForApplicant);
        } catch (err) {
            alert('처리 실패');
        }
    };

    const formatBudget = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
    };

    if (!authorized || loading) return (
        <div className="flex min-h-screen items-center justify-center bg-white text-[#FF7D00] font-black text-xl animate-pulse">
            DEVNEAR SECURE SCANNING...
        </div>
    );

    const filteredProjects = projects.filter(p => filterStatus === 'ALL' || p.status === filterStatus);

    return (
        <div className="min-h-screen bg-zinc-50/50 text-zinc-900 pb-20 font-sans selection:bg-[#FF7D00]/20">
            {/* 상단 네비게이션 */}
            <nav className="w-full py-5 px-10 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex justify-between items-center sticky top-0 z-50">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/")}>
                    <span className="text-[#FF7D00]">Dev</span><span>Near</span>
                </div>
                <div className="flex gap-6 items-center">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-full">
                        Client_Dashboard_v1.0
                    </span>
                    <button onClick={() => router.push('/client/mypage')} className="text-xs font-bold hover:text-[#FF7D00] transition-colors uppercase">
                        My Page
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-8 py-12">
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black mb-3 tracking-tight">프로젝트 관리</h1>
                        <p className="text-zinc-500 font-medium">현재 진행 중인 공고와 지원 현황을 실시간으로 확인하세요.</p>
                    </div>

                    {/* 탭 필터 */}
                    <div className="flex gap-1 p-1.5 bg-zinc-100/50 rounded-2xl border border-zinc-200 shadow-inner">
                        {['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-6 py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all ${
                                    filterStatus === s ? 'bg-white text-[#FF7D00] shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                                }`}
                            >
                                {s === 'IN_PROGRESS' ? 'PROGRESS' : s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 프로젝트 리스트 카드 */}
                <div className="grid gap-4">
                    {filteredProjects.length === 0 ? (
                        <div className="p-24 text-center bg-white rounded-[2.5rem] border border-dashed border-zinc-200 text-zinc-300 font-black font-mono tracking-tighter uppercase">
                            No projects found in this status.
                        </div>
                    ) : (
                        filteredProjects.map((project) => (
                            <div key={project.projectId} className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-tighter uppercase ${
                                                project.status === 'OPEN' ? 'bg-blue-50 text-blue-600' :
                                                    project.status === 'IN_PROGRESS' ? 'bg-orange-50 text-[#FF7D00]' : 'bg-zinc-100 text-zinc-500'
                                            }`}>
                                                {project.status === 'OPEN' ? '모집 중' : project.status === 'IN_PROGRESS' ? '진행 중' : '마감됨'}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-zinc-300">#{project.projectId}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-zinc-900 group-hover:text-[#FF7D00] transition-colors mb-4 leading-tight">
                                            {project.projectName}
                                        </h3>
                                        <div className="flex flex-wrap gap-5 text-zinc-400">
                                            <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                                                <DollarSign size={14} className="text-zinc-300" /> {formatBudget(project.budget)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                                                <Calendar size={14} className="text-zinc-300" /> {project.deadline}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* 상태 제어 */}
                                        {project.status === 'OPEN' && (
                                            <div className="flex gap-2 mr-2">
                                                <button onClick={() => handleStatusChange(project.projectId, 'start')} className="px-4 py-2 bg-[#FF7D00]/10 text-[#FF7D00] rounded-xl text-[11px] font-black hover:bg-[#FF7D00] hover:text-white transition-all tracking-tighter">프로젝트 시작</button>
                                                <button onClick={() => handleStatusChange(project.projectId, 'close')} className="px-4 py-2 bg-zinc-100 text-zinc-500 rounded-xl text-[11px] font-black hover:bg-zinc-200 transition-all tracking-tighter">공고 마감</button>
                                            </div>
                                        )}

                                        {/* 수정 & 삭제 */}
                                        <div className="flex gap-1.5 p-1.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                                            {/* [지시 반영] 수정 버튼 유지 */}
                                            <button
                                                onClick={() => handleEditProjectClick(project.projectId)}
                                                className="p-2.5 text-zinc-400 hover:text-blue-500 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProject(project.projectId)}
                                                className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => handleViewApplicants(project)}
                                            className="px-6 py-3 bg-zinc-900 text-white rounded-2xl text-[11px] font-black tracking-[0.1em] uppercase shadow-lg shadow-zinc-200 hover:bg-[#FF7D00] hover:shadow-[#FF7D00]/20 transition-all flex items-center gap-2"
                                        >
                                            <Users size={16} /> 지원자 확인
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* 지원자 관리 모달 */}
            <AnimatePresence>
                {isApplicantModalOpen && selectedProjectForApplicant && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsApplicantModalOpen(false)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl max-h-[80vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">지원자 목록</h2>
                                    <p className="text-sm text-[#FF7D00] font-bold mt-2 font-mono flex items-center gap-1">
                                        <Activity size={14} /> {selectedProjectForApplicant.projectName}
                                    </p>
                                </div>
                                <button onClick={() => setIsApplicantModalOpen(false)} className="bg-zinc-100 p-3 rounded-full hover:bg-zinc-200 transition-colors">
                                    <XCircle size={24} className="text-zinc-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {applicants.length === 0 ? (
                                    <div className="py-20 text-center text-zinc-300 font-black font-mono tracking-tighter uppercase border-2 border-dashed border-zinc-100 rounded-[2rem]">
                                        No applicants yet.
                                    </div>
                                ) : (
                                    applicants.map((app) => (
                                        <div key={app.applicationId} className="flex flex-col sm:flex-row items-center justify-between p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 hover:border-[#FF7D00]/30 transition-all">
                                            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-zinc-300 shadow-sm border border-zinc-100">
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-black text-lg text-zinc-900">{app.freelancerName}</h4>
                                                        <span className="text-[10px] bg-[#7A4FFF] text-white px-2.5 py-1 rounded-lg font-black font-mono">
                                                            {app.matchingScore}% MATCH
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-400 font-bold font-mono uppercase tracking-tighter">Applied_{new Date(app.appliedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                {app.status === 'PENDING' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleApplicationStatus(app.applicationId, 'ACCEPTED')}
                                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl text-[10px] font-black hover:bg-[#FF7D00] transition-all"
                                                        >
                                                            <CheckCircle size={16} /> ACCEPT
                                                        </button>
                                                        <button
                                                            onClick={() => handleApplicationStatus(app.applicationId, 'REJECTED')}
                                                            className="flex-1 sm:flex-none px-6 py-3 bg-white text-zinc-400 border border-zinc-200 rounded-2xl text-[10px] font-black hover:text-red-500 hover:bg-red-50 transition-all"
                                                        >
                                                            REJECT
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className={`px-8 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase ${
                                                        app.status === 'ACCEPTED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                    }`}>
                                                        {app.status === 'ACCEPTED' ? 'Matched' : 'Rejected'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 💡 여기에 팀원분이 완성한 <ProjectEditModal />을 임포트해서 넣으면 됩니다. */}
        </div>
    );
}