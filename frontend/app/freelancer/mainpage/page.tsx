'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Globe, RotateCcw, ChevronDown, BarChart3, Activity } from 'lucide-react';
import ProjectCard from "@/components/freelancer/ProjectCard";
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';

export default function FreelancerExplorePage() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // 필터 상태 관리
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('전체');
    const [activeTab, setActiveTab] = useState('전체');

    const locations = ['인천', '서울', '경기', '부산', '대구', '원격'];

    // [필터 초기화 로직
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedLocation('전체');
        setActiveTab('전체');
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
                setAuthorized(true);
            } catch (err) {
                router.replace("/login");
            }
        };
        checkAccess();
    }, [router]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const params = {
                keyword: searchQuery || undefined,
                location: selectedLocation === '전체' ? undefined : selectedLocation,
            };
            const { data } = await api.get('/v1/projects', { params });
            setProjects(data.content || []);
        } catch (err) {
            console.error("프로젝트 공고를 불러오지 못했습니다.", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authorized) {
            const timeoutId = setTimeout(() => fetchProjects(), 300);
            return () => clearTimeout(timeoutId);
        }
    }, [searchQuery, selectedLocation, authorized]);

    if (!authorized) return <div className="min-h-screen bg-white flex items-center justify-center text-[#7A4FFF] font-black tracking-widest animate-pulse font-mono uppercase">System_Authorizing...</div>;

    // 필터링 적용 여부 확인
    const isFiltered = searchQuery !== '' || selectedLocation !== '전체' || activeTab !== '전체';

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

            {/* [디자인 고도화] Hero Section with Blueprint Decorations */}
            <section className="relative pt-24 pb-16 px-6 bg-white border-b border-zinc-100 overflow-hidden">
                {/* 배경 데코레이션 1: 그리드 패턴 */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                     style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {/* 배경 데코레이션 2: 추상 그래프 (좌측 하단) */}
                <div className="absolute left-[-20px] bottom-4 opacity-10 hidden lg:block">
                    <BarChart3 size={200} className="text-[#7A4FFF]" strokeWidth={0.5} />
                </div>

                {/* 배경 데코레이션 3: 파동 그래프 (우측 상단) */}
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
                            <p className="text-zinc-400 text-xs font-mono tracking-widest uppercase">
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
                            className="w-full bg-white border border-zinc-200 rounded-full py-5 pl-16 pr-6 focus:ring-4 focus:ring-purple-500/5 focus:border-[#7A4FFF] outline-none transition-all font-bold text-sm shadow-xl shadow-purple-900/5"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* 필터 및 리스트 영역 */}
            <main className="max-w-5xl mx-auto px-6 mt-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    {/* 프로젝트 유형 탭 */}
                    <div className="flex bg-white p-1 rounded-2xl border border-zinc-200 shadow-sm overflow-x-auto no-scrollbar">
                        {['전체', '온라인', '오프라인'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                                    activeTab === tab
                                        ? 'bg-[#7A4FFF] text-white shadow-md'
                                        : 'text-zinc-400 hover:text-zinc-900'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* 지역 필터 및 [복구] 초기화 버튼 */}
                    <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                            {locations.map((loc) => (
                                <button
                                    key={loc}
                                    onClick={() => setSelectedLocation(loc === selectedLocation ? '전체' : loc)}
                                    className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all whitespace-nowrap ${
                                        selectedLocation === loc
                                            ? 'border-[#7A4FFF] text-[#7A4FFF] bg-purple-50 shadow-sm'
                                            : 'border-zinc-200 text-zinc-500 bg-white hover:border-zinc-300'
                                    }`}
                                >
                                    {loc}
                                </button>
                            ))}
                        </div>

                        {/* 초기화 버튼 등장 */}
                        {isFiltered && (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={resetFilters}
                                className="shrink-0 flex items-center gap-1.5 text-[11px] font-black text-zinc-400 hover:text-[#FF7D00] transition-colors uppercase font-mono group"
                            >
                                <RotateCcw size={12} className="group-hover:rotate-[-45deg] transition-transform" />
                                Reset
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* 리스트 본문 */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#7A4FFF] animate-pulse" />
                            <p className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                Active_Missions: <span className="text-[#FF7D00]">{projects.length}</span>
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-10 h-10 border-4 border-[#7A4FFF]/20 border-t-[#7A4FFF] rounded-full animate-spin"></div>
                            <p className="text-[10px] font-mono font-black text-zinc-300 tracking-[0.2em] uppercase">Syncing_Dossier...</p>
                        </div>
                    ) : projects.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            <AnimatePresence mode="popLayout">
                                {projects.map((project, idx) => (
                                    <ProjectCard key={project.projectId || project.id} data={project} index={idx} />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="text-center py-28 bg-white rounded-[2.5rem] border border-dashed border-zinc-200">
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
            </main>
        </div>
    );
}