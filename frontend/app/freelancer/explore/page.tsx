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
    const [selectedTech, setSelectedTech] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('전체');

    const locations = ['서울', '경기', '인천', '부산', '대구', '원격'];
    const techStacks = ['Java', 'Spring Boot', 'React', 'Next.js', 'MySQL', 'TypeScript'];

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

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const onlineFilter = activeTab === '온라인' ? true : undefined;
            const offlineFilter = activeTab === '오프라인' ? true : undefined;

            const params = {
                keyword: searchQuery || undefined,
                location: selectedLocation || undefined,
                skill: selectedTech.length > 0 ? selectedTech[0] : undefined,
                online: onlineFilter,
                offline: offlineFilter
            };
            const { data } = await api.get('/v1/projects', { params });

            setProjects(data.content || []);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            console.error("프로젝트 공고를 불러오지 못했습니다.", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authorized) {
            const timeoutId = setTimeout(() => {
                fetchProjects();
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [searchQuery, selectedLocation, selectedTech, activeTab, authorized]);

    const toggleTech = (tech: string) => {
        setSelectedTech(prev =>
            prev.includes(tech)
                ? prev.filter((t: string) => t !== tech)
                : [...prev, tech]
        );
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedLocation('');
        setSelectedTech([]);
        setActiveTab('전체');
    };

    if (!authorized) return (
        <div className="min-h-screen bg-white flex items-center justify-center text-[#7A4FFF] font-black tracking-widest animate-pulse font-mono uppercase text-xs">
            데이터_접근_권한_확인_중...
        </div>
    );

    const isFiltered = searchQuery !== '' || selectedLocation !== '' || selectedTech.length > 0 || activeTab !== '전체';

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 pb-20 font-sans overflow-x-hidden">
            {/* 상단 네비게이션 바 (마스터의 기존 스타일 유지) */}
            <nav className="w-full py-5 px-10 bg-white/80 backdrop-blur-xl border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/")}>
                    <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                </div>
                <div className="flex gap-6 items-center">
                    <button onClick={() => router.push('/profile')} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 tracking-widest transition uppercase font-mono">
                        나의_프로필
                    </button>
                    <div className="w-8 h-8 rounded-full bg-[#FF7D00] border-2 border-white shadow-sm overflow-hidden">
                        <img src="https://placehold.co/100x100" alt="profile" className="w-full h-full object-cover" />
                    </div>
                </div>
            </nav>

            {/* 고도화된 한국어 Hero Header */}
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
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-zinc-900">
                            나에게 맞는 <span className="text-[#7A4FFF]">프로젝트</span>를 찾으세요.
                        </h1>
                        <div className="flex items-center justify-center gap-2 mb-10">
                            <span className="h-[1px] w-8 bg-zinc-200" />
                            <p className="text-zinc-400 text-[10px] font-mono tracking-[0.2em] uppercase">
                                가용한_미션_데이터베이스_v2.0
                            </p>
                            <span className="h-[1px] w-8 bg-zinc-200" />
                        </div>
                    </motion.div>

                    <div className="max-w-2xl mx-auto relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#7A4FFF] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="기술 스택, 프로젝트명, 기업 검색..."
                            className="w-full bg-white border border-zinc-200 rounded-full py-5 pl-16 pr-6 focus:ring-4 focus:ring-purple-500/5 focus:border-[#7A4FFF] outline-none transition-all font-bold text-sm shadow-xl shadow-purple-900/5"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 md:px-10 py-10 flex flex-col lg:flex-row gap-10">
                {/* 좌측 사이드바 필터 */}
                <aside className="w-full lg:w-64 shrink-0 space-y-8">
                    <section>
                        <div className="flex bg-white p-1 rounded-2xl border border-zinc-200 shadow-sm">
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
                                    onClick={() => toggleTech(tech)}
                                    className={`px-3 py-2.5 rounded-xl text-[10px] font-bold text-left transition-all border ${
                                        selectedTech.includes(tech) ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' : 'bg-white border-zinc-100 text-zinc-500 hover:border-zinc-300 shadow-sm'
                                    }`}
                                >
                                    {selectedTech.includes(tech) ? '● ' : '○ '} {tech}
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
                    <div className="flex justify-between items-center mb-6 px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#7A4FFF] animate-pulse" />
                            <p className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                모집_중인_미션: <span className="text-[#FF7D00]">{totalElements}</span>
                            </p>
                        </div>
                        <button className="flex items-center gap-1 text-[10px] font-black uppercase font-mono text-zinc-400 hover:text-zinc-600">
                            정렬: 최신순 <ChevronDown size={14} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-10 h-10 border-4 border-[#7A4FFF]/20 border-t-[#7A4FFF] rounded-full animate-spin" />
                            <p className="text-[10px] font-mono font-black text-zinc-300 tracking-[0.2em] uppercase">데이터_동기화_중...</p>
                        </div>
                    ) : projects.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5">
                            <AnimatePresence mode="popLayout">
                                {projects.map((project, idx) => (
                                    <ProjectCard key={project.projectId || project.id} data={project} index={idx} />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="text-center py-32 bg-white rounded-[2.5rem] border border-dashed border-zinc-200 shadow-sm">
                            <Search className="w-12 h-12 text-zinc-200 mx-auto mb-6" />
                            <h3 className="text-zinc-300 font-black text-xl font-mono uppercase tracking-tighter mb-6">일치하는_미션을_찾지_못함</h3>
                            <button
                                onClick={resetFilters}
                                className="px-10 py-4 bg-zinc-950 text-white rounded-2xl font-black text-[11px] tracking-widest font-mono hover:bg-[#FF7D00] shadow-xl active:scale-95 transition-all"
                            >
                                검색_조건_재설정
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}