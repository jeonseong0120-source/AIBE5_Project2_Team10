'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import {
    User, Users, CheckCircle, XCircle, Edit, Trash2,
    Calendar, DollarSign, Activity, ChevronRight,
    Briefcase, Heart, Send, Sparkles, Star, MapPin, Globe, Loader2, Clock, ArrowUpRight, Search, FileText, Inbox, Bookmark, Plus, ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FreelancerDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // 🎯 탭 상태
    const [activeMainTab, setActiveMainTab] = useState<'APPLICATIONS' | 'RECEIVED_PROPOSALS' | 'BOOKMARKS'>('APPLICATIONS');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    // 🎯 [추가] 정렬 상태 (최신순/과거순)
    const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

    // 🎯 1. 지원 내역 상태
    const [applications, setApplications] = useState<any[]>([]);
    const [appsLoading, setAppsLoading] = useState(false);
    const [expandedAppId, setExpandedAppId] = useState<number | null>(null);

    // 🎯 2. 받은 제안 상태
    const [receivedProposals, setReceivedProposals] = useState<any[]>([]);
    const [proposalsLoading, setProposalsLoading] = useState(false);

    // 🎯 3. 관심 프로젝트 상태
    const [bookmarkedProjects, setBookmarkedProjects] = useState<any[]>([]);
    const [bookmarksLoading, setBookmarksLoading] = useState(false);
    const [bookmarkPage, setBookmarkPage] = useState(0);
    const [hasMoreBookmarks, setHasMoreBookmarks] = useState(true);

    // 🚀 1. 권한 체크
    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await api.get("/v1/users/me");
                const roles = res.data.role || "";
                if (!roles.includes("FREELANCER") && !roles.includes("BOTH")) {
                    alert("프리랜서 또는 BOTH 계정만 접근 가능합니다.");
                    if (roles.includes("CLIENT")) return router.replace("/client/dashboard");
                    return router.replace("/onboarding");
                }
                setAuthorized(true);
            } catch (err) {
                router.replace("/login");
            } finally {
                setLoading(false);
            }
        };
        checkAccess();
    }, [router]);

    // 🚀 2. 지원 내역 API 호출
    const fetchApplications = async () => {
        setAppsLoading(true);
        try {
            const { data } = await api.get('/applications/me');
            setApplications(data || []);
        } catch (error) {
            console.error("지원 내역 로드 실패:", error);
        } finally {
            setAppsLoading(false);
        }
    };

    // 🚀 3. 받은 제안 API 호출
    const fetchReceivedProposals = async () => {
        setProposalsLoading(true);
        try {
            const { data } = await api.get('/v1/proposals/received');
            setReceivedProposals(data || []);
        } catch (error) {
            console.error("받은 제안 로드 실패:", error);
        } finally {
            setProposalsLoading(false);
        }
    };

    // 🚀 4. 관심 프로젝트(북마크) API 호출
    const fetchBookmarks = useCallback(async (isLoadMore = false) => {
        if (!isLoadMore) {
            setBookmarksLoading(true);
            setBookmarkPage(0);
        }
        const targetPage = isLoadMore ? bookmarkPage + 1 : 0;
        try {
            const { data } = await api.get(`/v1/bookmarks/projects?page=${targetPage}&size=9`);
            const newContent = data.content || [];

            setBookmarkedProjects(prev => isLoadMore ? [...prev, ...newContent] : newContent);
            setBookmarkPage(targetPage);
            setHasMoreBookmarks(!data.last);
        } catch (err) {
            console.error("관심 프로젝트 로드 실패", err);
        } finally {
            setBookmarksLoading(false);
        }
    }, [bookmarkPage]);

    // 🚀 5. 관심 프로젝트(북마크) 삭제 API
    const handleRemoveBookmark = async (projectId: number) => {
        if (!confirm("관심 프로젝트에서 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/v1/bookmarks/projects/${projectId}`);
            fetchBookmarks(false);
        } catch (err) {
            alert("삭제에 실패했습니다.");
        }
    };

    // 🚀 제안 수락/거절 PATCH API 호출
    const handleProposalStatus = async (proposalId: number, status: 'ACCEPTED' | 'REJECTED') => {
        const actionText = status === 'ACCEPTED' ? '수락' : '거절';
        if (!confirm(`이 제안을 ${actionText}하시겠습니까?`)) return;

        try {
            await api.patch(`/v1/proposals/${proposalId}/status`, { status });
            alert(`제안이 ${actionText}되었습니다.`);
            fetchReceivedProposals();
        } catch (error) {
            console.error("제안 상태 변경 실패:", error);
            alert('상태 변경에 실패했습니다.');
        }
    };

    // 탭 이동 시 API 분기 호출
    useEffect(() => {
        if (!authorized) return;
        if (activeMainTab === 'APPLICATIONS') fetchApplications();
        if (activeMainTab === 'RECEIVED_PROPOSALS') fetchReceivedProposals();
        if (activeMainTab === 'BOOKMARKS') fetchBookmarks(false);
    }, [authorized, activeMainTab]);

    const handleToggleExpand = (id: number) => {
        setExpandedAppId(expandedAppId === id ? null : id);
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-[#7A4FFF] font-black text-xl animate-pulse uppercase font-mono">인증 정보를 확인 중입니다...</div>
    );

    if (!authorized) return null;

    // 🎯 [수정] 지원 내역 정렬 적용
    const sortedApplications = [...applications]
        .filter(a => filterStatus === 'ALL' || a.status === filterStatus)
        .sort((a, b) => {
            const timeA = new Date(a.appliedAt || 0).getTime();
            const timeB = new Date(b.appliedAt || 0).getTime();
            return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
        });

    // 🎯 [수정] 받은 제안 정렬 적용
    const sortedProposals = [...receivedProposals].sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 relative overflow-hidden font-sans">
            {/* 🎨 [배경] 깔끔한 그리드 패턴 */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px), linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px, 100px 100px, 100px 100px' }} />
            </div>

            <nav className="w-full py-6 px-10 bg-white/70 backdrop-blur-2xl border-b border-zinc-200/50 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="font-black text-2xl tracking-tighter cursor-pointer group" onClick={() => router.push("/")}>
                    <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF] group-hover:drop-shadow-[0_0_8px_#7A4FFF]">Near</span>
                </div>
                <div className="flex gap-4 items-center relative z-10 md:gap-8">
                    <button onClick={() => router.push('/freelancer/mypage')} className="text-xs font-black text-zinc-400 hover:text-zinc-950 tracking-[0.2em] transition uppercase font-mono">마이페이지</button>
                    <NotificationBell />
                    {/* 🎯 [수정] 경로 변경: /projects -> /freelancer/explore */}
                    <button onClick={() => router.push("/freelancer/explore")} className="px-7 py-3 bg-zinc-950 text-white rounded-2xl text-xs font-black tracking-widest hover:bg-[#7A4FFF] transition-all shadow-xl flex items-center gap-2 uppercase font-mono">
                        <Search size={14} /> 프로젝트 찾기
                    </button>
                </div>
            </nav>

            <header className="relative pt-24 pb-16 px-8 overflow-hidden max-w-6xl mx-auto">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-6">
                    <span className="w-12 h-[3px] bg-[#7A4FFF] rounded-full"></span>
                    <span className="text-[11px] font-black text-[#7A4FFF] uppercase tracking-[0.4em] font-mono">작업자 콘솔</span>
                </motion.div>
                <h1 className="text-5xl font-black tracking-tighter mb-12 text-zinc-950">프리랜서 <span className="text-zinc-400">대시보드</span></h1>

                <div className="flex gap-10 border-b border-zinc-200/50">
                    {[
                        { id: 'APPLICATIONS', label: '지원 내역', icon: <FileText size={18} /> },
                        { id: 'RECEIVED_PROPOSALS', label: '받은 제안', icon: <Inbox size={18} /> },
                        { id: 'BOOKMARKS', label: '관심 프로젝트', icon: <Bookmark size={18} /> }
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveMainTab(tab.id as any)} className={`flex items-center gap-2.5 pb-6 text-sm font-black transition-all relative ${activeMainTab === tab.id ? 'text-[#7A4FFF]' : 'text-zinc-400 hover:text-zinc-600'}`}>
                            {tab.icon} {tab.label}
                            {activeMainTab === tab.id && <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-1 bg-[#7A4FFF] rounded-t-full shadow-[0_-4px_10px_#7A4FFF]" />}
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-8 py-16 relative z-10">

                {/* 🎯 1. 지원 내역 섹션 (APPLICATIONS) */}
                {activeMainTab === 'APPLICATIONS' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black tracking-tight text-zinc-950 uppercase font-mono">나의 지원 내역</h2>
                                <span className="px-3 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-black text-[#7A4FFF]">총 {sortedApplications.length}건</span>
                                {/* 🎯 [수정] 경로 변경: /projects -> /freelancer/explore */}
                                <button onClick={() => router.push("/freelancer/explore")} className="p-2.5 bg-white border border-zinc-200 text-[#7A4FFF] rounded-xl hover:bg-[#7A4FFF] hover:text-white transition-all shadow-sm group"><Search size={20} className="group-hover:scale-110 transition-transform duration-300" strokeWidth={3} /></button>
                            </div>

                            {/* 🎯 [추가] 필터 및 정렬 컨트롤 */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex gap-2 p-2 bg-white/50 backdrop-blur-md border border-zinc-200 rounded-3xl">
                                    {[{ id: 'ALL', label: '전체' }, { id: 'PENDING', label: '대기중' }, { id: 'ACCEPTED', label: '수락됨' }, { id: 'REJECTED', label: '거절됨' }].map((s) => (
                                        <button key={s.id} onClick={() => setFilterStatus(s.id)} className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all tracking-wider uppercase font-mono ${filterStatus === s.id ? 'bg-zinc-950 text-white shadow-xl' : 'text-zinc-400 hover:text-zinc-600'}`}>{s.label}</button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                                    className="px-5 py-3 bg-white border border-zinc-200 rounded-[1.25rem] text-xs font-black text-zinc-600 hover:bg-zinc-50 transition-all shadow-sm flex items-center gap-2 uppercase font-mono"
                                >
                                    <ListFilter size={16} className="text-[#7A4FFF]" /> {sortOrder === 'DESC' ? '최신순' : '과거순'}
                                </button>
                            </div>
                        </div>

                        {appsLoading ? (
                            <div className="py-40 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-[#7A4FFF]" /></div>
                        ) : (
                            <div className="grid gap-8">
                                {sortedApplications.length === 0 ? (
                                    <div className="text-center py-24 bg-white/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-zinc-200 font-black text-zinc-300 italic uppercase tracking-widest">지원한 프로젝트가 없습니다</div>
                                ) : (
                                    sortedApplications.map((app) => {
                                        const isExpanded = expandedAppId === app.applicationId;

                                        return (
                                            <div key={app.applicationId} className="flex flex-col gap-3">
                                                {/* 아코디언 헤더 (프로젝트 정보) */}
                                                <motion.div className={`group bg-white p-10 rounded-[2.5rem] border transition-all duration-500 cursor-pointer ${isExpanded ? 'border-[#7A4FFF] shadow-2xl ring-1 ring-[#7A4FFF]/20' : 'border-zinc-100 shadow-xl hover:border-[#7A4FFF]/30'}`} onClick={() => handleToggleExpand(app.applicationId)}>
                                                    <div className="flex flex-col xl:flex-row justify-between items-center gap-8 w-full">
                                                        <div className="flex-1 w-full">
                                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase font-mono border ${app.status === 'ACCEPTED' ? 'bg-[#7A4FFF]/10 text-[#7A4FFF] border-[#7A4FFF]/20' : app.status === 'REJECTED' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-zinc-50 text-zinc-400'}`}>
                                                                {app.status === 'ACCEPTED' ? '수락됨' : app.status === 'REJECTED' ? '거절됨' : '심사중'}
                                                            </span>
                                                            <h3 className="text-3xl font-black text-zinc-900 mt-4 group-hover:text-[#7A4FFF] transition-colors tracking-tight">{app.projectName}</h3>
                                                            <div className="flex gap-8 mt-6 text-xs font-bold text-zinc-400 font-mono uppercase">
                                                                <span><Briefcase size={16} className="inline mr-1 text-[#7A4FFF]"/>{app.clientCompanyName}</span>
                                                                <span><Calendar size={16} className="inline mr-1 text-[#7A4FFF]"/>지원일: {new Date(app.appliedAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-5">
                                                            <div className={`px-8 py-4 rounded-[1.5rem] font-black text-xs tracking-[0.2em] uppercase transition-all flex items-center gap-3 font-mono border ${isExpanded ? 'bg-[#7A4FFF] text-white border-[#7A4FFF]' : 'bg-white text-zinc-400 border-zinc-200 group-hover:border-[#7A4FFF] group-hover:text-[#7A4FFF]'}`}>
                                                                상세 보기 <ChevronRight size={18} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                {/* 아코디언 바디 (내 지원 상세) */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                            <div className="mt-2 mb-12 p-8 bg-white border border-zinc-200 shadow-2xl rounded-[3rem] flex flex-col md:flex-row gap-8 items-center">
                                                                <div className="flex-1 w-full space-y-6">
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-widest mb-1">내가 제출한 입찰가</p>
                                                                        <p className="text-3xl font-black text-zinc-950 font-mono italic">₩{app.bidPrice?.toLocaleString()}</p>
                                                                    </div>
                                                                    <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100/50 text-sm font-medium text-zinc-600 italic leading-relaxed">
                                                                        "{app.message || "작성한 지원 메시지가 없습니다."}"
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-zinc-100 pt-6 md:pt-0 md:pl-8">
                                                                    {/* 🎯 [수정] 지원 취소 버튼 제거 완료 */}
                                                                    {app.status === 'ACCEPTED' && (
                                                                        <button onClick={() => router.push(`/freelancer/projects/${app.projectId}`)} className="w-full md:w-auto px-8 py-4 bg-zinc-950 text-white rounded-2xl text-xs font-black hover:bg-[#7A4FFF] transition-all uppercase font-mono flex items-center justify-center gap-2 shadow-sm">워크스페이스 입장 <ArrowUpRight size={16}/></button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* 🎯 2. 받은 제안 섹션 (RECEIVED_PROPOSALS) */}
                {activeMainTab === 'RECEIVED_PROPOSALS' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight text-zinc-950 uppercase font-mono mb-2">받은 제안 내역</h2>
                                <p className="text-sm font-medium text-zinc-400">클라이언트가 나에게 직접 보낸 달달한 러브콜입니다.</p>
                            </div>

                            {/* 🎯 [추가] 정렬 컨트롤 */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                                    className="px-5 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-black text-zinc-600 hover:bg-zinc-50 transition-all shadow-sm flex items-center gap-2 uppercase font-mono"
                                >
                                    <ListFilter size={16} className="text-[#7A4FFF]" /> {sortOrder === 'DESC' ? '최신순' : '과거순'}
                                </button>
                                <span className="px-5 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-black text-[#7A4FFF]">총 {sortedProposals.length}건</span>
                            </div>
                        </div>

                        {proposalsLoading ? (
                            <div className="py-40 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-[#7A4FFF]" /></div>
                        ) : sortedProposals.length === 0 ? (
                            <div className="bg-white/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-zinc-200 p-24 flex flex-col items-center justify-center text-center">
                                <Inbox size={60} className="text-zinc-200 mb-6" strokeWidth={1} />
                                <p className="text-xl font-black text-zinc-400 mb-2 italic">아직 받은 제안이 없습니다</p>
                                <p className="text-sm font-medium text-zinc-300 max-w-sm">프로필을 매력적으로 꾸미고 제안을 기다려보세요!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {sortedProposals.map((proposal) => (
                                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={proposal.proposalId} className="bg-white p-10 rounded-[3rem] border border-zinc-100 hover:border-[#7A4FFF] hover:shadow-2xl transition-all group flex flex-col xl:flex-row justify-between items-center gap-10">
                                        <div className="flex-1 w-full">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="flex items-center gap-2 bg-zinc-950 text-white px-3 py-1 rounded text-[9px] font-black uppercase font-mono tracking-widest"><Sparkles size={10} /> INBOUND_OFFER</div>
                                            </div>
                                            <h3 className="text-3xl font-black text-zinc-900 group-hover:text-[#7A4FFF] transition-colors mb-4">From: {proposal.clientName}</h3>
                                            <div className="flex items-center gap-2 mb-6"><div className="w-1.5 h-1.5 rounded-full bg-[#7A4FFF]" /><p className="text-xs font-black text-zinc-400 uppercase font-mono tracking-widest">제안 프로젝트: {proposal.projectName}</p></div>
                                            <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100/50 text-sm font-medium text-zinc-600 italic leading-relaxed">"{proposal.message}"</div>
                                        </div>

                                        <div className="w-full xl:w-auto flex flex-row xl:flex-col justify-between items-end gap-6 min-w-[240px] p-8 bg-zinc-50 rounded-[2rem] border border-zinc-100 shadow-inner">
                                            <div className="text-right w-full flex flex-col items-end">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-widest mb-1">클라이언트 제시액</p>
                                                <p className="text-3xl font-black text-zinc-950 font-mono italic mb-4">₩{proposal.offeredPrice?.toLocaleString()}</p>
                                            </div>
                                            <div className="flex flex-col gap-3 w-full">
                                                <button onClick={() => router.push(`/freelancer/projects/${proposal.projectId}`)} className="w-full px-8 py-3 bg-white border border-zinc-200 text-zinc-500 hover:text-[#7A4FFF] hover:border-[#7A4FFF] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all font-mono flex items-center justify-center gap-2 shadow-sm">프로젝트 확인 <ArrowUpRight size={14} /></button>

                                                {proposal.status === 'PENDING' ? (
                                                    <div className="flex gap-2 w-full">
                                                        <button onClick={() => handleProposalStatus(proposal.proposalId, 'ACCEPTED')} className="flex-1 px-6 py-4 bg-zinc-950 text-white hover:bg-[#7A4FFF] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all font-mono">수락</button>
                                                        <button onClick={() => handleProposalStatus(proposal.proposalId, 'REJECTED')} className="flex-1 px-6 py-4 bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all font-mono">거절</button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center w-full"><span className={`block px-4 py-3 rounded-xl text-xs font-black ${proposal.status === 'ACCEPTED' ? 'bg-purple-100 text-[#7A4FFF]' : 'bg-red-50 text-red-500'}`}>{proposal.status === 'ACCEPTED' ? '수락 완료' : '거절 완료'}</span></div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* 🎯 3. 관심 프로젝트 섹션 (BOOKMARKS) */}
                {activeMainTab === 'BOOKMARKS' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
                        <div className="flex items-center justify-between mb-4">
                            <div><h2 className="text-3xl font-black tracking-tight text-zinc-950 uppercase font-mono mb-2">관심 프로젝트</h2><p className="text-sm font-medium text-zinc-400">마스터가 눈여겨보고 있는 일거리 목록입니다.</p></div>
                            <span className="px-5 py-2 bg-white border border-zinc-200 rounded-2xl text-xs font-black text-[#7A4FFF]">공고 수: {bookmarkedProjects.length}개</span>
                        </div>
                        {bookmarksLoading ? (
                            <div className="py-40 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-[#7A4FFF]" /></div>
                        ) : bookmarkedProjects.length === 0 ? (
                            <div className="text-center py-48 bg-white/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-zinc-200 font-black text-zinc-200 italic uppercase tracking-tighter">찜한 프로젝트가 없습니다</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {bookmarkedProjects.map((project, idx) => (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={project.projectId} className="group bg-white p-10 rounded-[3rem] border border-zinc-100 hover:border-[#7A4FFF] hover:shadow-[0_20px_50px_rgba(122,79,255,0.15)] transition-all relative">
                                        <button onClick={() => handleRemoveBookmark(project.projectId)} className="absolute top-8 right-8 p-3 bg-zinc-50 rounded-2xl text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={18} /></button>
                                        <div className="flex flex-col mb-8 pt-4">
                                            <span className="text-[10px] font-black text-[#7A4FFF] bg-purple-50 px-3 py-1 rounded w-fit mb-4 uppercase text-center border border-purple-100">{project.companyName}</span>
                                            <h3 className="text-2xl font-black text-zinc-900 group-hover:text-[#7A4FFF] transition-colors mb-2 leading-tight">{project.projectName}</h3>
                                            <p className="text-xl font-black text-zinc-950 font-mono italic mb-4">₩{project.budget.toLocaleString()}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {project.skills && project.skills.map((skill: string) => <span key={skill} className="px-2 py-1 bg-zinc-50 border border-zinc-100 text-[10px] font-bold text-zinc-400 rounded-md uppercase font-mono">#{skill}</span>)}
                                            </div>
                                        </div>
                                        <button onClick={() => router.push(`/freelancer/projects/${project.projectId}`)} className="w-full py-4 bg-zinc-50 text-zinc-400 group-hover:bg-[#7A4FFF] group-hover:text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all font-mono">공고 상세보기</button>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Load More 버튼 */}
                        {hasMoreBookmarks && bookmarkedProjects.length > 0 && (
                            <div className="flex justify-center pt-10">
                                <button
                                    onClick={() => fetchBookmarks(true)}
                                    disabled={bookmarksLoading}
                                    className="px-12 py-5 bg-white border-2 border-zinc-900 text-zinc-900 rounded-[2rem] font-black text-xs tracking-[0.3em] uppercase hover:bg-zinc-900 hover:text-white transition-all flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {bookmarksLoading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                    프로젝트 더 보기
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </main>
        </div>
    );
}