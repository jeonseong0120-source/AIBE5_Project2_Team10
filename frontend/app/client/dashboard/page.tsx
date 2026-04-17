'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import {
    User, Users, CheckCircle, XCircle, Edit, Trash2,
    Calendar, DollarSign, Activity, ChevronRight,
    Briefcase, Heart, Send, Sparkles, Star, MapPin, Globe, Loader2, Clock, ArrowUpRight, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientDashboardPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookmarksLoading, setBookmarksLoading] = useState(false);
    const [authorized, setAuthorized] = useState(false);

    const [activeMainTab, setActiveMainTab] = useState<'PROJECTS' | 'BOOKMARKS' | 'PROPOSALS'>('PROJECTS');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    // 🎯 [지원자 관리] 상태
    const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
    const [applicantsByProject, setApplicantsByProject] = useState<{ [key: number]: any[] }>({});
    const [loadingApplicants, setLoadingApplicants] = useState<{ [key: number]: boolean }>({});
    const [selectedProjectForApplicant, setSelectedProjectForApplicant] = useState<any>(null);

    // 🎯 [역제안 관리] 신규 상태
    const [sentProposals, setSentProposals] = useState<any[]>([]);
    const [proposalsLoading, setProposalsLoading] = useState(false);

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
                const roles = res.data.role || "";
                if (!roles.includes("CLIENT") && !roles.includes("BOTH")) {
                    alert("클라이언트 또는 BOTH 계정만 접근 가능합니다.");
                    if (roles.includes("FREELANCER")) return router.replace("/");
                    return router.replace("/onboarding");
                }
                setAuthorized(true);
            } catch (err) {
                router.replace("/login");
            }
        };
        checkAccess();
    }, [router]);

    // 1. 운영 프로젝트 조회
    const fetchMyProjects = async () => {
        try {
            const { data } = await api.get('/v1/projects/me');
            const projectArray = data.content || data || [];
            setProjects(projectArray.filter((p: any) => p.status !== 'COMPLETED'));
        } catch (err) { console.error("로드 실패", err); } finally { setLoading(false); }
    };

    // 2. 관심 인재 조회
    const fetchBookmarks = async () => {
        setBookmarksLoading(true);
        try {
            const { data } = await api.get('/bookmarks/freelancers');
            setBookmarks(data.content || []);
        } catch (err) { console.error("찜 목록 로드 실패", err); } finally { setBookmarksLoading(false); }
    };

    // 3. 🔍 [NEW] 보낸 역제안 목록 조회
    const fetchSentProposals = async () => {
        setProposalsLoading(true);
        try {
            const { data } = await api.get('/v1/proposals/sent');
            setSentProposals(data || []);
        } catch (err) {
            console.error("제안 로드 실패", err);
        } finally {
            setProposalsLoading(false);
        }
    };

    const handleRemoveBookmark = async (profileId: number) => {
        if (!confirm("찜 목록에서 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/bookmarks/freelancers/${profileId}`);
            fetchBookmarks();
        } catch (err) { alert("삭제에 실패했습니다."); }
    };

    useEffect(() => {
        if (authorized) {
            if (activeMainTab === 'PROJECTS') fetchMyProjects();
            if (activeMainTab === 'BOOKMARKS') fetchBookmarks();
            if (activeMainTab === 'PROPOSALS') fetchSentProposals(); // 역제안 탭 활성화 시 호출
        }
    }, [authorized, activeMainTab]);

    // 기존 프로젝트 수정/삭제/지원자 핸들러 (유지)
    const handleEditProjectClick = (projectId: number) => router.push(`/client/projects/${projectId}/edit`);
    const handleStatusChange = async (projectId: number, action: 'start' | 'close') => {
        const msg = action === 'start' ? '시작' : '마감';
        if (!confirm(`프로젝트를 ${msg} 처리하시겠습니까?`)) return;
        try { await api.patch(`/v1/projects/${projectId}/${action}`); fetchMyProjects(); } catch (err) { alert('상태 변경 실패'); }
    };
    const handleDeleteProject = async (projectId: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try { await api.delete(`/v1/projects/${projectId}`); fetchMyProjects(); } catch (err) { alert('삭제 실패'); }
    };

    const handleViewApplicants = async (project: any) => {
        const pid = project.projectId;
        if (expandedProjectId === pid) { setExpandedProjectId(null); return; }
        setSelectedProjectForApplicant(project);
        setExpandedProjectId(pid);
        if (applicantsByProject[pid]) return;
        setLoadingApplicants(prev => ({ ...prev, [pid]: true }));
        try {
            const { data } = await api.get(`/projects/${pid}/applications`);
            setApplicantsByProject(prev => ({ ...prev, [pid]: data }));
        } catch (err) { setApplicantsByProject(prev => ({ ...prev, [pid]: [] })); }
        finally { setLoadingApplicants(prev => ({ ...prev, [pid]: false })); }
    };

    const handleApplicationStatus = async (applicationId: number, status: 'ACCEPTED' | 'REJECTED') => {
        try {
            await api.patch(`/applications/${applicationId}/status`, { status });
            alert(`지원자가 ${status === 'ACCEPTED' ? '수락' : '거절'} 처리되었습니다.`);
            if (selectedProjectForApplicant) {
                const { data } = await api.get(`/projects/${selectedProjectForApplicant.projectId}/applications`);
                setApplicantsByProject(prev => ({ ...prev, [selectedProjectForApplicant.projectId]: data }));
            }
            fetchMyProjects();
        } catch (err) { alert('상태 처리 중 오류가 발생했습니다.'); }
    };

    if (!authorized || loading) return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-[#FF7D00] font-black text-xl animate-pulse uppercase font-mono">
            Checking_Authorization...
        </div>
    );

    const filteredProjects = projects.filter(p => filterStatus === 'ALL' || p.status === filterStatus);

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 relative overflow-hidden font-sans">
            <div className="pointer-events-none fixed z-0 w-[300px] h-[300px] rounded-full bg-[#FF7D00]/20 blur-[120px] transition-all duration-200"
                 style={{ left: cursor.x - 150, top: cursor.y - 150 }} />

            <nav className="w-full py-5 px-10 bg-white/80 backdrop-blur-xl border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/")}>
                    <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                </div>
                <div className="flex gap-4 items-center relative z-10 md:gap-6">
                    <button onClick={() => router.push('/client/mypage')} className="text-xs font-black text-zinc-500 hover:text-zinc-950 tracking-widest transition uppercase font-mono">MY_PAGE</button>
                    <NotificationBell />
                    <button onClick={() => router.push("/client/projects/new")} className="px-6 py-2.5 bg-[#FF7D00] text-white rounded-xl text-xs font-black tracking-widest hover:brightness-110 transition shadow-lg shadow-orange-100 uppercase font-mono">Register_Project</button>
                </div>
            </nav>

            <header className="relative pt-16 pb-12 px-8 bg-white border-b border-zinc-200 overflow-hidden">
                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-8 h-[2px] bg-[#FF7D00]"></span>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono">Work_Hub</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-8">대시보드</h1>

                    <div className="flex gap-8 border-b border-zinc-100">
                        {[
                            { id: 'PROJECTS', label: '운영 프로젝트', icon: <Briefcase size={16} /> },
                            { id: 'BOOKMARKS', label: '관심 인재', icon: <Heart size={16} /> },
                            { id: 'PROPOSALS', label: '제안 현황', icon: <Send size={16} /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveMainTab(tab.id as any)}
                                className={`flex items-center gap-2 pb-4 text-sm font-black transition-all relative ${
                                    activeMainTab === tab.id ? 'text-[#FF7D00]' : 'text-zinc-400 hover:text-zinc-600'
                                }`}
                            >
                                {tab.icon} {tab.label}
                                {activeMainTab === tab.id && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF7D00] rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-8 py-12 relative z-10">
                {/* 1. 운영 프로젝트 섹션 */}
                {activeMainTab === 'PROJECTS' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                            {/* 🔍 [수정 포인트] 제목 옆에 등록 버튼 추가 */}
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-black tracking-tight text-zinc-950 uppercase font-mono">내 프로젝트 <span className="text-[#FF7D00] ml-1">[{filteredProjects.length}]</span></h2>
                                <button
                                    onClick={() => router.push("/client/projects/new")}
                                    className="p-2 bg-[#FF7D00]/10 text-[#FF7D00] rounded-full hover:bg-[#FF7D00] hover:text-white transition-all shadow-sm"
                                    title="새 프로젝트 등록"
                                >
                                    <Plus size={20} strokeWidth={3} />
                                </button>
                            </div>

                            <div className="flex gap-1.5 p-1.5 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                                {[{ id: 'ALL', label: '전체' }, { id: 'OPEN', label: '모집중' }, { id: 'IN_PROGRESS', label: '진행중' }, { id: 'CLOSED', label: '마감됨' }].map((s) => (
                                    <button key={s.id} onClick={() => setFilterStatus(s.id)} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest uppercase font-mono ${filterStatus === s.id ? 'bg-zinc-950 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}>{s.label}</button>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-6">
                            {filteredProjects.map((project, idx) => {
                                const isExpanded = expandedProjectId === project.projectId;
                                const projectApplicants = applicantsByProject[project.projectId] || [];
                                return (
                                    <div key={project.projectId} className="flex flex-col gap-2">
                                        <div className={`group bg-white p-8 rounded-[2rem] border transition-all ${isExpanded ? 'border-[#FF7D00] shadow-xl ring-1 ring-[#FF7D00]' : 'border-zinc-100 shadow-sm hover:border-[#FF7D00]'}`}>
                                            <div className="flex flex-col md:flex-row justify-between items-center w-full">
                                                <div className="flex-1 w-full">
                                                    <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase font-mono border ${project.status === 'OPEN' ? 'bg-[#FF7D00]/10 text-[#FF7D00] border-[#FF7D00]/20' : 'bg-zinc-100 text-zinc-500'}`}>{project.status}</span>
                                                    <h3 className="text-2xl font-black text-zinc-900 mt-4 group-hover:text-[#FF7D00] transition-colors tracking-tight">{project.projectName}</h3>
                                                    <div className="flex gap-6 mt-4 text-xs font-bold text-zinc-400 font-mono uppercase">
                                                        <span><DollarSign size={14} className="inline mr-1 text-[#FF7D00]"/>{project.budget?.toLocaleString()}원</span>
                                                        <span><Calendar size={14} className="inline mr-1 text-[#FF7D00]"/>{project.deadline} 마감</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 mt-8 md:mt-0">
                                                    <div className="flex gap-1 px-3 border-x border-zinc-100">
                                                        <button onClick={() => handleEditProjectClick(project.projectId)} className="p-3 text-zinc-300 hover:text-[#7A4FFF] transition-all"><Edit size={18} /></button>
                                                        <button onClick={() => handleDeleteProject(project.projectId)} className="p-3 text-zinc-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                                                    </div>
                                                    <button onClick={() => handleViewApplicants(project)} className={`px-8 py-4 rounded-xl font-black text-xs tracking-widest uppercase transition-all flex items-center gap-2 ${isExpanded ? 'bg-[#FF7D00] text-white shadow-orange-200' : 'bg-zinc-950 text-white shadow-zinc-200 hover:bg-[#FF7D00]'}`}>
                                                        <Users size={16} /> Applicants {projectApplicants.length > 0 && `[${projectApplicants.length}]`}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {/* 지원자 리스트 인라인 확장 */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                    <div className="mt-2 mb-10 p-2 bg-zinc-100/50 rounded-[2rem] border border-zinc-200/50">
                                                        {loadingApplicants[project.projectId] ? (
                                                            <div className="py-16 flex flex-col items-center justify-center gap-4 text-zinc-400 font-mono font-bold"><Loader2 className="w-8 h-8 animate-spin text-[#FF7D00]" /><span className="animate-pulse tracking-widest text-xs uppercase">Syncing_Applicants...</span></div>
                                                        ) : projectApplicants.length === 0 ? (
                                                            <div className="py-16 text-center text-zinc-300 font-black border-2 border-dashed border-zinc-200 rounded-[1.5rem] text-xl font-mono uppercase bg-white">No_Applicants_Yet</div>
                                                        ) : (
                                                            <div className="space-y-3 p-4">
                                                                {projectApplicants.map((app: any) => (
                                                                    <div key={app.applicationId} className={`p-6 bg-white rounded-2xl border transition-all flex flex-col md:flex-row gap-6 items-center hover:shadow-md ${app.status === 'ACCEPTED' ? 'border-[#FF7D00] shadow-md shadow-orange-50' : 'border-zinc-100'}`}>
                                                                        <div className="flex items-center gap-5 flex-1">
                                                                            <div className="w-14 h-14 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden cursor-pointer" onClick={() => router.push(`/freelancer/${app.freelancerId}`)}>{app.freelancerProfileImageUrl ? <img src={app.freelancerProfileImageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-300"><User size={24} /></div>}</div>
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-2 mb-1"><h4 className="font-black text-lg text-zinc-900">{app.freelancerNickname}</h4><span className="text-[10px] font-black text-[#FF7D00] bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase">매칭 {Math.round(app.matchingRate)}%</span></div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-8 w-full md:w-auto">
                                                                            <div className="text-right"><p className="text-xl font-black text-zinc-900 font-mono">₩{(app.bidPrice || 0).toLocaleString()}</p><p className="text-[10px] font-bold text-zinc-300 uppercase font-mono">{app.status}</p></div>
                                                                            <div className="flex gap-2 min-w-[140px] justify-end">
                                                                                {app.status === 'PENDING' ? (
                                                                                    <><button onClick={() => handleApplicationStatus(app.applicationId, 'ACCEPTED')} className="px-5 py-2.5 bg-zinc-950 text-white rounded-xl text-[10px] font-black hover:bg-[#FF7D00] transition-all uppercase font-mono">수락</button><button onClick={() => handleApplicationStatus(app.applicationId, 'REJECTED')} className="px-5 py-2.5 bg-white border border-zinc-200 text-zinc-400 rounded-xl text-[10px] font-black hover:text-red-500 hover:border-red-200 transition-all uppercase font-mono">거절</button></>
                                                                                ) : (
                                                                                    <div className={`px-5 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 uppercase font-mono ${app.status === 'ACCEPTED' ? 'bg-orange-50 text-[#FF7D00] border border-orange-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>{app.status === 'ACCEPTED' ? <CheckCircle size={14} /> : <XCircle size={14} />}{app.status}</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* 2. 관심 인재 섹션 */}
                {activeMainTab === 'BOOKMARKS' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="flex items-center justify-between"><h2 className="text-xl font-black tracking-tight text-zinc-950 uppercase font-mono">관심 인재 <span className="text-[#FF7D00] ml-1">[{bookmarks.length}]</span></h2></div>
                        {bookmarksLoading ? ( <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#FF7D00]" /></div> ) : bookmarks.length === 0 ? ( <div className="text-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-zinc-100 font-black text-zinc-200 italic uppercase tracking-tighter">Null: No_Bookmarked_Talents</div> ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {bookmarks.map((freelancer, idx) => (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} key={freelancer.profileId} className="group bg-white p-8 rounded-3xl border border-zinc-100 hover:border-[#FF7D00] hover:shadow-2xl transition-all relative">
                                        <button onClick={() => handleRemoveBookmark(freelancer.profileId)} className="absolute top-6 right-6 p-2.5 bg-zinc-50 rounded-xl text-zinc-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                                        <div className="flex items-center gap-6 mb-8 cursor-pointer" onClick={() => router.push(`/freelancer/${freelancer.profileId}`)}><div className="w-20 h-20 rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-200 group-hover:border-[#FF7D00] transition-colors">{freelancer.profileImageUrl ? <img src={freelancer.profileImageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-300"><User size={32} /></div>}</div><div><div className="flex items-center gap-2 mb-1"><h3 className="text-2xl font-black text-zinc-900 group-hover:text-[#FF7D00] transition-colors">{freelancer.userName}</h3><span className="px-2 py-0.5 bg-zinc-950 text-white text-[9px] font-black rounded font-mono">{freelancer.gradeName}</span></div><div className="flex items-center gap-1.5 text-xs font-bold text-[#FF7D00]"><Star size={14} fill="#FF7D00" /><span>{freelancer.averageRating.toFixed(1)}</span><span className="text-zinc-300 ml-1">({freelancer.reviewCount} Reviews)</span></div></div></div>
                                        <p className="text-sm font-medium text-zinc-500 line-clamp-2 leading-relaxed h-10 italic">"{freelancer.introduction || "자기소개가 없습니다."}"</p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* 3. 역제안 현황 섹션 */}
                {activeMainTab === 'PROPOSALS' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black tracking-tight text-zinc-950 uppercase font-mono">
                                보낸 제안 <span className="text-[#FF7D00] ml-1">[{sentProposals.length}]</span>
                            </h2>
                        </div>

                        {proposalsLoading ? (
                            <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#FF7D00]" /></div>
                        ) : sentProposals.length === 0 ? (
                            <div className="bg-zinc-100/50 rounded-[2.5rem] border border-zinc-200 border-dashed p-16 flex flex-col items-center justify-center text-center">
                                <Sparkles size={40} className="text-zinc-200 mb-4" />
                                <p className="text-lg font-black text-zinc-500 mb-1 italic">NO_SENT_PROPOSALS_YET</p>
                                <p className="text-sm font-medium text-zinc-400 leading-relaxed max-w-sm">관심 인재에게 협업을 지리게 요청해 보세요!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5">
                                {sentProposals.map((proposal, idx) => (
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.05 }}
                                        key={proposal.proposalId}
                                        className="bg-white p-8 rounded-[2rem] border border-zinc-100 hover:border-[#FF7D00] hover:shadow-xl transition-all group flex flex-col md:flex-row justify-between items-center gap-6"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="bg-zinc-950 text-white px-2.5 py-0.5 rounded text-[9px] font-black uppercase font-mono">SENT_PROPOSAL</span>
                                                <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase font-mono border ${
                                                    proposal.status === 'ACCEPTED' ? 'bg-orange-50 text-[#FF7D00] border-orange-100' :
                                                        proposal.status === 'REJECTED' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                                                }`}>
                                                    {proposal.statusDescription}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-black text-zinc-900 group-hover:text-[#FF7D00] transition-colors mb-2 tracking-tight">
                                                To: {proposal.freelancerName}
                                            </h3>
                                            <p className="text-xs font-bold text-zinc-400 uppercase font-mono mb-6 flex items-center gap-2">
                                                <Briefcase size={14} className="text-[#FF7D00]" /> Target_Project: {proposal.projectName}
                                            </p>
                                            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-sm font-medium text-zinc-500 leading-relaxed italic">
                                                "{proposal.message || "보낸 메시지가 없습니다."}"
                                            </div>
                                        </div>

                                        <div className="w-full md:w-auto flex flex-row md:flex-col justify-between items-end gap-4 min-w-[200px]">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-widest mb-1">Offered_Price</p>
                                                <p className="text-2xl font-black text-zinc-900 font-mono italic">₩{proposal.offeredPrice.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-widest mb-1">Sent_At</p>
                                                <p className="text-xs font-bold text-zinc-500 flex items-center justify-end gap-1">
                                                    <Clock size={12} /> {new Date(proposal.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/freelancer/${proposal.freelancerProfileId}`)}
                                                className="w-full md:w-auto px-6 py-3 bg-zinc-50 text-zinc-400 hover:text-[#FF7D00] hover:bg-orange-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all font-mono flex items-center justify-center gap-2"
                                            >
                                                View_Profile <ArrowUpRight size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </main>
        </div>
    );
}