'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { Briefcase, User, Settings, LogOut, ChevronRight, Activity, DollarSign, Calendar, XCircle, ExternalLink, Heart, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import ProfileEditModal from '@/components/client_mypage/page';
import CompanyEditModal from '@/components/client_mypage/CompanyEditModal';
import BookmarkedFreelancers from '@/components/client_mypage/BookmarkedFreelancers';

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

    if (!authorized) return <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-[#FF7D00] font-black text-xl animate-pulse">LOADING_INTERFACE...</div>;

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-24 relative overflow-hidden font-sans">
            <div className="pointer-events-none fixed z-0 w-[400px] h-[400px] rounded-full bg-[#FF7D00]/15 blur-[150px] transition-all duration-300"
                 style={{ left: cursor.x - 200, top: cursor.y - 200 }} />

            {/* 네비게이션 */}
            <nav className="w-full py-6 px-10 bg-white/80 backdrop-blur-2xl border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/client/dashboard")}>
                    <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                </div>
                <div className="flex gap-6 items-center">
                    <button onClick={() => router.push('/client/dashboard')} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 tracking-widest transition uppercase font-mono">DASHBOARD</button>
                    <button onClick={() => router.push("/client/projects/new")} className="px-6 py-2.5 bg-[#FF7D00] text-white rounded-xl text-xs font-black tracking-widest hover:brightness-110 transition shadow-md shadow-orange-100 font-mono">NEW_PROJECT</button>
                </div>
            </nav>

            {/* 헤더 섹션 */}
            <section className="relative pt-20 pb-16 px-10 bg-white border-b border-zinc-100 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
                </div>
                <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-tr from-[#FF7D00] to-[#FFB066] shadow-2xl flex items-center justify-center text-5xl text-white font-black font-mono border-4 border-white">
                            {user?.name?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div>
                            <div className="flex justify-center md:justify-start gap-3 text-[10px] text-zinc-400 mb-3 font-bold font-mono tracking-widest">
                                <span className="bg-orange-50 px-2.5 py-1 rounded-lg text-[#FF7D00] border border-orange-100">CLIENT_ACCESS</span>
                                <span className="bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-100">STABLE_CONNECTION</span>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter mb-2">
                                <span className="text-[#FF7D00]">{user?.nickname || user?.name || '마스터'}</span>님의 워크스페이스
                            </h1>
                            <p className="text-zinc-400 font-medium font-mono text-sm">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </section>

            <main className="max-w-6xl mx-auto px-10 py-16 relative z-10 space-y-16">

                {/* 🚀 [NEW] 프리랜서 관리 섹션 (찜 & 제안) - 넓은 레이아웃 */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* 북마크 영역 */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase font-mono tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                <Heart className="w-4 h-4 text-[#FF7D00]" fill="#FF7D00" /> Bookmarked_Talents
                            </h3>
                        </div>
                        <BookmarkedFreelancers />
                    </div>

                    {/* 선제안 내역 (껍데기) */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase font-mono tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                            <Send className="w-4 h-4 text-[#FF7D00]" /> Sent_Proposals_History
                        </h3>
                        <div className="bg-zinc-100/50 rounded-[2.5rem] border border-zinc-200 border-dashed p-10 flex flex-col items-center justify-center text-center group">
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-zinc-200 mb-4 group-hover:text-[#FF7D00] transition-colors">
                                <Sparkles size={28} />
                            </div>
                            <p className="text-sm font-bold text-zinc-500 mb-1">준비 중인 프리미엄 기능</p>
                            <p className="text-[11px] font-medium text-zinc-400 leading-relaxed">
                                원하는 인재를 직접 스카우트하세요.<br/>제안 내역과 피드백을 이곳에서 관리할 수 있습니다.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8 border-t border-zinc-100">
                    {/* 왼쪽: 설정 메뉴 */}
                    <div className="lg:col-span-1 space-y-6">
                        <h3 className="text-sm font-black uppercase font-mono tracking-[0.2em] text-zinc-400">Settings</h3>
                        <div className="bg-white p-3 rounded-[2rem] shadow-xl border border-zinc-100 overflow-hidden">
                            <button onClick={() => setIsEditModalOpen(true)} className="w-full flex items-center justify-between p-5 hover:bg-orange-50/50 rounded-2xl transition group">
                                <div className="flex items-center gap-4 font-bold text-sm text-zinc-700 group-hover:text-[#FF7D00]"><User className="w-5 h-5 text-zinc-400 group-hover:text-[#FF7D00]" />프로필 편집</div>
                                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#FF7D00]" />
                            </button>
                            <button onClick={() => setIsCompanyModalOpen(true)} className="w-full flex items-center justify-between p-5 hover:bg-orange-50/50 rounded-2xl transition group">
                                <div className="flex items-center gap-4 font-bold text-sm text-zinc-700 group-hover:text-[#FF7D00]"><Settings className="w-5 h-5 text-zinc-400 group-hover:text-[#FF7D00]" />기업 정보 수정</div>
                                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#FF7D00]" />
                            </button>
                            <div className="h-[1px] bg-zinc-50 my-2 mx-5"></div>
                            <button className="w-full flex items-center justify-between p-5 hover:bg-red-50 rounded-2xl transition group"
                                    onClick={() => { localStorage.removeItem('accessToken'); router.push('/login'); }}>
                                <div className="flex items-center gap-4 font-bold text-sm text-red-500"><LogOut className="w-5 h-5 text-red-400" />로그아웃</div>
                            </button>
                        </div>
                    </div>

                    {/* 오른쪽: 내 프로젝트 목록 */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase font-mono tracking-[0.2em] text-zinc-400">My_Projects_List</h2>
                            <span className="px-3 py-1 bg-zinc-950 text-white text-[10px] font-black rounded-lg font-mono">CNT_{projects.length}</span>
                        </div>

                        {loading ? (
                            <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-[#FF7D00] border-t-transparent rounded-full animate-spin"></div></div>
                        ) : projects.length > 0 ? (
                            <div className="grid grid-cols-1 gap-5">
                                {projects.map((project, idx) => (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.05 }}
                                        key={project.projectId || idx}
                                        onClick={() => setSelectedProjectForView(project)}
                                        className="group bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 transition-all hover:border-[#FF7D00] hover:shadow-2xl hover:shadow-orange-100/40 cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="relative z-10">
                                            <span className={`inline-block px-3 py-1 text-[9px] font-black tracking-widest rounded-lg mb-4 font-mono uppercase ${
                                                (project.status === "모집 중" || project.status === "OPEN") ? "bg-[#FF7D00] text-white" :
                                                    (project.status === "진행 중" || project.status === "IN_PROGRESS") ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
                                            }`}>{project.status === 'OPEN' ? '모집 중' : project.status === 'IN_PROGRESS' ? '진행 중' : project.status}</span>
                                            <h3 className="text-2xl font-black group-hover:text-[#FF7D00] transition-colors tracking-tighter mb-8">{project.projectName}</h3>
                                            <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                                                <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 font-bold uppercase"><Calendar className="w-4 h-4 text-[#FF7D00]" /><span>Deadline: {project.deadline}</span></div>
                                                <button onClick={(e) => { e.stopPropagation(); router.push('/client/dashboard'); }} className="px-7 py-3 rounded-2xl bg-zinc-50 text-zinc-900 text-[11px] font-black uppercase tracking-widest font-mono hover:bg-[#FF7D00] hover:text-white transition-all">Manage</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100 font-mono font-black text-zinc-200 italic uppercase">Null: No_Mission_Detected</div>
                        )}
                    </div>
                </div>
            </main>

            {/* 프로젝트 상세 모달 */}
            <AnimatePresence>
                {selectedProjectForView && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProjectForView(null)} className="absolute inset-0 bg-zinc-950/70 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[3.5rem] w-full max-w-xl p-12 shadow-2xl border border-orange-100 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-32 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div><span className="text-[10px] font-black text-[#FF7D00] uppercase tracking-[0.4em] font-mono block mb-2">Project_Briefing</span><h2 className="text-3xl font-black text-zinc-900 tracking-tighter leading-tight">{selectedProjectForView.projectName}</h2></div>
                                <button onClick={() => setSelectedProjectForView(null)} className="text-zinc-300 hover:text-[#FF7D00] transition-colors p-2 bg-zinc-50 rounded-full"><XCircle size={28} /></button>
                            </div>
                            <div className="space-y-8 relative z-10">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase mb-2 font-mono tracking-widest">Target_Budget</p>
                                        <p className="text-xl font-black text-zinc-900">₩{selectedProjectForView.budget?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase mb-2 font-mono tracking-widest">Current_Status</p>
                                        <p className="text-xl font-black text-[#FF7D00]">{selectedProjectForView.status}</p>
                                    </div>
                                </div>
                                <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase mb-3 font-mono tracking-widest">Mission_Statement</p>
                                    <p className="text-sm font-medium text-zinc-600 leading-relaxed italic">"{selectedProjectForView.detail || "제공된 상세 내용이 없습니다."}"</p>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setSelectedProjectForView(null)} className="flex-1 py-5 bg-zinc-100 text-zinc-500 rounded-2xl font-black text-xs uppercase tracking-widest font-mono hover:bg-zinc-200 transition-all">Close</button>
                                    <button onClick={() => router.push('/client/dashboard')} className="flex-1 py-5 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest font-mono hover:bg-[#FF7D00] shadow-xl flex items-center justify-center gap-3 transition-all">Manage_Now <ExternalLink size={16} /></button>
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