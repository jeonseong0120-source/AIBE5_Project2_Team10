'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, MapPin, DollarSign, Cpu, RotateCcw, Activity, Loader2, 
    AlertCircle, ChevronLeft, ChevronRight, ChevronDown, Check, Sparkles,
    Clock, CircleDollarSign, Calendar, Zap, ListFilter
} from 'lucide-react';
import ProjectCard from "@/components/freelancer/ProjectCard";
import FreelancerProjectDetailModal from '@/components/freelancer/FreelancerProjectDetailModal';
import { useRouter } from 'next/navigation';
import { Geist } from 'next/font/google';
import api from '@/app/lib/axios';

// 🎯 [추가] 대통합 네비게이션 바 불러오기!
import GlobalNavbar, { type UserData, type ProfileData } from '../../../components/common/GlobalNavbar';
import FilterSidebar from '@/components/common/FilterSidebar';
import { EstimatedBudgetBlock } from '@/components/freelancer/EstimatedBudgetBlock';
import { SKILL_CATEGORIES } from '@/constants/skills';
import { dnAlert } from '@/lib/swal';

/** AI 추천 카드 영역 — 루트와 동일하게 Geist */
const geistSans = Geist({
    subsets: ['latin'],
    display: 'swap',
});

export default function FreelancerExplorePage() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // 🎯 GlobalNavbar에 전달할 유저 정보 상태
    const [user, setUser] = useState<UserData | null>(null);
    // 🎯 [추가] 사진(logoUrl 등) 데이터를 담을 프로필 상태
    const [profile, setProfile] = useState<ProfileData | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('전체');
    
    // 🎯 [개선] 정렬 방향 상태 추가
    const [sort, setSort] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const [minBudget, setMinBudget] = useState<number | undefined>(undefined);
    const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined);
    
    // 🔥 [최적화] 마우스 글로우 효과를 위한 Ref + rAF 방식 사용 (리렌더링 방지)
    const glowRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef({ x: 0, y: 0 });
    const rafIdRef = useRef<number | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            cursorRef.current = { x: e.clientX, y: e.clientY };
            
            if (rafIdRef.current === null) {
                rafIdRef.current = requestAnimationFrame(() => {
                    if (glowRef.current) {
                        glowRef.current.style.transform = `translate(${cursorRef.current.x - 200}px, ${cursorRef.current.y - 200}px)`;
                    }
                    rafIdRef.current = null;
                });
            }
        };
        
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

    type AiRecommendedProject = {
        projectId: number;
        projectName: string;
        similarityScore: number;
        budget: number;
        companyName: string;
        logoUrl: string;
    };
    const [aiRecommendations, setAiRecommendations] = useState<AiRecommendedProject[]>([]);
    const [aiRecLoading, setAiRecLoading] = useState(false);
    const [aiRecError, setAiRecError] = useState<string | null>(null);

    // 🎯 AI 캐러셀 스크롤 추적 로직 (상태 선언 이후로 이동)
    const carouselRef = useRef<HTMLDivElement>(null);
    const [scrollState, setScrollState] = useState({ canLeft: false, canRight: false });

    const updateScrollState = useCallback(() => {
        if (carouselRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
            setScrollState({
                canLeft: scrollLeft > 10,
                canRight: scrollLeft < scrollWidth - clientWidth - 10
            });
        }
    }, []);

    useEffect(() => {
        if (!aiRecLoading && aiRecommendations.length > 0) {
            const timeoutId = setTimeout(updateScrollState, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [aiRecLoading, aiRecommendations, updateScrollState]);

    const handleScroll = () => {
        updateScrollState();
    };

    const loadAiRecommendations = useCallback(async (signal?: { cancelled: boolean }) => {
        const isCancelled = () => signal?.cancelled ?? false;
        setAiRecLoading(true);
        setAiRecError(null);
        try {
            const { data } = await api.get<AiRecommendedProject[]>('/v1/freelancer/me/recommended-projects', {
                params: { limit: 5 },
            });
            if (!isCancelled()) {
                setAiRecommendations(Array.isArray(data) ? data : []);
            }
        } catch (err: unknown) {
            if (!isCancelled()) {
                const parts: string[] = [];
                if (err && typeof err === 'object' && 'response' in err) {
                    const ax = err as {
                        message?: string;
                        response?: { status?: number; data?: { message?: string } };
                    };
                    if (ax.response?.status != null) {
                        parts.push(`HTTP ${ax.response.status}`);
                    }
                    const bodyMsg = ax.response?.data?.message;
                    if (typeof bodyMsg === 'string' && bodyMsg.trim()) {
                        parts.push(bodyMsg.trim());
                    } else if (ax.message) {
                        parts.push(ax.message);
                    }
                } else if (err instanceof Error) {
                    parts.push(err.message);
                }
                setAiRecError(
                    parts.length > 0
                        ? `AI 추천을 불러오지 못했습니다. (${parts.join(' — ')})`
                        : 'AI 추천을 불러오지 못했습니다. 네트워크 또는 서버 상태를 확인해 주세요.'
                );
            }
        } finally {
            if (!isCancelled()) setAiRecLoading(false);
        }
    }, []);


    useEffect(() => {
        const checkAccess = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                await dnAlert("로그인이 필요합니다.", "warning");
                router.replace("/");
                return;
            }
            try {
                const res = await api.get("/v1/users/me");
                const role = res.data.role;
                if (role === "GUEST" || role === "ROLE_GUEST") {
                    router.replace("/onboarding");
                    return;
                }
                if (role === "CLIENT" || role === "ROLE_CLIENT") {
                    await dnAlert("프리랜서 전용 화면입니다.", "warning");
                    router.replace("/dashboard");
                    return;
                }

                const normalizedRole = res.data.role?.replace("ROLE_", "") || "";
                setUser({ ...res.data, role: normalizedRole as UserData['role'] });
                setAuthorized(true);
            } catch (err) {
                router.replace("/");
            }
        };
        checkAccess();
    }, [router]);

    useEffect(() => {
        if (!authorized) return;
        const state = { cancelled: false };
        void loadAiRecommendations(state);
        return () => {
            state.cancelled = true;
        };
    }, [authorized, loadAiRecommendations]);

    const fetchProjects = async (pageNum: number, isLoadMore: boolean = false) => {
        if (!isLoadMore) setLoading(true);
        else setFetchingMore(true);

        try {
            const onlineFilter = activeTab === '온라인' ? 'true' : undefined;
            const offlineFilter = activeTab === '오프라인' ? 'true' : undefined;

            // 🎯 [최적화] URLSearchParams를 사용하고 금액 범위 필터 추가
            const searchParams = new URLSearchParams();
            if (searchQuery) searchParams.append('keyword', searchQuery);
            if (selectedLocation) searchParams.append('location', selectedLocation);
            selectedTechs.forEach(tech => searchParams.append('skill', tech));
            if (onlineFilter) searchParams.append('online', onlineFilter);
            if (offlineFilter) searchParams.append('offline', offlineFilter);
            if (minBudget !== undefined) searchParams.append('minBudget', minBudget.toString());
            if (maxBudget !== undefined) searchParams.append('maxBudget', maxBudget.toString());
            
            // 🎯 [개선] 정렬 방향 반영
            searchParams.append('sort', `${sort},${sortOrder}`);
            searchParams.append('page', pageNum.toString());
            searchParams.append('size', '10');

            const { data } = await api.get('/v1/projects', { params: searchParams });

            if (isLoadMore) setProjects(prev => [...prev, ...(data.content || [])]);
            else setProjects(data.content || []);

            setTotalElements(data.totalElements || 0);
            setHasMore(!data.last);
            if (isLoadMore) setPage(pageNum);

        } catch (err) {
            console.error("프로젝트 공고를 불러오지 못했습니다.", err);
        } finally {
            if (!isLoadMore) setLoading(false);
            else setFetchingMore(false);
        }
    };

    const resetFilters = () => {
        setSearchQuery(''); 
        setSelectedLocation(''); 
        setSelectedTechs([]); 
        setActiveTab('전체'); 
        setSort('createdAt'); 
        setSortOrder('desc');
        setPage(0);
        setMinBudget(undefined);
        setMaxBudget(undefined);
    };

    // 🎯 [분리] 프로필 데이터는 인증 직후 1회만 로드
    useEffect(() => {
        if (authorized) {
            api.get('/v1/freelancers/me')
                .then(res => setProfile(res.data))
                .catch(() => console.error("프로필 로드 실패"));
        }
    }, [authorized]);

    // 🎯 [분리] 필터 변경 시 프로젝트 리스트만 갱신
    useEffect(() => {
        if (authorized) {
            setPage(0);
            const timeoutId = setTimeout(() => { fetchProjects(0, false); }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [searchQuery, selectedLocation, selectedTechs, activeTab, sort, sortOrder, authorized, minBudget, maxBudget]);

    const handleLoadMore = () => {
        if (fetchingMore) return;
        const nextPage = page + 1;
        fetchProjects(nextPage, true);
    };

    const openProjectModal = (projectId: number) => {
        setSelectedProjectId(projectId);
        setIsProjectModalOpen(true);
    };

    // 🎯 [추가] 정렬 옵션 정의 (심플하게 변경)
    const sortOptions = [
        { id: 'createdAt', label: '등록순' },
        { id: 'budget', label: '예산순' },
    ];

    const handleSortClick = (id: string) => {
        if (sort === id) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSort(id);
            setSortOrder('desc');
        }
    };

    if (!authorized) return <div className="min-h-screen bg-white flex items-center justify-center text-[#7A4FFF] font-black tracking-widest animate-pulse font-mono uppercase text-xs">인증 정보를 확인 중입니다...</div>;

    const isFiltered = searchQuery !== '' || selectedLocation !== '' || selectedTechs.length > 0 || activeTab !== '전체';

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 pb-20 font-sans overflow-x-hidden relative">

            {/* 🔥 커서 글로우 - 보라색/오렌지 믹스 (glowRef 유지) */}
            <div
                ref={glowRef}
                className="pointer-events-none fixed left-0 top-0 z-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-[#7A4FFF]/10 to-[#FF7D00]/10 blur-[120px] will-change-transform"
                style={{ transform: 'translate(-200px, -200px)' }}
            />

            {/* 🎯 user 정보와 profile(사진 등) 정보를 통째로 넘겨줍니다! */}
            <GlobalNavbar user={user} profile={profile} />

            {/* HERO HEADER - 프리미엄 스타일로 업그레이드 */}
            <header className="relative pt-24 pb-12 px-6 bg-white border-b border-zinc-100 overflow-hidden text-center">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {/* 데코레이션 아이콘 */}
                <div className="absolute left-[-20px] bottom-4 opacity-5 hidden lg:block text-[#7A4FFF]">
                    <Cpu size={200} strokeWidth={0.5} />
                </div>
                <div className="absolute right-[-40px] top-10 opacity-5 hidden lg:block rotate-12 text-[#FF7D00]">
                    <Activity size={240} strokeWidth={0.5} />
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {/* 🎯 문구 최적화 + 퍼플 글로우 + 텍스트 그림자 적용 */}
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-10 text-zinc-900 leading-tight break-keep [text-shadow:0_4px_15px_rgba(0,0,0,0.06)]">
                            최적의 <span className="text-[#7A4FFF] drop-shadow-[0_0_20px_rgba(122,79,255,0.4)] motion-safe:animate-[pulse_3s_ease-in-out_infinite] motion-reduce:animate-none">프로젝트</span>를 찾으세요.
                        </h1>
                    </motion.div>


                    {/* Premium Search Input */}
                    <div className="max-w-2xl mx-auto relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#7A4FFF] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="기술 스택, 프로젝트명, 기업 검색..."
                            className="w-full bg-white border-2 border-zinc-200 rounded-full py-5 pl-16 pr-6 focus:ring-4 focus:ring-purple-500/5 focus:border-[#7A4FFF] outline-none transition-all font-bold text-sm shadow-xl shadow-purple-900/5"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* 🎯 AI Recommended Projects Section - Slim & Compact Premium UI (Geist + 만원 단위) */}
            <section className={`relative z-10 max-w-7xl mx-auto px-8 pb-6 ${geistSans.className}`}>
                <div className="group/container rounded-[2rem] border border-zinc-200/50 bg-white/80 backdrop-blur-xl p-8 md:p-10 shadow-xl shadow-purple-500/5 relative overflow-hidden">
                    
                    {/* Subtle Decorative Background */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-purple-500/5 to-orange-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#7A4FFF] animate-pulse" />
                                    <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#7A4FFF]">Recommended</span>
                                </div>
                                <h2 className="text-2xl font-bold tracking-tighter text-zinc-950 leading-none">
                                    AI <span className="text-[#7A4FFF]">TOP PICK</span>
                                </h2>
                            </div>
                            <div className="hidden lg:block h-8 w-[1px] bg-zinc-100" />
                            <p className="hidden md:block text-xs font-medium text-zinc-400 max-w-md leading-relaxed">
                                회원님의 스택을 실시간 분석하여 <br /> 선정된 최적의 공고입니다.
                            </p>
                        </div>

                        {/* Carousel Controls - Premium Compact */}
                        {!aiRecLoading && aiRecommendations.length > 3 && (
                            <div className="flex gap-3 relative z-20">
                                <button 
                                    onClick={() => {
                                        carouselRef.current?.scrollBy({ left: -340, behavior: 'smooth' });
                                    }}
                                    className={`group relative flex items-center justify-center w-11 h-11 rounded-xl border transition-all duration-300 active:scale-90 ${
                                        scrollState.canLeft 
                                            ? 'bg-zinc-950 border-zinc-950 text-white hover:bg-[#7A4FFF] hover:shadow-[0_8px_20px_rgba(122,79,255,0.3)]' 
                                            : 'bg-white/70 border-zinc-200 backdrop-blur-md text-zinc-300 opacity-50 cursor-not-allowed'
                                    }`}
                                    aria-label="Previous Slide"
                                    disabled={!scrollState.canLeft}
                                >
                                    {scrollState.canLeft && <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    <ChevronLeft size={18} className={`transition-all ${scrollState.canLeft ? 'text-white group-hover:-translate-x-0.5' : 'text-zinc-200'}`} />
                                </button>
                                <button 
                                    onClick={() => {
                                        carouselRef.current?.scrollBy({ left: 340, behavior: 'smooth' });
                                    }}
                                    className={`group relative flex items-center justify-center w-11 h-11 rounded-xl border transition-all duration-300 active:scale-90 ${
                                        scrollState.canRight 
                                            ? 'bg-zinc-950 border-zinc-950 text-white hover:bg-[#7A4FFF] hover:shadow-[0_8px_20px_rgba(122,79,255,0.3)]' 
                                            : 'bg-white/70 border-zinc-200 backdrop-blur-md text-zinc-300 opacity-50 cursor-not-allowed'
                                    }`}
                                    aria-label="Next Slide"
                                    disabled={!scrollState.canRight}
                                >
                                    {scrollState.canRight && <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    <ChevronRight size={18} className={`transition-all ${scrollState.canRight ? 'text-white group-hover:translate-x-0.5' : 'text-zinc-200'}`} />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* 🎯 AI 추천 영역 최소 높이 고정 */}
                    <div className="min-h-[260px] flex flex-col justify-center">
                        {aiRecLoading ? (
                            <div className="flex items-center justify-center py-12 gap-4">
                                <div className="w-10 h-10 border-3 border-[#7A4FFF]/10 border-t-[#7A4FFF] rounded-full animate-spin" />
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] animate-pulse">Analyzing...</p>
                            </div>
                        ) : aiRecError ? (
                            <div className="rounded-2xl border border-red-50/50 bg-red-50/20 px-6 py-10 text-center backdrop-blur-sm">
                                <p className="text-xs font-semibold text-red-900 mb-4 tracking-tight">{aiRecError}</p>
                                <button
                                    type="button"
                                    onClick={() => void loadAiRecommendations()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-[#7A4FFF] active:scale-95"
                                >
                                    <RotateCcw size={12} /> RELOAD
                                </button>
                            </div>
                        ) : aiRecommendations.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-zinc-100 bg-zinc-50/30 py-16 text-center">
                                <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">No_Matched_Missions_Found</p>
                            </div>
                        ) : (
                            <div 
                                ref={carouselRef}
                                onScroll={handleScroll}
                                id="ai-carousel"
                                className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2 snap-x"
                            >
                                {aiRecommendations.map((p, idx) => (
                                    <motion.div
                                        key={p.projectId}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex-none w-[280px] md:w-[320px] snap-start group/card py-2"
                                    >
                                        <div className="h-full flex flex-col rounded-[1.5rem] border border-zinc-100 bg-white p-6 transition-all duration-500 hover:border-[#7A4FFF]/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] relative overflow-hidden">
                                            
                                            {/* Hover Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

                                            <div className="mb-4 flex items-center justify-between relative z-10">
                                                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#7A4FFF]/5 border border-[#7A4FFF]/10">
                                                    <span className="text-[12px] font-bold uppercase tracking-widest text-[#7A4FFF]">
                                                        {Number.isFinite(p.similarityScore) ? (p.similarityScore * 100).toFixed(0) : '—'}% MATCH
                                                    </span>
                                                </div>
                                                {/* 🎯 AI PICK 로고 추가 */}
                                                <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 p-1 shadow-sm overflow-hidden group-hover/card:border-[#7A4FFF]/30 transition-colors duration-300">
                                                    <img 
                                                        src={p.logoUrl || `https://ui-avatars.com/api/?name=${p.companyName || 'C'}&background=F4F4F5&color=A1A1AA`} 
                                                        alt={p.companyName}
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <p className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{p.companyName || '개인 클라이언트'}</p>
                                                <h3 className="text-lg font-bold leading-tight text-zinc-900 line-clamp-2 min-h-[52px] group-hover/card:text-[#7A4FFF] transition-colors duration-300 relative z-10">
                                                    {p.projectName}
                                                </h3>
                                            </div>

                                            <div className="mt-auto pt-5 border-t border-zinc-50 relative z-10">
                                                <div className="mb-6">
                                                    <EstimatedBudgetBlock budgetWon={p.budget} size="sm" align="left" />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => openProjectModal(p.projectId)}
                                                    className="w-full relative overflow-hidden rounded-xl bg-zinc-950 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-[#7A4FFF] hover:shadow-[0_10px_20px_rgba(122,79,255,0.2)]"
                                                >
                                                    <span className="relative z-10">OPEN_MISSION</span>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-8 py-10 flex flex-col lg:flex-row gap-12 items-start">
                
                {/* 🎯 LEFT SIDEBAR - New Premium Filter Sidebar */}
                <FilterSidebar 
                    mode="FREELANCER"
                    selectedSkills={selectedTechs}
                    onSkillChange={(skills) => setSelectedTechs(skills)}
                    selectedLocation={selectedLocation}
                    onLocationChange={(loc) => setSelectedLocation(loc)}
                    workStyle={activeTab}
                    onWorkStyleChange={(style) => setActiveTab(style === '' ? '전체' : style)}
                    minPrice={minBudget}
                    maxPrice={maxBudget}
                    onPriceChange={(min, max) => {
                        setMinBudget(min);
                        setMaxBudget(max);
                    }}
                    onReset={resetFilters}
                />

                {/* 우측 공고 리스트 */}
                <section className="flex-1 w-full mt-0">
                    <div className="mb-8 px-6 h-[62px] bg-white/70 backdrop-blur-md rounded-full border border-zinc-100 shadow-sm flex items-center justify-between gap-4 p-1.5 relative z-20">
                        <div className="flex items-center gap-2.5 pl-1">
                            <div className="h-5 w-1.5 rounded-full bg-gradient-to-b from-[#7A4FFF] to-purple-400 shadow-[0_0_15px_rgba(122,79,255,0.3)]" />
                            <h2 className="text-xl font-black tracking-tight text-zinc-950">
                                프로젝트 공고
                            </h2>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/50 p-1 rounded-full border border-zinc-50">
                            {sortOptions.map((opt) => {
                                const isActive = sort === opt.id;
                                // 🎯 [개선] 최신순/오래된순 외에는 텍스트 고정
                                const label = opt.label;

                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleSortClick(opt.id)}
                                        className={`px-5 py-2.5 rounded-full text-[11px] font-bold transition-all tracking-wider flex items-center gap-2 ${
                                            isActive 
                                                ? 'bg-[#7A4FFF] text-white shadow-lg shadow-purple-500/20 scale-[1.02]' 
                                                : 'text-zinc-400 hover:text-zinc-600 hover:bg-white'
                                        }`}
                                    >
                                        {label}
                                        {isActive && (
                                            <motion.div
                                                initial={{ rotate: sortOrder === 'desc' ? 0 : 180 }}
                                                animate={{ rotate: sortOrder === 'desc' ? 0 : 180 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <ListFilter size={12} />
                                            </motion.div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <AnimatePresence mode="popLayout">
                            {projects.map((project, idx) => (
                                <ProjectCard
                                    key={project.projectId || project.id || idx}
                                    data={project}
                                    index={idx}
                                    onOpenProject={openProjectModal}
                                />
                            ))}
                        </AnimatePresence>

                        {hasMore && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={handleLoadMore}
                                disabled={fetchingMore}
                                className="w-full py-4 mt-4 bg-white border border-zinc-200 rounded-2xl font-black text-[11px] text-zinc-500 uppercase tracking-widest font-mono hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {fetchingMore ? "LOADING..." : "Load_More_Missions"}
                            </motion.button>
                        )}

                        {!loading && projects.length === 0 && (
                            <div className="text-center py-32 bg-white rounded-[2.5rem] border border-dashed border-zinc-200 shadow-sm">
                                <Search className="w-12 h-12 text-zinc-200 mx-auto mb-6" />
                                <h3 className="text-zinc-300 font-black text-xl font-mono uppercase tracking-tighter mb-6">일치하는_미션을_찾지_못함</h3>
                                <button
                                    onClick={resetFilters}
                                    className="px-10 py-4 bg-[#7A4FFF] text-white rounded-2xl font-black text-[11px] tracking-widest font-mono hover:bg-zinc-950 shadow-xl active:scale-95 transition-all"
                                >
                                    RELOAD_SYSTEM
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <FreelancerProjectDetailModal
                open={isProjectModalOpen}
                projectId={selectedProjectId}
                onClose={() => setIsProjectModalOpen(false)}
            />
        </div>
    );
}