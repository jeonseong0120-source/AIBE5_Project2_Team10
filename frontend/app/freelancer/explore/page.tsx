'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, DollarSign, Cpu, RotateCcw, BarChart3, Activity, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import ProjectCard from "@/components/freelancer/ProjectCard";
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';

// 🎯 [추가] 대통합 네비게이션 바 불러오기!
import GlobalNavbar, { UserData, ProfileData } from '@/components/common/GlobalNavbar';

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
    const [selectedTech, setSelectedTech] = useState('');
    const [activeTab, setActiveTab] = useState('전체');
    const [sort, setSort] = useState('createdAt');

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [fetchingMore, setFetchingMore] = useState(false);

    type AiRecommendedProject = {
        projectId: number;
        projectName: string;
        similarityScore: number;
        budget: number;
    };
    const [aiRecommendations, setAiRecommendations] = useState<AiRecommendedProject[]>([]);
    const [aiRecLoading, setAiRecLoading] = useState(false);
    const [aiRecError, setAiRecError] = useState<string | null>(null);

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

    const locations = ['서울', '경기', '인천', '부산', '대구', '원격'];
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
            const onlineFilter = activeTab === '온라인' ? true : undefined;
            const offlineFilter = activeTab === '오프라인' ? true : undefined;

            const params = {
                keyword: searchQuery || undefined,
                location: selectedLocation || undefined,
                skill: selectedTech || undefined,
                online: onlineFilter,
                offline: offlineFilter,
                sort: `${sort},desc`,
                page: pageNum,
                size: 10
            };
            const { data } = await api.get('/v1/projects', { params });

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
        setSearchQuery(''); setSelectedLocation(''); setSelectedTech(''); setActiveTab('전체'); setSort('createdAt'); setPage(0);
    };

    useEffect(() => {
        if (authorized) {
            // 🎯 [추가] 사진을 가져오기 위해 프리랜서 프로필 API 호출! (클라이언트와 동일한 방식)
            api.get('/v1/freelancers/me')
                .then(res => setProfile(res.data))
                .catch(() => console.error("프로필 로드 실패"));

            setPage(0);
            const timeoutId = setTimeout(() => { fetchProjects(0, false); }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [searchQuery, selectedLocation, selectedTech, activeTab, sort, authorized]);

    const handleLoadMore = () => {
        if (fetchingMore) return;
        const nextPage = page + 1;
        fetchProjects(nextPage, true);
    };

    if (!authorized) return <div className="min-h-screen bg-white flex items-center justify-center text-[#7A4FFF] font-black tracking-widest animate-pulse font-mono uppercase text-xs">인증 정보를 확인 중입니다...</div>;

    const isFiltered = searchQuery !== '' || selectedLocation !== '' || selectedTech !== '' || activeTab !== '전체';

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 pb-20 font-sans overflow-x-hidden">

            {/* 🎯 [수정 완료] user 정보와 profile(사진 등) 정보를 통째로 넘겨줍니다! */}
            <GlobalNavbar user={user} profile={profile} />

            {/* Hero Section */}
            <header className="relative pt-24 pb-16 px-6 bg-white border-b border-zinc-100 overflow-hidden text-center">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                     style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="absolute left-[-20px] bottom-4 opacity-5 hidden lg:block text-[#7A4FFF]">
                    <BarChart3 size={200} strokeWidth={0.5} />
                </div>
                <div className="absolute right-[-40px] top-10 opacity-5 hidden lg:block rotate-12 text-[#FF7D00]">
                    <Activity size={240} strokeWidth={0.5} />
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex justify-center gap-6 text-[10px] text-zinc-400 mb-6 font-black font-mono tracking-[0.2em] uppercase">
                            <div>ACTIVE_MISSIONS_2,481</div>
                            <span className="text-zinc-200">|</span>
                            <div>SEOUL_NODES_ACTIVE</div>
                            <span className="text-zinc-200">|</span>
                            <div>MATCH_INDEX_0.98</div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-zinc-900">
                            나에게 맞는 <span className="text-[#7A4FFF]">프로젝트</span>를 찾으세요.
                        </h1>
                        <div className="flex items-center justify-center gap-2 mb-10">
                            <span className="h-[1px] w-8 bg-zinc-200" />
                            <p className="text-zinc-400 text-[10px] font-mono tracking-[0.2em] uppercase">
                                Available_Missions_Database_v2.0
                            </p>
                            <span className="h-[1px] w-8 bg-zinc-200" />
                        </div>
                    </motion.div>

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

            <section className="relative z-10 max-w-7xl mx-auto px-8 pb-6">
                <div className="rounded-[2rem] border border-purple-200/80 bg-gradient-to-br from-white via-purple-50/40 to-white p-8 md:p-10 shadow-xl shadow-purple-500/5">
                    <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <Sparkles className="text-[#7A4FFF]" size={20} />
                                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#7A4FFF] font-mono">Client missions</span>
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-zinc-950 md:text-3xl">AI 추천 공고</h2>
                            <p className="mt-1 text-sm font-medium text-zinc-500">
                                스킬 태그, 온·오프라인, 지역, 공고 예산(내 희망 시급 기준)을 함께 반영해 맞는 모집 공고를 정렬합니다.
                            </p>
                        </div>
                    </div>
                    {aiRecLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-10 w-10 animate-spin text-[#7A4FFF]" />
                        </div>
                    ) : aiRecError ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50/80 px-6 py-10 text-center">
                            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-500" aria-hidden />
                            <p className="text-sm font-semibold text-red-900">{aiRecError}</p>
                            <button
                                type="button"
                                onClick={() => void loadAiRecommendations()}
                                className="mt-6 rounded-xl bg-zinc-950 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-[#7A4FFF] font-mono"
                            >
                                다시 시도
                            </button>
                        </div>
                    ) : aiRecommendations.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-6 py-10 text-center text-sm font-medium text-zinc-400">
                            표시할 모집 중 공고가 없습니다. 마켓에 등록된 공고가 있는지 확인하거나, 온·오프라인 조건에 맞는 공고가 있는지 살펴보세요.
                        </div>
                    ) : (
                        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {aiRecommendations.map((p) => (
                                <li
                                    key={p.projectId}
                                    className="flex flex-col rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition hover:border-[#7A4FFF]/40 hover:shadow-md"
                                >
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#7A4FFF] font-mono border border-purple-100">
                                            match {(p.similarityScore * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <h3 className="mb-2 line-clamp-2 text-lg font-black leading-snug text-zinc-900">{p.projectName}</h3>
                                    <p className="mb-4 font-mono text-xl font-black italic text-zinc-800">₩{Number(p.budget).toLocaleString()}</p>
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/freelancer/projects/${p.projectId}`)}
                                        className="mt-auto w-full rounded-xl bg-zinc-950 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-[#7A4FFF] font-mono"
                                    >
                                        공고 보기
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-8 py-10 flex flex-col lg:flex-row gap-10">
                {/* 좌측 사이드바 필터 */}
                <aside className="w-full lg:w-64 shrink-0 space-y-8">
                    <section>
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

                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase text-zinc-400 font-mono">
                                <MapPin size={14} /> 활동_지역
                            </h3>
                            {selectedLocation && (
                                <button onClick={() => setSelectedLocation('')} className="text-[10px] text-[#FF7D00] font-bold">초기화</button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {locations.map(loc => (
                                <button
                                    key={loc}
                                    onClick={() => setSelectedLocation(loc === selectedLocation ? '' : loc)}
                                    className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                                        selectedLocation === loc ? 'border-[#7A4FFF] text-[#7A4FFF] bg-purple-50' : 'bg-white border-zinc-200 text-zinc-500 shadow-sm hover:border-zinc-300'
                                    }`}
                                >
                                    {loc}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase mb-4 text-zinc-400 font-mono">
                            <Cpu size={14} /> 기술_스택
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {techStacks.map(tech => (
                                <button
                                    key={tech}
                                    onClick={() => setSelectedTech(selectedTech === tech ? '' : tech)}
                                    className={`px-3 py-2.5 rounded-xl text-[10px] font-bold text-left transition-all border ${
                                        selectedTech === tech ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' : 'bg-white border-zinc-100 text-zinc-500 hover:border-zinc-300 shadow-sm'
                                    }`}
                                >
                                    {selectedTech === tech ? '● ' : '○ '} {tech}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase mb-4 text-zinc-400 font-mono">
                            <DollarSign size={14} /> 희망_예산
                        </h3>
                        <div className="p-5 bg-white rounded-2xl border border-zinc-100 shadow-inner opacity-40">
                            <input type="range" className="w-full accent-[#FF7D00]" disabled />
                            <div className="flex justify-between mt-2 font-mono text-[9px] text-zinc-400 font-bold">
                                <span>최소</span>
                                <span>최대</span>
                            </div>
                        </div>
                    </section>

                    {isFiltered && (
                        <button
                            onClick={resetFilters}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-100 text-zinc-400 rounded-2xl text-[11px] font-black uppercase font-mono hover:bg-[#FF7D00] hover:text-white transition-all group shadow-sm"
                        >
                            <RotateCcw size={14} className="group-hover:rotate-[-45deg] transition-transform" />
                            필터_설정_초기화
                        </button>
                    )}
                </aside>

                {/* 우측 공고 리스트 */}
                <section className="flex-1">
                    <div className="flex justify-between items-center mb-6 border-b border-zinc-100 pb-6">
                        <div>
                            <div className="mb-1 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF7D00] animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#FF7D00] font-mono italic">live database</span>
                            </div>
                            <p className="font-mono text-xl font-black text-zinc-950 uppercase tracking-tighter">
                                Total_Missions <span className="text-zinc-300 mx-1">/</span> <span className="text-[#FF7D00]">{totalElements}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-black uppercase font-mono text-zinc-400">
                            SORT:
                            <select
                                className="bg-transparent text-zinc-900 outline-none cursor-pointer hover:text-[#7A4FFF] transition-colors"
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                            >
                                <option value="createdAt">LATEST (최신순)</option>
                                <option value="budget">BUDGET (예산순)</option>
                            </select>
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