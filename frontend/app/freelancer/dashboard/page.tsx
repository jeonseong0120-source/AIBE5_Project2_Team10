'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import ModeToggle from '@/components/common/ModeToggle';
import {
    User, Users, CheckCircle, XCircle, Edit, Trash2,
    Calendar, DollarSign, Activity, ChevronRight,
    Briefcase, Heart, Send, Sparkles, Star, MapPin, Globe, Loader2, Clock, ArrowUpRight, Search, FileText, Inbox, Bookmark, Plus, ListFilter, Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import GlobalNavbar from '@/components/common/GlobalNavbar';
import DashboardSidebar from '@/components/common/DashboardSidebar';
import FreelancerProjectDetailModal from '@/components/freelancer/FreelancerProjectDetailModal';
import { DEVNEAR_BOOKMARK_CHANGED, BookmarkChangeEventDetail, notifyBookmarkChanged } from '@/app/lib/bookmarkEvents';
import { dnAlert, dnConfirm } from '@/lib/swal';

export default function FreelancerDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // 토글 버튼에 권한을 넘겨주기 위한 유저 상태
    const [user, setUser] = useState<any>(null);

    // 🎯 [추가 2] 프로필 사진(profileImageUrl 등)을 담을 상태 추가!
    const [profile, setProfile] = useState<any>(null);

    const [activeMainTab, setActiveMainTab] = useState<'APPLICATIONS' | 'RECEIVED_PROPOSALS' | 'BOOKMARKS'>('APPLICATIONS');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

    const [applications, setApplications] = useState<any[]>([]);
    const [appsLoading, setAppsLoading] = useState(false);
    const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

    const [receivedProposals, setReceivedProposals] = useState<any[]>([]);
    const [proposalsLoading, setProposalsLoading] = useState(false);

    const [bookmarkedProjects, setBookmarkedProjects] = useState<any[]>([]);
    const [bookmarksLoading, setBookmarksLoading] = useState(false);
    const [bookmarkPage, setBookmarkPage] = useState(0);
    const [hasMoreBookmarks, setHasMoreBookmarks] = useState(true);

    const [totalBookmarks, setTotalBookmarks] = useState(0);

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
                if (!roles.includes("FREELANCER") && !roles.includes("BOTH")) {
                    await dnAlert("프리랜서 또는 BOTH 계정만 접근 가능합니다.", "warning");
                    if (roles.includes("CLIENT")) return router.replace("/client/dashboard");
                    return router.replace("/onboarding");
                }

                // 유저 정보 저장
                setUser(res.data);
                setAuthorized(true);
            } catch (err) {
                router.replace("/");
            } finally {
                setLoading(false);
            }
        };
        checkAccess();
    }, [router]);

    // 🎯 [추가 3] 로그인 확인 후 프리랜서 사진 데이터를 가져오는 API 호출!
    useEffect(() => {
        if (authorized) {
            api.get('/v1/freelancers/me')
                .then(res => setProfile(res.data))
                .catch(err => console.error("프로필 로드 실패", err));
        }
    }, [authorized]);

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

    const fetchBookmarks = useCallback(async (isLoadMore = false) => {
        if (!isLoadMore) {
            setBookmarksLoading(true);
            setBookmarkPage(0);
        }
        const targetPage = isLoadMore ? bookmarkPage + 1 : 0;
        try {
            const { data } = await api.get(`/v1/bookmarks/projects?page=${targetPage}&size=9&sort=createdAt,${sortOrder.toLowerCase()}`);
            const newContent = data.content || [];

            setBookmarkedProjects(prev => isLoadMore ? [...prev, ...newContent] : newContent);
            setBookmarkPage(targetPage);
            setHasMoreBookmarks(!data.last);
            setTotalBookmarks(data.totalElements !== undefined ? data.totalElements : (isLoadMore ? bookmarkedProjects.length + newContent.length : newContent.length));
        } catch (err) {
            console.error("관심 프로젝트 로드 실패", err);
        } finally {
            setBookmarksLoading(false);
        }
    }, [bookmarkPage, bookmarkedProjects.length, sortOrder]);

    const handleRemoveBookmark = async (projectId: number) => {
        if (!(await dnConfirm("관심 프로젝트에서 삭제하시겠습니까?"))) return;
        try {
            await api.delete(`/v1/bookmarks/projects/${projectId}`);
            notifyBookmarkChanged(projectId, false);
        } catch (err) {
            await dnAlert("삭제에 실패했습니다.", "error");
        }
    };

    const fetchBookmarksRef = useRef(fetchBookmarks);
    useEffect(() => {
        fetchBookmarksRef.current = fetchBookmarks;
    }, [fetchBookmarks]);

    useEffect(() => {
        const handleBookmarkChange = (e: Event) => {
            const customEvent = e as CustomEvent<BookmarkChangeEventDetail>;
            const { projectId, isBookmarked } = customEvent.detail;
            
            if (!isBookmarked) {
                setBookmarkedProjects(prev => prev.filter(p => p.projectId !== projectId));
                setTotalBookmarks(prev => Math.max(0, prev - 1));
            } else {
                fetchBookmarksRef.current(false);
            }
        };

        window.addEventListener(DEVNEAR_BOOKMARK_CHANGED, handleBookmarkChange);
        return () => window.removeEventListener(DEVNEAR_BOOKMARK_CHANGED, handleBookmarkChange);
    }, []);

    const handleProposalStatus = async (proposalId: number, status: 'ACCEPTED' | 'REJECTED') => {
        const actionText = status === 'ACCEPTED' ? '수락' : '거절';
        if (!(await dnConfirm(`이 제안을 ${actionText}하시겠습니까?`))) return;

        try {
            await api.patch(`/v1/proposals/${proposalId}/status`, { status });
            await dnAlert(`제안이 ${actionText}되었습니다.`, 'success');
            fetchReceivedProposals();
        } catch (error) {
            console.error("제안 상태 변경 실패:", error);
            await dnAlert('상태 변경에 실패했습니다.', 'error');
        }
    };

    useEffect(() => {
        if (!authorized) return;
        
        // 🎯 사이드바 배지를 위해 초기 1회 제안 목록 로드
        fetchReceivedProposals();
    }, [authorized]);

    useEffect(() => {
        if (!authorized) return;
        if (activeMainTab === 'APPLICATIONS') fetchApplications();
        if (activeMainTab === 'RECEIVED_PROPOSALS') fetchReceivedProposals();
        if (activeMainTab === 'BOOKMARKS') fetchBookmarks(false);
    }, [authorized, activeMainTab, sortOrder]);

    const handleToggleExpand = (uniqueId: string) => {
        setExpandedAppId(expandedAppId === uniqueId ? null : uniqueId);
    };

    const handleOpenProjectModal = (projectId: number) => {
        setSelectedProjectId(projectId);
        setIsProjectModalOpen(true);
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-[#7A4FFF] font-black text-xl animate-pulse uppercase font-mono">인증 정보를 확인 중입니다...</div>
    );

    if (!authorized) return null;

    const sortedApplications = [...applications]
        .filter(a => {
            // 거절된 지원서는 아예 노출하지 않음
            if (a.status === 'REJECTED') return false;

            const isProjectFinished = a.projectStatus === 'CLOSED' || a.projectStatus === 'COMPLETED';
            // 내가 수락되지 않았는데 프로젝트가 이미 진행 중이라면 나에게는 마감된 것과 같음
            const isOthersInProgress = a.projectStatus === 'IN_PROGRESS' && a.status !== 'ACCEPTED';
            const isEffectivelyClosed = isProjectFinished || isOthersInProgress;

            if (filterStatus === 'ALL') return true;
            if (filterStatus === 'CLOSED') return isEffectivelyClosed;

            // 마감/완료되었거나 다른 사람이 진행 중인 프로젝트는 대기중, 진행중(ACCEPTED) 탭에서 제외
            if (isEffectivelyClosed) return false;

            return a.status === filterStatus;
        })
        .sort((a, b) => {
            const timeA = new Date(a.appliedAt || 0).getTime();
            const timeB = new Date(b.appliedAt || 0).getTime();
            return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
        });

    const sortedProposals = [...receivedProposals].sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 pb-20 relative overflow-hidden font-sans">
            {/* 🔥 커서 글로우 보존 */}
            <div
                className="pointer-events-none fixed left-0 top-0 z-0 h-[300px] w-[300px] rounded-full bg-[#7A4FFF]/20 blur-[120px] will-change-transform"
                style={{ transform: `translate(${cursor.x - 150}px, ${cursor.y - 150}px)` }}
            />

            <GlobalNavbar user={user} profile={profile} />

            <header className="relative pt-24 pb-16 px-8 overflow-hidden bg-white border-b border-zinc-100 text-center">
                {/* 십자가 무늬 배경 패턴 */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {/* 데코레이션 아이콘 */}
                <div className="absolute left-[-20px] bottom-4 opacity-5 hidden lg:block text-[#7A4FFF]">
                    <Briefcase size={200} strokeWidth={0.5} />
                </div>
                <div className="absolute right-[-40px] top-10 opacity-5 hidden lg:block rotate-12 text-[#7A4FFF]">
                    <Sparkles size={240} strokeWidth={0.5} />
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-zinc-900 leading-tight">
                            프리랜서 <span className="text-[#7A4FFF]">대시보드</span>
                        </h1>
                        <p className="text-zinc-400 text-sm font-medium max-w-lg mx-auto">지원한 프로젝트를 관리하고 클라이언트로부터 받은 제안을 확인하세요.</p>
                    </motion.div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-12 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* 좌측 사이드바 */}
                    <DashboardSidebar
                        activeTab={activeMainTab}
                        onTabChange={setActiveMainTab}
                        tabs={[
                            { id: 'APPLICATIONS', label: '지원 내역', icon: <FileText size={18} /> },
                            { 
                                id: 'RECEIVED_PROPOSALS', 
                                label: '받은 제안', 
                                icon: <Inbox size={18} />,
                                badge: receivedProposals.filter(p => p.status === 'PENDING').length 
                            },
                            { id: 'BOOKMARKS', label: '관심 프로젝트', icon: <Bookmark size={18} /> }
                        ]}
                        mode="FREELANCER"
                        ctaLabel="프로젝트 탐색"
                        ctaIcon={<Search size={18} strokeWidth={3} />}
                        onCtaClick={() => router.push("/freelancer/explore")}
                        user={user}
                        profile={profile}
                    />

                    {/* 우측 메인 콘텐츠 리스트 */}
                    <div className="flex-1 min-w-0">
                        {/* 1. 공통 스티키 필터 헤더 (지원 내역, 받은 제안, 관심 프로젝트에서 사용) */}
                        {(activeMainTab === 'APPLICATIONS' || activeMainTab === 'RECEIVED_PROPOSALS' || activeMainTab === 'BOOKMARKS') && (
                            <div className="sticky top-4 z-40 backdrop-blur-md pb-6">
                                <div className="bg-white/70 border border-zinc-100 rounded-full shadow-sm p-1.5 flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        {activeMainTab === 'APPLICATIONS' && (
                                            <div className="grid grid-cols-4 gap-1">
                                                {[{ id: 'ALL', label: '전체' }, { id: 'PENDING', label: '대기중' }, { id: 'ACCEPTED', label: '진행중' }, { id: 'CLOSED', label: '마감됨' }].map((s) => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => setFilterStatus(s.id)}
                                                        className={`py-3.5 rounded-full text-[13px] font-bold transition-all tracking-wider text-center ${filterStatus === s.id
                                                                ? 'bg-zinc-950 text-white shadow-xl scale-[1.02]'
                                                                : 'text-zinc-400 hover:text-zinc-600 hover:bg-white/80'
                                                            }`}
                                                    >
                                                        {s.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {activeMainTab === 'RECEIVED_PROPOSALS' && (
                                            <div className="px-6 py-3 text-[13px] font-bold text-zinc-400 uppercase tracking-widest">
                                                Received Proposals
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                                        className="px-6 py-3 bg-white border border-zinc-100 rounded-full text-[12px] font-bold text-zinc-600 hover:bg-zinc-50 transition-all flex items-center gap-2 uppercase mr-1 shadow-sm"
                                    >
                                        <ListFilter size={14} className="text-[#7A4FFF]" /> {sortOrder === 'DESC' ? '최신순' : '과거순'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 1. 지원 내역 섹션 */}
                        {activeMainTab === 'APPLICATIONS' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>


                                {appsLoading ? (
                                    <div className="py-40 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-[#7A4FFF]" /></div>
                                ) : (
                                    <div className="grid gap-8">
                                        {sortedApplications.length === 0 ? (
                                            <div className="bg-white/40 backdrop-blur-sm rounded-[3.5rem] border-2 border-dashed border-zinc-200 p-24 flex flex-col items-center justify-center text-center">
                                                <FileText size={64} className="text-zinc-200 mb-8" strokeWidth={0.5} />
                                                <p className="text-2xl font-black text-zinc-400 mb-2 italic uppercase font-mono tracking-tighter">No_Applications_Active</p>
                                                <p className="text-zinc-300 text-xs font-bold uppercase tracking-widest">지원한 프로젝트 내역이 없습니다.</p>
                                            </div>
                                        ) : (
                                            sortedApplications.map((app) => {
                                                const uniqueId = `${app.source}-${app.applicationId}`;
                                                const isExpanded = expandedAppId === uniqueId;
                                                return (
                                                    <div key={uniqueId} className="flex flex-col gap-3">
                                                        <motion.div className={`group bg-white p-10 rounded-[2.5rem] border transition-all duration-500 cursor-pointer ${isExpanded ? 'border-[#7A4FFF] shadow-2xl ring-1 ring-[#7A4FFF]/20' : 'border-zinc-100 shadow-sm hover:shadow-xl hover:border-[#7A4FFF]/30'}`} onClick={() => handleToggleExpand(uniqueId)}>
                                                            <div className="flex flex-col xl:flex-row justify-between items-center gap-8 w-full">
                                                                <div className="flex-1 w-full">
                                                                    <span className={`px-4 py-2 rounded-full text-[12px] font-bold tracking-wider uppercase border shadow-sm ${
                                                                        app.projectStatus === 'COMPLETED' ? 'bg-zinc-950 text-white border-zinc-950' :
                                                                        (app.projectStatus === 'CLOSED' || (app.projectStatus === 'IN_PROGRESS' && app.status !== 'ACCEPTED')) ? 'bg-zinc-100 text-zinc-400 border-zinc-200' :
                                                                        app.status === 'ACCEPTED' ? 'bg-[#7A4FFF]/10 text-[#7A4FFF] border-[#7A4FFF]/20' :
                                                                        'bg-zinc-50 text-zinc-400 border-zinc-100'
                                                                    }`}>
                                                                        {app.projectStatus === 'COMPLETED' ? '완료됨' :
                                                                        (app.projectStatus === 'CLOSED' || (app.projectStatus === 'IN_PROGRESS' && app.status !== 'ACCEPTED')) ? '마감됨' :
                                                                        app.status === 'ACCEPTED' ? '진행중' : '심사중'}
                                                                    </span>
                                                                    {app.source === 'PROPOSAL' && (
                                                                        <span className="ml-3 px-3 py-1.5 bg-white border-2 border-[#7A4FFF] text-[#7A4FFF] text-[11px] font-bold rounded-xl tracking-widest uppercase shadow-sm">스카우트됨</span>
                                                                    )}
                                                                    <h3 className="text-3xl font-black text-zinc-900 mt-4 group-hover:text-[#7A4FFF] transition-colors tracking-tight">{app.projectName}</h3>
                                                                    <div className="flex gap-8 mt-6 text-[13px] font-bold text-zinc-400 uppercase tracking-tight">
                                                                        <span className="flex items-center"><Briefcase size={16} className="mr-2 text-[#7A4FFF]" />{app.clientCompanyName}</span>
                                                                        <span className="flex items-center"><Calendar size={16} className="mr-2 text-[#7A4FFF]" />지원일: {new Date(app.appliedAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleOpenProjectModal(app.projectId);
                                                                        }}
                                                                        className="group/work px-6 py-4 bg-zinc-950 text-white rounded-[1.2rem] transition-all hover:bg-[#7A4FFF] hover:shadow-xl hover:shadow-purple-500/20 active:scale-95 flex flex-col items-center justify-center gap-0.5 border border-zinc-800 hover:border-purple-400/30 shadow-xl"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <ArrowUpRight size={16} className="group-hover/work:translate-x-0.5 group-hover/work:-translate-y-0.5 transition-transform" />
                                                                            <span className="text-[14px] font-black uppercase tracking-tighter">프로젝트 상세</span>
                                                                        </div>
                                                                    </button>
                                                                    
                                                                    <div className={`group/detail px-8 py-4 rounded-[1.2rem] transition-all flex flex-col items-center justify-center gap-0.5 border shadow-xl ${
                                                                        isExpanded 
                                                                        ? 'bg-[#7A4FFF] text-white border-purple-400/30 shadow-purple-500/20' 
                                                                        : 'bg-white text-zinc-400 border-zinc-100 hover:border-[#7A4FFF]/30 hover:text-[#7A4FFF] hover:shadow-zinc-200/50'
                                                                    }`}>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[14px] font-black uppercase tracking-tighter">상세 보기</span>
                                                                            <ChevronRight size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'group-hover/detail:translate-x-1'}`} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                                    <div className="mt-2 mb-12 p-8 bg-white border border-zinc-200 shadow-2xl rounded-[3rem] flex flex-col md:flex-row gap-8 items-center">
                                                                        <div className="flex-1 w-full space-y-6">
                                                                            <div>
                                                                                <p className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-1">내가 제출한 입찰가</p>
                                                                                <p className="text-2xl font-bold text-zinc-950">₩{app.bidPrice?.toLocaleString()}</p>
                                                                            </div>
                                                                            <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100/50 text-sm font-medium text-zinc-600 leading-relaxed">
                                                                                "{app.message || "작성한 지원 메시지가 없습니다."}"
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-zinc-100 pt-6 md:pt-0 md:pl-8">
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

                        {/* 2. 받은 제안 섹션 */}
                        {activeMainTab === 'RECEIVED_PROPOSALS' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                                {proposalsLoading ? (
                                    <div className="py-40 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-[#7A4FFF]" /></div>
                                ) : sortedProposals.length === 0 ? (
                                    <div className="bg-white/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-zinc-200 p-24 flex flex-col items-center justify-center text-center">
                                        <Inbox size={60} className="text-zinc-200 mb-6" strokeWidth={1} />
                                        <p className="text-xl font-bold text-zinc-400 mb-2 uppercase">제안 내역 없음</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {sortedProposals.map((proposal) => (
                                            <div key={proposal.proposalId} className="group bg-white p-10 rounded-[3.5rem] border border-zinc-100 hover:border-[#7A4FFF] hover:shadow-[0_30px_60px_rgba(122,79,255,0.12)] transition-all flex flex-col xl:flex-row items-center gap-10">
                                                {/* 좌측: 클라이언트 정보 및 제안 메시지 */}
                                                <div className="flex-1 w-full">
                                                    <div className="flex items-center gap-4 mb-8">
                                                        <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-[#7A4FFF] border border-purple-100">
                                                            <Briefcase size={28} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-[#7A4FFF] uppercase tracking-widest mb-1">
                                                                <Sparkles size={10} /> 받은 제안
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-zinc-950 tracking-tight group-hover:text-[#7A4FFF] transition-colors">{proposal.clientName}</h3>
                                                            <p className="text-[13px] font-bold text-zinc-400 mt-1 uppercase tracking-tight">{proposal.projectName}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="relative">
                                                        <Quote size={40} className="absolute -top-4 -left-4 text-purple-100 opacity-50" />
                                                        <div className="p-8 bg-zinc-50/50 rounded-[2rem] border border-zinc-100 text-sm font-medium text-zinc-600 leading-relaxed relative z-10">
                                                            "{proposal.message}"
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 우측: 금액 및 액션 섹션 */}
                                                <div className="w-full xl:w-[320px] bg-zinc-50/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-zinc-100 flex flex-col gap-6">
                                                    <div className="flex flex-col items-center xl:items-end">
                                                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">제안 금액</p>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-sm font-bold text-zinc-400">₩</span>
                                                            <span className="text-3xl font-bold text-zinc-950 tracking-tighter">{proposal.offeredPrice?.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="h-px bg-zinc-200/50 w-full" />

                                                    <div className="flex flex-col gap-3">
                                                        <button 
                                                            onClick={() => handleOpenProjectModal(proposal.projectId)} 
                                                            className="w-full py-4 bg-white border border-zinc-200 text-zinc-500 hover:text-[#7A4FFF] hover:border-[#7A4FFF] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                                                        >
                                                            프로젝트 확인 <ArrowUpRight size={14} />
                                                        </button>

                                                        {proposal.status === 'PENDING' ? (
                                                            <div className="flex gap-2 w-full">
                                                                <button onClick={() => handleProposalStatus(proposal.proposalId, 'ACCEPTED')} className="flex-1 py-4 bg-zinc-950 text-white hover:bg-[#7A4FFF] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-zinc-900/10">수락</button>
                                                                <button onClick={() => handleProposalStatus(proposal.proposalId, 'REJECTED')} className="flex-1 py-4 bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">거절</button>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center w-full">
                                                                <span className={`block py-4 rounded-xl text-xs font-black uppercase tracking-widest ${
                                                                    proposal.status === 'ACCEPTED' ? 'bg-purple-100 text-[#7A4FFF]' : 'bg-red-50 text-red-500'
                                                                }`}>
                                                                    {proposal.status === 'ACCEPTED' ? '제안 수락됨' : '제안 거절됨'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* 3. 관심 프로젝트 섹션 */}
                        {activeMainTab === 'BOOKMARKS' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                                {bookmarksLoading && bookmarkPage === 0 ? (
                                    <div className="py-40 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-[#7A4FFF]" /></div>
                                ) : bookmarkedProjects.length === 0 ? (
                                    <div className="bg-white/40 backdrop-blur-sm rounded-[3.5rem] border-2 border-dashed border-zinc-200 p-32 flex flex-col items-center justify-center text-center">
                                        <Bookmark size={64} className="text-zinc-200 mb-8" strokeWidth={0.5} />
                                        <p className="text-2xl font-bold text-zinc-400 mb-2 uppercase tracking-tighter">찜한 프로젝트 없음</p>
                                        <p className="text-zinc-300 text-xs font-bold uppercase tracking-widest">찜한 프로젝트가 아직 없습니다. 마음에 드는 공고를 찾아보세요.</p>
                                        <button 
                                            onClick={() => router.push('/freelancer/explore')}
                                            className="mt-10 px-10 py-4 bg-zinc-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7A4FFF] transition-all shadow-xl shadow-zinc-900/10 active:scale-95"
                                        >
                                            프로젝트 탐색하러 가기
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {bookmarkedProjects.map((project, idx) => (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={project.projectId} 
                                                className="group bg-white p-8 rounded-[2.5rem] border border-zinc-100 hover:border-[#7A4FFF] hover:shadow-[0_30px_60px_rgba(122,79,255,0.12)] transition-all relative flex flex-col h-full"
                                            >
                                                {/* 삭제 버튼 */}
                                                <button 
                                                    onClick={() => handleRemoveBookmark(project.projectId)} 
                                                    className="absolute top-6 right-6 p-2.5 bg-zinc-50/50 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all z-10"
                                                    title="관심 목록에서 제거"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                {/* 상단: 업체 로고 및 이름 */}
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden flex items-center justify-center shrink-0">
                                                        {project.logoUrl ? (
                                                            <img src={project.logoUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Briefcase size={16} className="text-zinc-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-[#7A4FFF] uppercase tracking-wider">전략적 파트너</span>
                                                        <p className="text-[11px] font-bold text-zinc-500 leading-none truncate max-w-[120px]">{project.companyName}</p>
                                                    </div>
                                                </div>

                                                {/* 본문: 제목 및 설명 */}
                                                <div className="flex-1 mb-8">
                                                    <h3 className="text-xl font-black text-zinc-950 group-hover:text-[#7A4FFF] transition-colors mb-4 leading-[1.3] tracking-tighter line-clamp-2 h-[3.4em]">
                                                        {project.projectName}
                                                    </h3>

                                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest mb-1">예상 예산</span>
                                                            <p className="text-xs font-bold text-zinc-900">₩{project.budget?.toLocaleString()}</p>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest mb-1">마감 기한</span>
                                                            <p className="text-xs font-bold text-zinc-900">{project.deadline}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 하단: 액션 */}
                                                <div className="flex items-center gap-2 pt-2">
                                                    <button 
                                                        onClick={() => handleOpenProjectModal(project.projectId)} 
                                                        className="flex-1 py-4 bg-zinc-950 text-white hover:bg-[#7A4FFF] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-950/10 active:scale-95"
                                                    >
                                                        공고 확인 <ArrowUpRight size={14} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                                {hasMoreBookmarks && bookmarkedProjects.length > 0 && (
                                    <div className="flex justify-center pt-10">
                                        <button onClick={() => fetchBookmarks(true)} disabled={bookmarksLoading} className="px-12 py-5 bg-white border-2 border-zinc-900 text-zinc-900 rounded-[2rem] font-black text-xs tracking-[0.3em] uppercase hover:bg-zinc-900 hover:text-white transition-all flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {bookmarksLoading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} 프로젝트 더 보기
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>

            <FreelancerProjectDetailModal 
                projectId={selectedProjectId} 
                open={isProjectModalOpen} 
                onClose={() => setIsProjectModalOpen(false)} 
            />
        </div>
    );
}