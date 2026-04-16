'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { Briefcase, User, Users, CheckCircle, XCircle, Edit, Trash2, ChevronRight, Activity } from 'lucide-react';
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

    // 필터 상태 ('ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED') -> COMPLETED 제거됨
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    // 지원자 모달 및 선택 상태
    const [selectedProjectForApplicant, setSelectedProjectForApplicant] = useState<ProjectDto | null>(null);
    const [applicants, setApplicants] = useState<ApplicantDto[]>([]);
    const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);

    // 수정 모달 상태
    const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<ProjectDto | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // --- 초기 데이터 로드 ---
    useEffect(() => {
        const checkAccessAndFetchUser = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("로그인이 필요합니다.");
                router.replace("/login");
                return;
            }
            try {
                const res = await api.get("/v1/users/me");
                const userData = res.data;
                if (userData.role === "GUEST" || userData.role === "ROLE_GUEST") {
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
        checkAccessAndFetchUser();
    }, [router]);

    const fetchMyProjects = async () => {
        try {
            const { data } = await api.get('/v1/projects/me');
            const projectArray = data.content || data || [];
            // COMPLETED를 제외한 프로젝트만 세팅 (요구사항 반영)
            const filtered = projectArray.filter((p: ProjectDto) => p.status !== 'COMPLETED');
            setProjects(filtered);
        } catch (err) {
            console.error("프로젝트 로드 실패", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authorized) {
            fetchMyProjects();
        }
    }, [authorized]);

    // --- 상태별 탭 필터링 로직 ---
    const filteredProjects = projects.filter((project) => {
        if (filterStatus === 'ALL') return true;
        return project.status === filterStatus;
    });

    // --- 프로젝트 상태 변경 핸들러 ---
    const handleStatusChange = async (projectId: number, action: 'start' | 'close' | 'complete') => {
        if (!confirm(`프로젝트를 ${action === 'start' ? '시작' : action === 'close' ? '마감' : '완료'} 처리하시겠습니까?`)) return;
        try {
            await api.patch(`/v1/projects/${projectId}/${action}`);
            alert('상태가 변경되었습니다.');
            fetchMyProjects(); // 목록 새로고침
        } catch (err) {
            alert('상태 변경에 실패했습니다.');
            console.error(err);
        }
    };

    // --- 프로젝트 삭제 핸들러 ---
    const handleDeleteProject = async (projectId: number) => {
        if (!confirm('이 프로젝트를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
        try {
            await api.delete(`/v1/projects/${projectId}`);
            alert('프로젝트가 삭제되었습니다.');
            fetchMyProjects();
        } catch (err) {
            alert('프로젝트 삭제에 실패했습니다.');
            console.error(err);
        }
    };

    // --- 프로젝트 수정 핸들러 ---
    const handleEditProjectClick = async (projectId: number) => {
        try {
            const { data } = await api.get(`/v1/projects/${projectId}`);
            setSelectedProjectForEdit(data);
            setIsEditModalOpen(true);
        } catch (error) {
            alert('프로젝트 상세 정보를 불러오는 데 실패했습니다.');
            console.error(error);
        }
    };

    // --- 지원자 목록 조회 핸들러 ---
    const handleViewApplicants = async (project: ProjectDto) => {
        setSelectedProjectForApplicant(project);
        setIsApplicantModalOpen(true);
        try {
            const { data } = await api.get(`/projects/${project.projectId}/applications`);
            setApplicants(data);
        } catch (err) {
            console.error("지원자 목록 로드 실패", err);
            setApplicants([]);
        }
    };

    // --- 지원자 상태 변경 (수락/거절) 핸들러 ---
    const handleApplicationStatus = async (applicationId: number, status: 'ACCEPTED' | 'REJECTED') => {
        if (!confirm(`해당 지원자를 ${status === 'ACCEPTED' ? '수락' : '거절'} 하시겠습니까?`)) return;
        try {
            await api.patch(`/applications/${applicationId}/status`, { status });
            alert('지원 상태가 업데이트 되었습니다.');
            if (selectedProjectForApplicant) {
                const { data } = await api.get(`/projects/${selectedProjectForApplicant.projectId}/applications`);
                setApplicants(data);
            }
        } catch (err) {
            alert('상태 변경에 실패했습니다.');
            console.error(err);
        }
    };

    const formatBudget = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
    };

    if (!authorized || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-[#FF7D00] font-black text-xl animate-pulse">
                LOADING DASHBOARD...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 font-sans">
            {/* NAV */}
            <nav className="w-full py-5 px-10 bg-white border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/")}>
                    <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                </div>
                <div className="flex gap-6 items-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase font-mono">
                        CLIENT DASHBOARD
                    </span>
                    <button onClick={() => router.push('/client/mypage')} className="text-xs font-bold hover:text-[#FF7D00] transition">
                        MY PAGE
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-8 py-12">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black mb-2 tracking-tight">프로젝트 관리</h1>
                        <p className="text-zinc-500 font-medium">등록한 프로젝트의 상태를 관리하고 지원자를 확인하세요.</p>
                    </div>

                    {/* 탭 필터 (전체/모집중/진행중/마감) -> COMPLETED(완료) 삭제 */}
                    <div className="flex gap-2 p-1 bg-white border border-zinc-200 rounded-xl overflow-x-auto no-scrollbar font-mono text-xs font-bold tracking-widest uppercase shadow-sm">
                        <button onClick={() => setFilterStatus('ALL')} className={`px-4 py-2 rounded-lg transition-all ${filterStatus === 'ALL' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}>
                            ALL
                        </button>
                        <button onClick={() => setFilterStatus('OPEN')} className={`px-4 py-2 rounded-lg transition-all ${filterStatus === 'OPEN' ? 'bg-[#FF7D00] text-white shadow-[0_0_15px_rgba(255,125,0,0.3)]' : 'text-zinc-500 hover:bg-zinc-100'}`}>
                            OPEN
                        </button>
                        <button onClick={() => setFilterStatus('IN_PROGRESS')} className={`px-4 py-2 rounded-lg transition-all ${filterStatus === 'IN_PROGRESS' ? 'bg-orange-100 text-[#FF7D00]' : 'text-zinc-500 hover:bg-zinc-100'}`}>
                            PROGRESS
                        </button>
                        <button onClick={() => setFilterStatus('CLOSED')} className={`px-4 py-2 rounded-lg transition-all ${filterStatus === 'CLOSED' ? 'bg-zinc-200 text-zinc-700' : 'text-zinc-500 hover:bg-zinc-100'}`}>
                            CLOSED
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 p-6 bg-zinc-50 border-b border-zinc-200 text-xs font-black text-zinc-500 uppercase tracking-widest font-mono">
                        <div className="col-span-4">Project_Name</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Deadline</div>
                        <div className="col-span-4 text-right">Actions</div>
                    </div>

                    <div className="divide-y divide-zinc-100">
                        {filteredProjects.length === 0 ? (
                            <div className="p-16 text-center text-zinc-400 font-bold font-mono tracking-tighter uppercase">해당 상태의 프로젝트가 없습니다.</div>
                        ) : (
                            filteredProjects.map((project) => (
                                <div key={project.projectId} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-orange-50/30 transition-colors group">
                                    <div className="col-span-4 pr-4">
                                        <h3 className="font-bold text-base text-zinc-900 truncate group-hover:text-[#FF7D00] transition-colors">{project.projectName}</h3>
                                        <p className="text-xs text-zinc-500 mt-1 font-mono">{formatBudget(project.budget)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className={`px-3 py-1 rounded-md text-[10px] font-black font-mono tracking-widest ${
                                            project.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                                            project.status === 'IN_PROGRESS' ? 'bg-orange-100 text-[#FF7D00]' :
                                            'bg-zinc-200 text-zinc-600'
                                        }`}>
                                            {project.status === 'OPEN' ? '모집 중' : 
                                             project.status === 'IN_PROGRESS' ? '진행 중' : '마감'}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-sm font-medium text-zinc-600 font-mono">
                                        {project.deadline}
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="col-span-4 flex items-center justify-end gap-2">
                                        
                                        {/* 상태 변경 버튼들 */}
                                        {project.status === 'OPEN' && (
                                            <>
                                                <button onClick={() => handleStatusChange(project.projectId, 'start')} className="px-3 py-1.5 bg-orange-100 text-[#FF7D00] hover:bg-[#FF7D00] hover:text-white rounded-lg text-[11px] font-black tracking-widest uppercase transition">시작</button>
                                                <button onClick={() => handleStatusChange(project.projectId, 'close')} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 rounded-lg text-[11px] font-black tracking-widest uppercase transition">마감</button>
                                            </>
                                        )}

                                        {/* 수정 & 삭제 */}
                                        <div className="flex items-center gap-1 border-x border-zinc-200 px-2 mx-1">
                                            <button onClick={() => handleEditProjectClick(project.projectId)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition" title="수정">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteProject(project.projectId)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="삭제">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* 지원자 보기 버튼 */}
                                        <button 
                                            onClick={() => handleViewApplicants(project)}
                                            className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 text-white hover:bg-[#FF7D00] rounded-lg text-[11px] font-black tracking-widest uppercase transition shadow-md shadow-zinc-200"
                                        >
                                            <Users size={14} /> 지원자
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
            {/* 지원자 관리 모달 */}
            <AnimatePresence>
                {isApplicantModalOpen && selectedProjectForApplicant && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsApplicantModalOpen(false)} className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                            className="relative bg-white rounded-[2rem] w-full max-w-3xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-start mb-6 border-b border-zinc-100 pb-4">
                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900">지원자 관리</h2>
                                    <p className="text-sm text-[#FF7D00] font-bold mt-1 font-mono truncate max-w-md">{selectedProjectForApplicant.projectName}</p>
                                </div>
                                <button onClick={() => setIsApplicantModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 bg-zinc-100 p-2 rounded-full"><XCircle size={20} /></button>
                            </div>

                            <div className="space-y-4">
                                {applicants.length === 0 ? (
                                    <div className="py-12 text-center text-zinc-400 font-bold bg-zinc-50 rounded-xl border border-dashed border-zinc-200 font-mono tracking-tighter uppercase">
                                        아직 지원자가 없습니다.
                                    </div>
                                ) : (
                                    applicants.map((app) => (
                                        <div key={app.applicationId} className="flex items-center justify-between p-5 bg-white border border-zinc-200 rounded-xl shadow-sm hover:border-[#FF7D00]/50 transition">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 font-black">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
                                                        {app.freelancerName}
                                                        <span className="text-[10px] bg-purple-100 text-[#7A4FFF] px-2 py-0.5 rounded-md font-black font-mono tracking-widest">
                                                            MATCH {app.matchingScore}%
                                                        </span>
                                                    </h4>
                                                    <p className="text-xs text-zinc-500 mt-1 font-mono">APPLIED: {new Date(app.appliedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {app.status === 'PENDING' ? (
                                                    <>
                                                        <button onClick={() => handleApplicationStatus(app.applicationId, 'ACCEPTED')} className="flex items-center gap-1 px-4 py-2 bg-zinc-900 hover:bg-[#FF7D00] text-white rounded-lg text-xs font-black tracking-widest uppercase transition shadow-md">
                                                            <CheckCircle size={16} /> ACCEPT
                                                        </button>
                                                        <button onClick={() => handleApplicationStatus(app.applicationId, 'REJECTED')} className="px-4 py-2 bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-zinc-600 rounded-lg text-xs font-black tracking-widest uppercase transition border border-zinc-200">
                                                            REJECT
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`px-4 py-2 rounded-lg text-xs font-black tracking-widest uppercase font-mono ${app.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {app.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                                                    </span>
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
        </div>
    );
}
