'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, DollarSign, Cpu, ChevronDown, RotateCcw, BarChart3, Activity } from 'lucide-react';
import ProjectCard from "@/components/freelancer/ProjectCard";
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';

export default function FreelancerExplorePage() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    
    // [수정] 봇 리뷰 반영: 백엔드 API가 단일 스킬만 받으므로 단일 선택(String)으로 변경
    const [selectedTech, setSelectedTech] = useState('');
    const [activeTab, setActiveTab] = useState('전체');
    
    // [수정] 봇 리뷰 반영: 정렬 상태 추가
    const [sort, setSort] = useState('createdAt');

    // [수정] 봇 리뷰 반영: 페이지네이션(무한 스크롤 스타일 '더 보기') 상태 추가
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const locations = ['서울', '경기', '인천', '부산', '대구', '원격'];
    const techStacks = ['Java', 'Spring Boot', 'React', 'Next.js', 'MySQL', 'TypeScript'];

    // [복구] 필터 초기화 로직
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedLocation('');
        setSelectedTech('');
        setActiveTab('전체');
        setSort('createdAt');
        setPage(0);
    };

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
                setAuthorized(true);
            } catch (err) {
                router.replace("/login");
            }
        };
        checkAccess();
    }, [router]);

    const fetchProjects = async (pageNum: number, isLoadMore: boolean = false) => {
        if (!isLoadMore) setLoading(true);
        try {
            const onlineFilter = activeTab === '온라인' ? true : undefined;
            const offlineFilter = activeTab === '오프라인' ? true : undefined;

            const params = {
                keyword: searchQuery || undefined,
                location: selectedLocation || undefined,
                skill: selectedTech || undefined,
                online: onlineFilter,
                offline: offlineFilter,
                sort: `${sort},desc`, // 최신순 또는 다른 정렬 조건
                page: pageNum,
                size: 10
            };
            const { data } = await api.get('/v1/projects', { params });

            if (isLoadMore) {
                setProjects(prev => [...prev, ...(data.content || [])]);
            } else {
                setProjects(data.content || []);
            }
            
            setTotalElements(data.totalElements || 0);
            setHasMore(!data.last); // 마지막 페이지가 아니면 더 보기 버튼 표시
            
        } catch (err) {
            // 콘솔 오염 방지
        } finally {
            setLoading(false);
        }
    };

    // 필터가 변경되면 페이지를 0으로 리셋하고 다시 불러옵니다.
    useEffect(() => {
        if (authorized) {
            setPage(0);
            const timeoutId = setTimeout(() => {
                fetchProjects(0, false);
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [searchQuery, selectedLocation, selectedTech, activeTab, sort, authorized]);

    // '더 보기' 버튼 클릭 시 호출
    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProjects(nextPage, true);
    };

    if (!authorized) return <div className="min-h-screen bg-white flex items-center justify-center text-[#7A4FFF] font-black tracking-widest animate-pulse font-mono uppercase text-xs">System_Authorizing...</div>;

    const isFiltered = searchQuery !== '' || selectedLocation !== '' || selectedTech !== '' || activeTab !== '전체';

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 pb-20 font-sans overflow-x-hidden">
            {/* 상단 네비게이션 바 */}
            <nav className="w-full py-5 px-10 bg-white/80 backdrop-blur-xl border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/")}>
                    <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                </div>
                <div className="flex gap-6 items-center">
                    <button onClick={() => router.push('/profile')} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 tracking-widest transition uppercase font-mono">
                        MY_PROFILE
                    </button>
                    <div className="w-8 h-8 rounded-full bg-[#FF7D00] border-2 border-white shadow-sm overflow-hidden">
                        <img src="https://placehold.co/100x100" alt="profile" />
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 px-6 bg-white border-b border-zinc-100 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                     style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="absolute left-[-20px] bottom-4 opacity-10 hidden lg:block">
                    <BarChart3 size={200} className="text-[#7A4FFF]" strokeWidth={0.5} />
                </div>
                <div className="absolute right-[-40px] top-10 opacity-10 hidden lg:block rotate-12">
                    <Activity size={240} className="text-[#FF7D00]" strokeWidth={0.5} />
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                            나에게 맞는 <span className="text-[#7A4FFF]">프로젝트</span>를 찾아보세요.
                        </h1>
                        <div className="flex items-center justify-center gap-2 mb-10">
                            <span className="h-[1px] w-8 bg-zinc-200" />
                            <p className="text-zinc-400 text-[10px] font-mono tracking-widest uppercase">
                                Available_Missions_Database_v2.0
                            </p>
                            <span className="h-[1px] w-8 bg-zinc-200" />
                        </div>
                    </motion.div>

                    <div className="max-w-2xl mx-auto relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#7A4FFF] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="기술 스택, 프로젝트명 검색..."
                            className="w-full bg-white border-2 border-zinc-200 rounded-full py-5 pl-16 pr-6 focus:ring-4 focus:ring-purple-500/5 focus:border-[#7A4FFF] outline-none transition-all font-bold text-sm shadow-xl shadow-purple-900/5"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            <main className="max-w-5xl mx-auto px-6 mt-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    {/* 프로젝트 유형 탭 */}
                    <div className="flex bg-white p-1 rounded-2xl border border-zinc-200 shadow-sm overflow-x-auto no-scrollbar">
                        {['전체', '온라인', '오프라인'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap ${
                                    activeTab === tab
                                        ? 'bg-[#7A4FFF] text-white shadow-md'
                                        : 'text-zinc-400 hover:text-zinc-900'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* 지역 필터 및 초기화 */}
                    <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                            {locations.map((loc) => (
                                <button
                                    key={loc}
                                    onClick={() => setSelectedLocation(loc === selectedLocation ? '' : loc)}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap ${
                                        selectedLocation === loc
                                            ? 'border-[#7A4FFF] text-[#7A4FFF] bg-purple-50 shadow-sm'
                                            : 'border-zinc-200 text-zinc-500 bg-white hover:border-zinc-300'
                                    }`}
                                >
                                    {loc}
                                </button>
                            ))}
                        </div>

                        {isFiltered && (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={resetFilters}
                                className="shrink-0 flex items-center gap-1.5 text-[10px] font-black text-zinc-400 hover:text-[#FF7D00] transition-colors uppercase font-mono group"
                            >
                                <RotateCcw size={12} className="group-hover:rotate-[-45deg] transition-transform" />
                                Reset
                            </motion.button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* 좌측 사이드바 필터 */}
                    <aside className="w-full lg:w-64 shrink-0 space-y-8">
                        <section>
                            <h3 className="flex items-center gap-2 font-black text-xs tracking-widest uppercase mb-4 text-zinc-400 font-mono">
                                <Cpu size={14} /> Tech_Stacks
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {techStacks.map(tech => (
                                    <button
                                        key={tech}
                                        // [수정] 다중 선택에서 단일 선택으로 변경 (토글 기능 유지)
                                        onClick={() => setSelectedTech(selectedTech === tech ? '' : tech)}
                                        className={`px-3 py-2 rounded-xl text-[10px] font-bold text-left transition-all border ${
                                            selectedTech === tech
                                                ? 'bg-zinc-900 border-zinc-900 text-white shadow-md'
                                                : 'bg-white border-zinc-100 text-zinc-500 hover:border-zinc-300 shadow-sm'
                                        }`}
                                    >
                                        {selectedTech === tech ? '● ' : '○ '} {tech}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="flex items-center gap-2 font-black text-xs tracking-widest uppercase mb-4 text-zinc-400 font-mono">
                                <DollarSign size={14} /> Budget_Range
                            </h3>
                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 opacity-50 pointer-events-none">
                                <input type="range" className="w-full accent-[#FF7D00]" min="0" max="2000" disabled />
                                <div className="flex justify-between mt-2 font-mono text-[9px] text-zinc-400 font-bold">
                                    <span>MIN</span>
                                    <span>MAX</span>
                                </div>
                                <p className="text-[9px] text-center mt-2 text-zinc-400 font-bold">지원 준비 중</p>
                            </div>
                        </section>
                    </aside>

                    {/* 우측 공고 리스트 */}
                    <section className="flex-1">
                        <div className="flex justify-between items-end mb-6 border-b border-zinc-100 pb-4">
                            <p className="font-mono text-[11px] font-black text-zinc-900 uppercase tracking-tighter">
                                Total_Missions: <span className="text-[#FF7D00]">{totalElements}</span>
                            </p>
                            
                            {/* [수정] 봇 리뷰 반영: 가짜 버튼 대신 실제 API와 연동되는 정렬(select) 도입 */}
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
                                    <ProjectCard key={project.projectId || project.id} data={project} index={idx} />
                                ))}
                            </AnimatePresence>

                            {/* [수정] 봇 리뷰 반영: 무한 스크롤/페이지네이션 '더 보기' 버튼 추가 */}
                            {hasMore && (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={handleLoadMore}
                                    className="w-full py-4 mt-4 bg-white border border-zinc-200 rounded-2xl font-black text-[11px] text-zinc-500 uppercase tracking-widest font-mono hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm"
                                >
                                    Load_More_Missions
                                </motion.button>
                            )}

                            {!loading && projects.length === 0 && (
                                <div className="text-center py-28 bg-white rounded-[2.5rem] border border-dashed border-zinc-200 shadow-sm">
                                    <h3 className="text-zinc-300 font-black text-xl font-mono uppercase tracking-tighter mb-6">No_Matching_Missions</h3>
                                    <button
                                        onClick={resetFilters}
                                        className="px-8 py-3 bg-zinc-950 text-white rounded-2xl font-black text-[11px] tracking-widest font-mono hover:bg-[#FF7D00] transition-all shadow-xl active:scale-95"
                                    >
                                        RELOAD_SYSTEM
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
