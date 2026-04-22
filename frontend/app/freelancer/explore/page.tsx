'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, DollarSign, Cpu, RotateCcw, BarChart3, Activity, Sparkles, Loader2, AlertCircle, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import ProjectCard from "@/components/freelancer/ProjectCard";
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';

// 🎯 [추가] 대통합 네비게이션 바 불러오기!
import GlobalNavbar, { type UserData, type ProfileData } from '../../../components/common/GlobalNavbar';

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
    const [sort, setSort] = useState('createdAt');
    const [isSortOpen, setIsSortOpen] = useState(false);
    
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

    const locations = ['전국', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
    const techStacks = [
        'Java',
        'Spring Boot',
        'React',
        'Next.js',
        'TypeScript',
        'Node.js',
        'Python',
        'Kotlin',
        'Go',
        'Vue.js',
        'PostgreSQL',
        'MongoDB',
        'AWS',
        'Docker',
        'Kubernetes',
        'Flutter',
        'GraphQL',
        'Tailwind CSS',
        'Figma',
    ];

    useEffect(() => {
        const checkAccess = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("로그인이 필요합니다.");
                router.replace("/login");
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
                    alert("프리랜서 전용 화면입니다.");
                    router.replace("/dashboard");
                    return;
                }

                const normalizedRole = res.data.role?.replace("ROLE_", "") || "";
                setUser({ ...res.data, role: normalizedRole as UserData['role'] });
                setAuthorized(true);
            } catch (err) {
                router.replace("/login");
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

            // 🎯 [최적화] URLSearchParams를 사용하여 skill=A&skill=B 형태로 반복 전달 (Axios 기본 배열 직렬화 해결)
            const searchParams = new URLSearchParams();
            if (searchQuery) searchParams.append('keyword', searchQuery);
            if (selectedLocation) searchParams.append('location', selectedLocation);
            selectedTechs.forEach(tech => searchParams.append('skill', tech));
            if (onlineFilter) searchParams.append('online', onlineFilter);
            if (offlineFilter) searchParams.append('offline', offlineFilter);
            
            searchParams.append('sort', sort === 'budget' ? 'budget,asc' : `${sort},desc`);
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
        setSearchQuery(''); setSelectedLocation(''); setSelectedTechs([]); setActiveTab('전체'); setSort('createdAt'); setPage(0);
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
    }, [searchQuery, selectedLocation, selectedTechs, activeTab, sort, authorized]);

    const handleLoadMore = () => {
        if (fetchingMore) return;
        const nextPage = page + 1;
        fetchProjects(nextPage, true);
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
            <header className="relative pt-24 pb-16 px-6 bg-white border-b border-zinc-100 overflow-hidden text-center">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {/* 데코레이션 아이콘 */}
                <div className="absolute left-[-20px] bottom-4 opacity-5 hidden lg:block text-[#7A4FFF]">
                    <BarChart3 size={200} strokeWidth={0.5} />
                </div>
                <div className="absolute right-[-40px] top-10 opacity-5 hidden lg:block rotate-12 text-[#FF7D00]">
                    <Activity size={240} strokeWidth={0.5} />
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-10 text-zinc-900 leading-tight">
                            나에게 맞는 <span className="text-[#7A4FFF]">프로젝트</span>를 찾으세요.
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

            {/* 🎯 AI Recommended Projects Section - Slim & Compact Premium UI */}
            <section className="relative z-10 max-w-7xl mx-auto px-8 pb-6">
                <div className="group/container rounded-[2rem] border border-zinc-200/50 bg-white/80 backdrop-blur-xl p-8 md:p-10 shadow-xl shadow-purple-500/5 relative overflow-hidden">
                    
                    {/* Subtle Decorative Background */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-purple-500/5 to-orange-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="text-[#7A4FFF]" size={14} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#7A4FFF] font-mono italic">Recommended</span>
                                </div>
                                <h2 className="text-2xl font-black tracking-tighter text-zinc-950 uppercase font-mono leading-none">
                                    AI <span className="text-[#7A4FFF]">TOP_PICK</span>
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

                    {aiRecLoading ? (
                        <div className="flex items-center justify-center py-12 gap-4">
                            <div className="w-10 h-10 border-3 border-[#7A4FFF]/10 border-t-[#7A4FFF] rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-zinc-400 font-mono uppercase tracking-[0.2em] animate-pulse">Analyzing...</p>
                        </div>
                    ) : aiRecError ? (
                        <div className="rounded-2xl border border-red-50/50 bg-red-50/20 px-6 py-10 text-center backdrop-blur-sm">
                            <p className="text-xs font-bold text-red-900 mb-4 font-mono uppercase tracking-tight">{aiRecError}</p>
                            <button
                                type="button"
                                onClick={() => void loadAiRecommendations()}
                                className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#7A4FFF] font-mono active:scale-95"
                            >
                                <RotateCcw size={12} /> RELOAD
                            </button>
                        </div>
                    ) : aiRecommendations.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-100 bg-zinc-50/30 py-16 text-center">
                            <p className="text-xs font-black text-zinc-300 uppercase font-mono tracking-widest">No_Matched_Missions_Found</p>
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
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7A4FFF]/5 border border-[#7A4FFF]/10">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#7A4FFF] font-mono">
                                                    {(p.similarityScore * 100).toFixed(0)}% MATCH
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
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono mb-1">{p.companyName || '개인 클라이언트'}</p>
                                            <h3 className="text-sm font-black leading-tight text-zinc-900 line-clamp-2 min-h-[40px] group-hover/card:text-[#7A4FFF] transition-colors duration-300 relative z-10">
                                                {p.projectName}
                                            </h3>
                                        </div>

                                        <div className="mt-auto pt-5 border-t border-zinc-50 relative z-10">
                                            <div className="flex items-end justify-between mb-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.2em] font-mono mb-1">Budget</span>
                                                    <p className="font-mono text-xl font-black text-zinc-950 italic">
                                                        ₩{Number(p.budget).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center group-hover/card:bg-zinc-950 group-hover/card:text-white transition-all duration-300">
                                                    <ChevronRight size={16} className="transition-transform group-hover/card:translate-x-0.5" />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => router.push(`/freelancer/projects/${p.projectId}`)}
                                                className="w-full relative overflow-hidden rounded-xl bg-zinc-950 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-[#7A4FFF] hover:shadow-[0_10px_20px_rgba(122,79,255,0.2)] font-mono"
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
            </section>

            <main className="max-w-7xl mx-auto px-8 py-12 flex flex-col lg:flex-row gap-12">
                
                {/* 🎯 LEFT SIDEBAR - Sticky & Optimized UI */}
                <aside className="w-full lg:w-72 shrink-0 space-y-10">
                    <div className="sticky top-28 space-y-10">
                    
                    {/* 1. 협업 근무 방식 필터 */}
                    <section>
                        <h3 className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase mb-4 text-zinc-400 font-mono">
                            <BarChart3 size={14} /> 협업_근무_방식
                        </h3>
                        <div className="flex bg-white p-1 rounded-2xl border border-zinc-200 shadow-sm overflow-x-auto no-scrollbar">
                            {['전체', '온라인', '오프라인'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all ${
                                        activeTab === tab ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-900'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 2. 기술 스택 필터 (그리드 형태) */}
                    <section>
                        <h3 className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase mb-4 text-zinc-400 font-mono">
                            <Sparkles size={14} /> 프로젝트_기술_스택
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {techStacks.map(tech => {
                                const isSelected = selectedTechs.includes(tech);
                                return (
                                    <button
                                        key={tech}
                                        onClick={() => {
                                            setSelectedTechs(prev => 
                                                prev.includes(tech) 
                                                    ? prev.filter(t => t !== tech)
                                                    : [...prev, tech]
                                            );
                                        }}
                                        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-black transition-all border ${
                                            isSelected 
                                                ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' 
                                                : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-300 hover:text-zinc-900'
                                        }`}
                                    >
                                        {tech}
                                        <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-[#7A4FFF]' : 'bg-transparent group-hover:bg-zinc-200'}`} />
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* 3. 활동 지역 필터 (3열 컴팩트 그리드 - Client Mainpage 스타일) */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase text-zinc-400 font-mono">
                                <MapPin size={14} /> 활동_지역
                            </h3>
                            {selectedLocation && (
                                <span className="text-[9px] font-black text-[#7A4FFF] font-mono animate-pulse">FILTER_ACTIVE</span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {locations.map(loc => {
                                const isActive = (loc === '전국' && selectedLocation === '') || selectedLocation === loc;
                                return (
                                    <button
                                        key={loc}
                                        onClick={() => setSelectedLocation(loc === '전국' ? '' : (selectedLocation === loc ? '' : loc))}
                                        className={`group flex flex-col items-center justify-center py-2 rounded-lg text-[9px] font-black transition-all border ${
                                            isActive
                                                ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' 
                                                : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-300 hover:text-zinc-900'
                                        }`}
                                    >
                                        {loc}
                                        <div className={`mt-1 w-1 h-1 rounded-full ${
                                            isActive
                                                ? 'bg-[#7A4FFF]' 
                                                : 'bg-transparent group-hover:bg-zinc-200'
                                        }`} />
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* 4. 희망 예산 브랜딩 (Coming Soon 스타일로 유지하되 세련되게) */}
                    <section>
                        <h3 className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase mb-4 text-zinc-400 font-mono">
                            <DollarSign size={14} /> 프로젝트_예산
                        </h3>
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                            <div className="text-[10px] font-black text-zinc-300 font-mono uppercase tracking-widest py-2">
                                System_Updating...
                            </div>
                        </div>
                    </section>

                    {isFiltered && (
                        <button
                            onClick={resetFilters}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-100 text-zinc-400 rounded-2xl text-[11px] font-black uppercase font-mono hover:bg-[#7A4FFF] hover:text-white transition-all group shadow-sm"
                        >
                            <RotateCcw size={14} className="group-hover:rotate-[-45deg] transition-transform" />
                            필터_설정_초기화
                        </button>
                    )}
                    </div>
                </aside>

                {/* 우측 공고 리스트 */}
                <section className="flex-1">
                    <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-8 relative z-20">
                        <div /> {/* Left side empty */}

                        {/* 🎯 [개선] 커스텀 프리미엄 정렬 드롭다운 */}
                        <div className="relative group/sort">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase font-mono text-zinc-400 tracking-widest">Sort_By:</span>
                                <button
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-100 rounded-xl text-[11px] font-black font-mono text-zinc-900 transition-all hover:border-[#7A4FFF] hover:text-[#7A4FFF] shadow-sm active:scale-95"
                                >
                                    {sort === 'createdAt' ? 'LATEST (최신순)' : 'BUDGET (예산순)'}
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            <AnimatePresence>
                                {isSortOpen && (
                                    <>
                                        {/* 외부 클릭 시 닫기 위한 오버레이 */}
                                        <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                                        
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-48 bg-white border border-zinc-100 rounded-2xl shadow-2xl shadow-zinc-950/20 overflow-hidden z-20"
                                        >
                                            {[
                                                { label: 'LATEST (최신순)', value: 'createdAt' },
                                                { label: 'BUDGET (예산순)', value: 'budget' }
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSort(option.value);
                                                        setIsSortOpen(false);
                                                    }}
                                                    className={`w-full px-5 py-3.5 text-left text-[11px] font-black font-mono transition-colors ${
                                                        sort === option.value 
                                                            ? 'bg-zinc-50 text-[#7A4FFF]' 
                                                            : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950'
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <AnimatePresence mode="popLayout">
                            {projects.map((project, idx) => (
                                <ProjectCard key={project.projectId || project.id || idx} data={project} index={idx} />
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
                                    className="px-10 py-4 bg-zinc-950 text-white rounded-2xl font-black text-[11px] tracking-widest font-mono hover:bg-[#FF7D00] shadow-xl active:scale-95 transition-all"
                                >
                                    RELOAD_SYSTEM
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}