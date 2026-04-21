'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FreelancerCard from '@/components/freelancer/FreelancerCard';
import { FreelancerProfile, ApiFreelancerDto, mapFreelancerDtoToProfile } from '@/types/freelancer';
import api from '../../lib/axios';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

// 🎯 1. 대통합 네비게이션 바 불러오기
import GlobalNavbar, { UserData, ProfileData } from '@/components/common/GlobalNavbar';

export default function ClientDashboard() {
    const router = useRouter();
    const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
    const [filter, setFilter] = useState({ skill: [] as string[], region: '', sort: 'id', workStyle: '' });
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // 🎯 2. GlobalNavbar에 전달할 유저 정보 상태
    const [user, setUser] = useState<UserData | null>(null);

    // 🎯 [추가] 사진(logoUrl) 데이터를 담을 프로필 상태
    const [profile, setProfile] = useState<ProfileData | null>(null);

    const [cursor, setCursor] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const move = (e: MouseEvent) => {
            setCursor({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

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

                // 🎯 [리뷰 반영] Role 정규화: ROLE_BOTH -> BOTH (GlobalNavbar 대응)
                const normalizedRole = res.data.role?.replace("ROLE_", "") || "";

                if (normalizedRole === "GUEST") {
                    router.replace("/onboarding");
                    return;
                }

                if (normalizedRole === "FREELANCER") {
                    alert("해당 대시보드는 클라이언트 전용 화면입니다.");
                    router.replace("/");
                    return;
                }

                // 🎯 3. 정규화된 유저 정보 저장
                setUser({ ...res.data, role: normalizedRole as UserData['role'] });
                setAuthorized(true);
            } catch {
                router.replace("/login");
            }
        };

        checkAccess();
    }, [router]);

    // 🎯 [리뷰 반영] 프로필 호출을 필터 의존성에서 분리하여 세션 스코프로 한 번만 실행
    useEffect(() => {
        if (authorized) {
            api.get('/client/profile')
                .then(res => setProfile(res.data))
                .catch(() => {});
        }
    }, [authorized]);

    const fetchFreelancers = useCallback(async () => {
        setLoading(true);
        try {
            // 🎯 스킬 배열을 쉼표로 연결하여 API 전달
            const skillParam = filter.skill.join(',');
            const { data } = await api.get<ApiFreelancerDto[]>('/v1/freelancers', { 
                params: { ...filter, skill: skillParam } 
            });
            const mappedData = data.map(mapFreelancerDtoToProfile);
            setFreelancers(mappedData);
        } catch {
            // quiet
        } finally {
            setLoading(false);
        }
    }, [filter]);

    // 🎯 [리뷰 반영] 프리랜서 목록만 필터 변경 시 호출
    useEffect(() => {
        if (authorized) {
            fetchFreelancers();
        }
    }, [authorized, fetchFreelancers]);

    const presetSkills = [
        'Java', 'Spring Boot', 'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 
        'Kotlin', 'Go', 'Vue.js', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 
        'Kubernetes', 'Flutter', 'GraphQL', 'Tailwind CSS', 'Figma'
    ];

    if (!authorized) {
        return <div className="min-h-screen bg-white flex items-center justify-center text-[#FF7D00] font-black tracking-widest animate-pulse font-mono uppercase text-xs">인증 정보를 확인 중입니다...</div>;
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 pb-20 font-sans overflow-x-hidden relative">

            {/* 🔥 커서 글로우 - 통일성을 위해 유지하되 색상을 섞어줌 */}
            <div
                className="pointer-events-none fixed left-0 top-0 z-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-[#FF7D00]/10 to-[#7A4FFF]/10 blur-[120px] will-change-transform"
                style={{ transform: `translate(${cursor.x - 200}px, ${cursor.y - 200}px)` }}
            />

            {/* 🎯 user와 함께 profile 데이터(logoUrl 포함)를 넘겨줍니다. */}
            <GlobalNavbar user={user} profile={profile} />

            {/* HEADER - freelancer/explore와 통일된 프리미엄 스타일 */}
            <header className="relative pt-24 pb-16 px-6 bg-white border-b border-zinc-100 overflow-hidden text-center">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                     style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {/* 데코레이션 아이콘 */}
                <div className="absolute left-[-20px] bottom-4 opacity-5 hidden lg:block text-[#FF7D00]">
                    <Search size={200} strokeWidth={0.5} />
                </div>
                <div className="absolute right-[-40px] top-10 opacity-5 hidden lg:block rotate-12 text-[#7A4FFF]">
                    <SlidersHorizontal size={240} strokeWidth={0.5} />
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex justify-center gap-6 text-[10px] text-zinc-400 mb-6 font-black font-mono tracking-[0.2em] uppercase text-center">
                            <div>ACTIVE_FREELANCERS_11,280</div>
                            <span className="text-zinc-200">|</span>
                            <div>AVAILABLE_NODES_98%</div>
                            <span className="text-zinc-200">|</span>
                            <div>RESPONSE_INDEX_3.5H</div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-zinc-900 leading-tight">
                            나에게 맞는 <span className="text-[#FF7D00]">파트너</span>를 찾으세요.
                        </h1>

                        <div className="flex items-center justify-center gap-2 mb-10">
                            <span className="h-[1px] w-8 bg-zinc-200" />
                            <p className="text-zinc-400 text-[10px] font-mono tracking-[0.2em] uppercase">
                                Expert_Database_Registry_v4.2
                            </p>
                            <span className="h-[1px] w-8 bg-zinc-200" />
                        </div>
                    </motion.div>

                    {/* Simple Search Input - freelancer/explore와 동일 규격 */}
                    <div className="max-w-2xl mx-auto relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#FF7D00] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="찾으시는 파트너의 닉네임이나 키워드를 검색하세요..."
                            className="w-full bg-white border-2 border-zinc-200 rounded-full py-5 pl-16 pr-6 focus:ring-4 focus:ring-orange-500/5 focus:border-[#FF7D00] outline-none transition-all font-bold text-sm shadow-xl shadow-orange-900/5"
                            value={filter.skill.join(', ')}
                            onChange={(e) => {
                                const values = e.target.value.split(',').map(v => v.trim()).filter(v => v !== '');
                                setFilter({ ...filter, skill: values });
                            }}
                        />
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA - Sidebar + List (Alignment with Navbar max-w-7xl) */}
            <main className="max-w-7xl mx-auto px-8 py-12 flex flex-col lg:flex-row gap-10">
                
                {/* 🎯 LEFT SIDEBAR - freelancer/explore 스타일 이식 */}
                <aside className="w-full lg:w-64 shrink-0 space-y-8">
                    {/* 상단 탭: 근무 방식 필터 */}
                    <section>
                        <div className="flex bg-white p-1 rounded-2xl border border-zinc-200 shadow-sm overflow-x-auto no-scrollbar">
                            {[
                                { label: '전체', value: '' },
                                { label: '온라인', value: 'ONLINE' },
                                { label: '오프라인', value: 'OFFLINE' }
                            ].map((tab) => (
                                <button
                                    key={tab.label}
                                    onClick={() => setFilter({ ...filter, workStyle: tab.value })}
                                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all ${
                                        filter.workStyle === tab.value ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-900'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 지역 필터 */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase text-zinc-400 font-mono">
                                <MapPin size={14} /> 활동_지역
                            </h3>
                            {filter.region && (
                                <button onClick={() => setFilter({...filter, region: ''})} className="text-[10px] text-[#FF7D00] font-bold underline underline-offset-4">초기화</button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {['서울', '경기', '인천', '부산', '대구', '원격'].map(loc => (
                                <button
                                    key={loc}
                                    onClick={() => setFilter({ ...filter, region: filter.region === loc ? '' : loc })}
                                    className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                                        filter.region === loc ? 'border-[#FF7D00] text-[#FF7D00] bg-orange-50' : 'bg-white border-zinc-200 text-zinc-500 shadow-sm hover:border-zinc-300'
                                    }`}
                                >
                                    {loc}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 기술 스택 필터 (그리드 형태) */}
                    <section>
                        <h3 className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase mb-4 text-zinc-400 font-mono text-center">
                             전문_기술_스택
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {presetSkills.map(s => {
                                const isSelected = filter.skill.includes(s);
                                return (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            if (isSelected) {
                                                setFilter({ ...filter, skill: filter.skill.filter(item => item !== s) });
                                            } else {
                                                setFilter({ ...filter, skill: [...filter.skill, s] });
                                            }
                                        }}
                                        className={`px-3 py-2.5 rounded-xl text-[10px] font-bold text-left transition-all border ${
                                            isSelected ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' : 'bg-white border-zinc-100 text-zinc-500 hover:border-zinc-300 shadow-sm'
                                        }`}
                                    >
                                        {isSelected ? '● ' : '○ '} {s}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* 초기화 버튼 */}
                    {(filter.skill.length > 0 || filter.region !== '' || filter.workStyle !== '') && (
                        <button
                            onClick={() => setFilter({ skill: [], region: '', sort: 'id', workStyle: '' })}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-100 text-zinc-400 rounded-2xl text-[11px] font-black uppercase font-mono hover:bg-[#FF7D00] hover:text-white transition-all group shadow-sm"
                        >
                            <SlidersHorizontal size={14} className="group-hover:rotate-45 transition-transform" />
                            필터_설정_초기화
                        </button>
                    )}
                </aside>

                {/* 🎯 RIGHT LIST AREA */}
                <section className="flex-1">
                    <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-8">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF7D00] animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#FF7D00] font-mono italic">live database</span>
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-zinc-950 md:text-3xl uppercase font-mono">
                                System_Agents <span className="text-zinc-300 ml-1">/</span> <span className="text-[#FF7D00] ml-1">{freelancers.length}</span>
                            </h2>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-black uppercase font-mono text-zinc-400">
                            SORT:
                            <select 
                                className="bg-transparent text-zinc-900 outline-none cursor-pointer hover:text-[#FF7D00] transition-colors"
                                value={filter.sort}
                                onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
                            >
                                <option value="id">LATEST</option>
                                <option value="rating">RATING</option>
                                <option value="experience">EXPERIENCE</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <div className="w-12 h-12 border-4 border-[#FF7D00]/20 border-t-[#FF7D00] rounded-full animate-spin" />
                            <p className="text-zinc-400 text-xs font-mono font-black animate-pulse uppercase tracking-widest">Searching_Network...</p>
                        </div>
                    ) : freelancers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 text-center">
                            <Search size={48} className="text-zinc-200 mb-6" />
                            <h3 className="text-zinc-300 font-black text-xl font-mono uppercase tracking-[0.2em]">Null: No_Expert_Found</h3>
                            <p className="text-zinc-400 text-xs font-medium mt-2 mb-8">필터 조건을 변경하여 다시 검색해 보세요.</p>
                            <button
                                onClick={() => setFilter({ skill: [], region: '', sort: 'id', workStyle: '' })}
                                className="px-8 py-4 bg-zinc-950 text-white rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase font-mono hover:bg-[#FF7D00] shadow-xl active:scale-95 transition-all"
                            >
                                Reset_System_Filter
                            </button>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
                        >
                            {freelancers.map((freelancer, index) => (
                                <motion.div
                                    key={freelancer.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <FreelancerCard data={freelancer} />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </section>
            </main>
        </div>
    );
}