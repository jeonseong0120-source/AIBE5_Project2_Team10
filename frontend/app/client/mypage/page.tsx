'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, ChevronRight, Calendar, XCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notifyAuthChanged, logout } from '../../lib/authEvents';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import api from '../../lib/axios';

import ProfileEditModal from '@/components/client_mypage/page';
import CompanyEditModal from '@/components/client_mypage/CompanyEditModal';

interface UserProfile {
    name: string;
    email: string;
    role: string;
    nickname?: string;
}

interface ProjectDto {
    projectId: number;
    projectName: string;
    status: string;
    deadline: string;
    budget?: number;
    detail?: string;
}

export default function ClientMyPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [projects, setProjects] = useState<ProjectDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // 로직 보존을 위해 상태는 남겨둡니다. (글로우 효과만 제거)
    const [cursor, setCursor] = useState({ x: 0, y: 0 });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [selectedProjectForView, setSelectedProjectForView] = useState<ProjectDto | null>(null);

    useEffect(() => {
        const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    useEffect(() => {
        const checkAccessAndFetchUser = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) { router.replace("/login"); return; }
            try {
                const res = await api.get("/v1/users/me");
                const roles = res.data.role || "";

                if (!roles.includes("CLIENT") && !roles.includes("BOTH")) {
                    alert("클라이언트 또는 BOTH 계정만 접근 가능합니다.");
                    if (roles.includes("FREELANCER")) return router.replace("/");
                    return router.replace("/onboarding");
                }

                if (roles.includes("GUEST")) return router.replace("/onboarding");

                setUser(res.data);
                setAuthorized(true);
            } catch (err) { router.replace("/login"); }
        };
        checkAccessAndFetchUser();
    }, [router]);

    useEffect(() => {
        const fetchMyProjects = async () => {
            if (!authorized) return;
            setLoading(true);
            try {
                const { data } = await api.get('/v1/projects/me');
                setProjects(data.content || data || []);
            } catch (err) { setProjects([]); } finally { setLoading(false); }
        };
        fetchMyProjects();
    }, [authorized]);

    if (!authorized) return <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-[#FF7D00] font-black text-xl animate-pulse uppercase font-mono">LOADING_WORKSPACE...</div>;

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-24 relative overflow-hidden font-sans">
            {/* 🎨 [통합] 테크니컬 그리드 배경 (기존의 눈 아픈 blur-[150px] 글로우 제거) */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px), linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px, 100px 100px, 100px 100px' }} />
            </div>

            {/* 🎨 [통합] 네비게이션 통일 */}
            <nav className="w-full py-6 px-10 bg-white/70 backdrop-blur-2xl border-b border-zinc-200/50 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="font-black text-2xl tracking-tighter cursor-pointer group" onClick={() => router.push("/client/mainpage")}>
                    <span className="text-[#FF7D00] group-hover:drop-shadow-[0_0_8px_#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                </div>
                <div className="flex gap-4 items-center relative z-10 md:gap-8">
                    <button onClick={() => router.push('/client/dashboard')} className="text-xs font-black text-zinc-400 hover:text-zinc-950 tracking-[0.2em] transition uppercase font-mono">DASHBOARD</button>
                    <NotificationBell />
                    <button onClick={() => router.push("/client/projects/new")} className="px-7 py-3 bg-zinc-950 text-white rounded-2xl text-xs font-black tracking-widest hover:bg-[#FF7D00] transition-all shadow-xl shadow-zinc-200 flex items-center gap-2 uppercase font-mono">+ 프로젝트 등록</button>
                </div>
            </nav>

            {/* 헤더 섹션 */}
            <section className="relative pt-24 pb-16 px-10 overflow-hidden max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="w-32 h-32 rounded-[3rem] bg-gradient-to-tr from-[#FF7D00] to-[#FFB066] shadow-[0_20px_50px_rgba(255,125,0,0.3)] flex items-center justify-center text-5xl text-white font-black font-mono border-4 border-white"
                    >
                        {user?.name?.charAt(0).toUpperCase() || 'M'}
                    </motion.div>
                    <div className="text-center md:text-left">
                        <div className="flex justify-center md:justify-start gap-3 text-[10px] text-zinc-400 mb-4 font-bold font-mono tracking-widest">
                            <span className="bg-white px-4 py-1.5 rounded-full text-[#FF7D00] border border-orange-100 shadow-sm">CLIENT_ACCESS</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter mb-4 text-zinc-900 leading-tight">
                            <span className="text-[#FF7D00]">{user?.nickname || user?.name || '마스터'}</span>님의 워크스페이스
                        </h1>
                        <p className="text-zinc-400 font-medium font-mono text-base">{user?.email}</p>
                    </div>
                </div>
            </section>

            <main className="max-w-6xl mx-auto px-10 py-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12 border-t border-zinc-200/50">
                    {/* 설정 메뉴 */}
                    <div className="lg:col-span-1 space-y-8">
                        <h3 className="text-sm font-black uppercase font-mono tracking-[0.3em] text-zinc-400 pl-2">Settings</h3>
                        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[3rem] shadow-2xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
                            <button onClick={() => setIsEditModalOpen(true)} className="w-full flex items-center justify-between p-6 hover:bg-orange-50/50 rounded-[2rem] transition-all group">
                                <div className="flex items-center gap-5 font-black text-sm text-zinc-700 group-hover:text-[#FF7D00]"><User className="w-5 h-5 text-zinc-400 group-hover:text-[#FF7D00] group-hover:scale-110 transition-transform" />프로필 편집</div>
                                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#FF7D00] group-hover:translate-x-1 transition-all" />
                            </button>
                            <button onClick={() => setIsCompanyModalOpen(true)} className="w-full flex items-center justify-between p-6 hover:bg-orange-50/50 rounded-[2rem] transition-all group">
                                <div className="flex items-center gap-5 font-black text-sm text-zinc-700 group-hover:text-[#FF7D00]"><Settings className="w-5 h-5 text-zinc-400 group-hover:text-[#FF7D00] group-hover:scale-110 transition-transform" />기업 정보 수정</div>
                                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#FF7D00] group-hover:translate-x-1 transition-all" />
                            </button>
                            <div className="h-[1px] bg-zinc-50 my-4 mx-6"></div>
                            <button className="w-full flex items-center justify-between p-6 hover:bg-red-50 rounded-[2rem] transition-all group"
                                    onClick={() => { logout(); router.push('/login'); }}>
                                <div className="flex items-center gap-5 font-black text-sm text-red-500"><LogOut className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />로그아웃</div>
                            </button>
                        </div>
                    </div>

                    {/* 프로젝트 목록 요약 */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between pl-2">
                            <h2 className="text-sm font-black uppercase font-mono tracking-[0.3em] text-zinc-400">Project_Snapshot</h2>
                            <span className="px-4 py-1.5 bg-zinc-950 text-white text-[10px] font-black rounded-full font-mono shadow-lg">CNT_{projects.length}</span>
                        </div>
                        {loading ? (
                            <div className="py-24 flex justify-center"><div className="w-10 h-10 border-4 border-[#FF7D00]/20 border-t-[#FF7D00] rounded-full animate-spin"></div></div>
                        ) : projects.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6">
                                {projects.map((project, idx) => (
                                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.05 }} key={project.projectId || idx}
                                                onClick={() => setSelectedProjectForView(project)}
                                                className="group bg-white p-10 rounded-[3rem] shadow-xl shadow-zinc-100 border border-zinc-100 transition-all hover:border-[#FF7D00]/30 hover:translate-y-[-4px] cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <span className={`px-4 py-1.5 text-[10px] font-black tracking-widest rounded-full font-mono uppercase border ${project.status === "OPEN" ? "bg-[#FF7D00]/10 text-[#FF7D00] border-[#FF7D00]/20" : "bg-zinc-50 text-zinc-400"}`}>
                                                {project.status === 'OPEN' ? '모집 중' : '진행/마감'}
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-300 font-mono tracking-widest">ID_{project.projectId}</span>
                                        </div>
                                        <h3 className="text-3xl font-black mb-8 text-zinc-900 group-hover:text-[#FF7D00] transition-colors leading-tight">{project.projectName}</h3>
                                        <div className="flex items-center justify-between pt-8 border-t border-zinc-50">
                                            <div className="flex items-center gap-6 text-xs font-mono text-zinc-400 font-bold uppercase">
                                                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#FF7D00]" /><span>Deadline: {project.deadline}</span></div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); router.push('/client/dashboard'); }} className="px-8 py-4 rounded-2xl bg-zinc-950 text-white text-[11px] font-black uppercase tracking-[0.2em] font-mono hover:bg-[#FF7D00] transition-all shadow-xl shadow-zinc-200">Manage</button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-40 bg-white/40 backdrop-blur-sm rounded-[4rem] border-4 border-dashed border-zinc-100 font-mono font-black text-zinc-200 italic uppercase text-2xl tracking-widest">Null: No_Mission_Detected</div>
                        )}
                    </div>
                </div>
            </main>

            {/* 프로젝트 상세 모달 */}
            <AnimatePresence>
                {selectedProjectForView && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProjectForView(null)} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="relative bg-white rounded-[4rem] w-full max-w-2xl p-12 shadow-2xl border border-zinc-100 overflow-hidden">
                            <div className="flex justify-between items-start mb-12 relative z-10">
                                <div><span className="text-[10px] font-black text-[#FF7D00] uppercase tracking-[0.5em] font-mono block mb-3">Project_Briefing</span><h2 className="text-4xl font-black text-zinc-900 tracking-tighter leading-tight">{selectedProjectForView.projectName}</h2></div>
                                <button onClick={() => setSelectedProjectForView(null)} className="text-zinc-300 hover:text-[#FF7D00] transition-all p-3 bg-zinc-50 rounded-full hover:rotate-90"><XCircle size={32} /></button>
                            </div>
                            <div className="space-y-8 relative z-10">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase mb-3 font-mono tracking-widest">Target_Budget</p>
                                        <p className="text-2xl font-black text-zinc-950 font-mono italic">₩{selectedProjectForView.budget?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase mb-3 font-mono tracking-widest">Current_Status</p>
                                        <p className="text-2xl font-black text-[#FF7D00] font-mono uppercase">{selectedProjectForView.status}</p>
                                    </div>
                                </div>
                                <div className="p-10 bg-zinc-50 rounded-[3rem] border border-zinc-100 shadow-inner">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase mb-4 font-mono tracking-[0.3em]">Mission_Statement</p>
                                    <p className="text-base font-medium text-zinc-600 leading-relaxed italic">"{selectedProjectForView.detail || "제공된 상세 내용이 없습니다."}"</p>
                                </div>
                                <div className="flex gap-5 pt-6">
                                    <button onClick={() => setSelectedProjectForView(null)} className="flex-1 py-6 bg-zinc-100 text-zinc-500 rounded-3xl font-black text-xs uppercase tracking-widest font-mono hover:bg-zinc-200 transition-all">Close</button>
                                    <button onClick={() => router.push('/client/dashboard')} className="flex-[2] py-6 bg-zinc-950 text-white rounded-3xl font-black text-xs uppercase tracking-widest font-mono hover:bg-[#FF7D00] shadow-[0_20px_40px_rgba(255,125,0,0.2)] flex items-center justify-center gap-3 transition-all group">Manage_Now <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ProfileEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={(newName) => setUser(prev => prev ? { ...prev, nickname: newName } : null)} />
            <CompanyEditModal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} onSuccess={() => {}} />
        </div>
    );
}