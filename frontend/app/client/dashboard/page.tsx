'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { User, Users, CheckCircle, XCircle, Edit, Trash2, Calendar, DollarSign, Activity, ChevronRight, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientDashboardPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [selectedProjectForApplicant, setSelectedProjectForApplicant] = useState<any>(null);
    const [applicants, setApplicants] = useState<any[]>([]);
    const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);

    const [cursor, setCursor] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await api.get("/v1/users/me");
                if (res.data.role.includes("GUEST")) return router.replace("/onboarding");
                setAuthorized(true);
            } catch (err) {
                router.replace("/login");
            }
        };
        checkAccess();
    }, [router]);

    const fetchMyProjects = async () => {
        try {
            const { data } = await api.get('/v1/projects/me');
            const projectArray = data.content || data || [];
            setProjects(projectArray.filter((p: any) => p.status !== 'COMPLETED'));
        } catch (err) {
            console.error("로드 실패", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (authorized) fetchMyProjects(); }, [authorized]);

    const handleEditProjectClick = (projectId: number) => {
        router.push(`/client/projects/${projectId}/edit`);
    };

    const handleStatusChange = async (projectId: number, action: 'start' | 'close') => {
        const msg = action === 'start' ? '시작' : '마감';
        if (!confirm(`프로젝트를 ${msg} 처리하시겠습니까?`)) return;
        try {
            await api.patch(`/v1/projects/${projectId}/${action}`);
            fetchMyProjects();
        } catch (err) {
            alert('상태 변경 실패');
        }
    };

    const handleDeleteProject = async (projectId: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await api.delete(`/v1/projects/${projectId}`);
            fetchMyProjects();
        } catch (err) {
            alert('삭제 실패');
        }
    };

    const handleViewApplicants = async (project: any) => {
        setSelectedProjectForApplicant(project);
        setIsApplicantModalOpen(true);
        try {
            const { data } = await api.get(`/projects/${project.projectId}/applications`);
            setApplicants(data);
        } catch (err) {
            console.error("지원자 로드 실패:", err);
            setApplicants([]);
        }
    };

    const handleApplicationStatus = async (applicationId: number, status: 'ACCEPTED' | 'REJECTED') => {
        try {
            await api.patch(`/applications/${applicationId}/status`, { status });
            if (status === 'ACCEPTED' && selectedProjectForApplicant) {
                await api.patch(`/v1/projects/${selectedProjectForApplicant.projectId}/start`);
            }
            if (selectedProjectForApplicant) handleViewApplicants(selectedProjectForApplicant);
            fetchMyProjects();
        } catch (err) {
            alert('처리 중 오류가 발생했습니다.');
        }
    };

    if (!authorized || loading) return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-[#FF7D00] font-black text-xl animate-pulse">
            권한 확인 중...
        </div>
    );

    const filteredProjects = projects.filter(p => filterStatus === 'ALL' || p.status === filterStatus);

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 relative overflow-hidden font-sans">
            <div className="pointer-events-none fixed z-0 w-[300px] h-[300px] rounded-full bg-[#FF7D00]/20 blur-[120px] transition-all duration-200"
                 style={{ left: cursor.x - 150, top: cursor.y - 150 }} />

            <nav className="w-full py-5 px-10 bg-white/80 backdrop-blur-xl border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/client/dashboard")}>
                    <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                </div>
                <div className="flex gap-6 items-center relative z-10">
                    <button onClick={() => router.push('/client/mypage')} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 tracking-widest transition uppercase font-mono">MY_PAGE</button>
                    <button onClick={() => router.push("/client/projects/new")} className="px-6 py-2.5 bg-[#FF7D00] text-white rounded-xl text-xs font-black tracking-widest hover:brightness-110 transition shadow-md shadow-orange-100 uppercase font-mono">Register_Project</button>
                </div>
            </nav>

            <header className="relative pt-16 pb-12 px-8 bg-white border-b border-zinc-200 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
                </div>
                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-8 h-[2px] bg-[#FF7D00]"></span>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono">Project_Management</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">대시보드</h1>
                    <p className="text-zinc-500 font-medium">운영 중인 프로젝트와 지원자 현황을 한눈에 관리하세요.</p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-8 py-12 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <h2 className="text-xl font-black tracking-tight text-zinc-950 uppercase font-mono">
                        내 프로젝트 <span className="text-[#FF7D00] ml-1">[{filteredProjects.length}]</span>
                    </h2>
                    <div className="flex gap-1.5 p-1.5 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                        {[
                            { id: 'ALL', label: '전체' },
                            { id: 'OPEN', label: '모집중' },
                            { id: 'IN_PROGRESS', label: '진행중' },
                            { id: 'CLOSED', label: '마감됨' }
                        ].map((s) => (
                            <button key={s.id} onClick={() => setFilterStatus(s.id)} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest uppercase font-mono ${filterStatus === s.id ? 'bg-zinc-950 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6">
                    {filteredProjects.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-zinc-200 font-bold text-zinc-300 italic font-mono uppercase tracking-tighter">Null: No_Projects_Found</div>
                    ) : (
                        filteredProjects.map((project, idx) => (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.05 }} key={project.projectId}
                                        className="group bg-white p-8 rounded-2xl border border-zinc-100 flex flex-col md:flex-row justify-between items-center transition-all hover:border-[#FF7D00] hover:shadow-xl hover:shadow-orange-100/50">
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase font-mono border ${project.status === 'OPEN' ? 'bg-[#FF7D00]/10 text-[#FF7D00] border-[#FF7D00]/20' : project.status === 'IN_PROGRESS' ? 'bg-orange-50 text-[#FF7D00] border-orange-100' : 'bg-zinc-100 text-zinc-500'}`}>
                                            {project.status === 'OPEN' ? '모집중' : project.status === 'IN_PROGRESS' ? '진행중' : '마감됨'}
                                        </span>
                                        <span className="text-[10px] font-bold text-zinc-300 font-mono tracking-widest uppercase">ID_{project.projectId}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-zinc-900 group-hover:text-[#FF7D00] transition-colors mb-4 tracking-tight">{project.projectName}</h3>
                                    <div className="flex flex-wrap gap-6 text-xs font-bold text-zinc-400 font-mono uppercase">
                                        <span className="flex items-center gap-1"><DollarSign size={14} className="text-[#FF7D00]"/>{project.budget.toLocaleString()}원</span>
                                        <span className="flex items-center gap-1"><Calendar size={14} className="text-[#FF7D00]"/>{project.deadline} 마감</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-8 md:mt-0">
                                    {project.status === 'OPEN' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleStatusChange(project.projectId, 'start')} className="px-5 py-2.5 bg-[#FF7D00]/10 text-[#FF7D00] rounded-xl text-[10px] font-black hover:bg-[#FF7D00] hover:text-white transition-all uppercase font-mono">시작</button>
                                            <button onClick={() => handleStatusChange(project.projectId, 'close')} className="px-5 py-2.5 bg-zinc-50 text-zinc-400 rounded-xl text-[10px] font-black hover:bg-zinc-100 transition-all uppercase font-mono tracking-widest">마감</button>
                                        </div>
                                    )}
                                    <div className="flex gap-1 px-3 border-x border-zinc-100">
                                        <button onClick={() => handleEditProjectClick(project.projectId)} className="p-3 text-zinc-300 hover:text-[#7A4FFF] transition-all"><Edit size={18} /></button>
                                        <button onClick={() => handleDeleteProject(project.projectId)} className="p-3 text-zinc-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                                    </div>
                                    <button onClick={() => handleViewApplicants(project)} className="px-8 py-4 bg-zinc-950 text-white rounded-xl font-black text-xs tracking-widest uppercase hover:bg-[#FF7D00] transition-all flex items-center gap-2 shadow-lg shadow-zinc-200 font-mono">
                                        <Users size={16} /> Applicants
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </main>

            {/* --- 🔍 지원자 목록 모달 (마스터 요청대로 영어 제거 + 폰트 확대) --- */}
            <AnimatePresence>
                {isApplicantModalOpen && selectedProjectForApplicant && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsApplicantModalOpen(false)} className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative bg-white rounded-3xl w-full max-w-2xl p-10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-zinc-100">

                            {/* 모달 헤더 (한글화) */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">지원자 목록</h2>
                                    <p className="text-base font-bold text-[#FF7D00] mt-2">대상: {selectedProjectForApplicant.projectName}</p>
                                </div>
                                <button onClick={() => setIsApplicantModalOpen(false)} className="text-zinc-300 hover:text-[#FF7D00] p-2 bg-zinc-50 rounded-full transition-colors"><XCircle size={32} /></button>
                            </div>

                            {/* 지원자 리스트 */}
                            <div className="overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                                {applicants.length === 0 ? (
                                    <div className="py-24 text-center text-zinc-300 font-black border-2 border-dashed border-zinc-100 rounded-2xl text-xl">
                                        아직 지원자가 없습니다.
                                    </div>
                                ) : (
                                    applicants.map((app: any) => (
                                        <div key={app.applicationId} className="p-7 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col gap-6 hover:bg-white hover:border-[#FF7D00] hover:shadow-lg transition-all group">

                                            <div className="flex justify-between items-center w-full">
                                                <div
                                                    className="flex items-center gap-5 cursor-pointer group/profile"
                                                    onClick={() => router.push(`/freelancer/${app.freelancerId}`)}
                                                >
                                                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-[#FF7D00] border border-zinc-200 shadow-sm flex-shrink-0 group-hover/profile:border-[#FF7D00] transition-all">
                                                        {app.freelancerProfileImageUrl ? (
                                                            <img src={app.freelancerProfileImageUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                                                        ) : (
                                                            <User size={32} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        {/* 🔍 닉네임 크기 확대 */}
                                                        <h4 className="font-black text-2xl text-zinc-900 group-hover/profile:text-[#FF7D00] transition-colors flex items-center gap-2">
                                                            {app.freelancerNickname}
                                                            <ChevronRight size={20} className="opacity-0 group-hover/profile:opacity-100 transition-all translate-x-[-4px] group-hover/profile:translate-x-0" />
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            {/* 🔍 매칭률 정보 확대 */}
                                                            <span className="text-sm font-black text-[#FF7D00] bg-white px-3 py-1 rounded border border-[#FF7D00]/20 uppercase">
                                                                매칭률 {Math.round(app.matchingRate * 100)}%
                                                            </span>
                                                            <span className="text-sm font-bold text-zinc-400">
                                                                {app.status === 'PENDING' ? '검토 대기 중' : app.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {/* 🔍 제안가 크기 확대 */}
                                                    <p className="text-2xl font-black text-zinc-900 italic">₩{app.bidPrice.toLocaleString()}</p>
                                                    <p className="text-xs font-bold text-zinc-400 mt-1">{new Date(app.appliedAt).toLocaleDateString()} 지원</p>
                                                </div>
                                            </div>

                                            {/* 🔍 지원 메시지 폰트 확대 */}
                                            <div className="p-5 bg-white rounded-xl border border-zinc-100 text-lg font-medium text-zinc-600 leading-relaxed italic">
                                                "{app.message || "지원 메시지가 없습니다."}"
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-wrap gap-2">
                                                    {app.freelancerSkills?.slice(0, 3).map((skill: any) => (
                                                        <span key={skill.skillId} className="px-3 py-1 bg-white border border-zinc-100 text-xs font-bold text-zinc-400 rounded-lg group-hover:border-[#FF7D00]/20 group-hover:text-[#FF7D00] transition-colors">
                                                            #{skill.name}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* 🔍 버튼 한글화 + 크기 최적화 */}
                                                {app.status === 'PENDING' ? (
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleApplicationStatus(app.applicationId, 'ACCEPTED')}
                                                            className="px-8 py-3 bg-zinc-950 text-white rounded-xl text-sm font-black hover:bg-[#FF7D00] transition-all shadow-md"
                                                        >
                                                            수락
                                                        </button>
                                                        <button
                                                            onClick={() => handleApplicationStatus(app.applicationId, 'REJECTED')}
                                                            className="px-8 py-3 bg-white border border-zinc-200 text-zinc-400 rounded-xl text-sm font-black hover:text-red-600 hover:border-red-100 transition-all"
                                                        >
                                                            거절
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className={`px-8 py-3 rounded-xl text-sm font-black ${app.status === 'ACCEPTED' ? 'bg-orange-50 text-[#FF7D00]' : 'bg-red-50 text-red-600'}`}>
                                                        {app.status === 'ACCEPTED' ? '수락 완료' : '지원 거절됨'}
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
        </div>
    );
}