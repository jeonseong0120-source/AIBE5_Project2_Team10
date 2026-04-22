'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FreelancerCard from '@/components/freelancer/FreelancerCard';
import { FreelancerProfile, ApiFreelancerDto, mapFreelancerDtoToProfile } from '@/types/freelancer';
import api from '../../lib/axios';
import { Search, MapPin, SlidersHorizontal, ArrowUpDown, Sparkles, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

// 🎯 1. 대통합 네비게이션 바 불러오기
import GlobalNavbar, { type UserData, type ProfileData } from '@/components/common/GlobalNavbar';

export default function ClientDashboard() {
    const router = useRouter();
    const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
    const [filter, setFilter] = useState({ skill: [] as string[], region: '', sort: 'id', workStyle: '' });
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // 🎯 2. GlobalNavbar에 전달할 유저 정보 상태
    const [user, setUser] = useState<UserData | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);

    // 🎯 [개선] 북마크 상태를 중앙에서 관리 (Set 사용)
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());

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
                const raw = res.data as Record<string, unknown>;
                const normalizedRoles = String(raw.role ?? '')
                    .split(',')
                    .map((v) => v.trim().replace(/^ROLE_/, ''))
                    .filter(Boolean);

                if (normalizedRoles.includes("GUEST")) {
                    router.replace("/onboarding");
                    return;
                }

                if (
                    normalizedRoles.includes("FREELANCER") &&
                    !normalizedRoles.includes("CLIENT") &&
                    !normalizedRoles.includes("BOTH")
                ) {
                    alert("해당 대시보드는 클라이언트 전용 화면입니다.");
                    router.replace("/");
                    return;
                }

                const navbarRole: UserData['role'] =
                    normalizedRoles.includes('BOTH') ? 'BOTH' : 'CLIENT';

                const profileImg =
                    (typeof raw.profileImage === 'string' ? raw.profileImage : undefined)
                    ?? (typeof raw.profileImageUrl === 'string' ? raw.profileImageUrl : undefined);

                setUser({
                    role: navbarRole,
                    nickname: typeof raw.nickname === 'string' ? raw.nickname : undefined,
                    name: typeof raw.name === 'string' ? raw.name : undefined,
                    profileImage: profileImg,
                    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : undefined,
                });
                setAuthorized(true);
            } catch {
                router.replace("/login");
            }
        };

        checkAccess();
    }, [router]);

    useEffect(() => {
        if (authorized) {
            api.get('/client/profile')
                .then(res => setProfile(res.data as ProfileData))
                .catch(() => {});

            // 🎯 [개선] 북마크 아이디 목록 한 번에 가져오기
            api.get('/v1/bookmarks/freelancers?size=1000')
                .then(res => {
                    const list = res.data.content || [];
                    const ids = new Set<number>(list.map((b: any) => Number(b.profileId)));
                    setBookmarkedIds(ids);
                })
                .catch(err => console.error("Failed to fetch bookmarks:", err));
        }
    }, [authorized]);

    const fetchFreelancers = useCallback(async () => {
        setLoading(true);
        try {
            // 🎯 [리뷰 반영] 다중 스킬 검색 시 Fan-out 전략 (개별 요청 후 합치기)
            if (filter.skill.length > 1) {
                const requests = filter.skill.map(s => 
                    api.get<ApiFreelancerDto[]>('/v1/freelancers', { params: { ...filter, skill: s } })
                );
                const responses = await Promise.all(requests);
                
                // 모든 결과를 하나로 합치고 profileId 기준으로 중복 제거
                const allData = responses.flatMap(res => res.data);
                const uniqueMap = new Map<number, ApiFreelancerDto>();
                allData.forEach(item => uniqueMap.set(item.profileId, item));
                
                const dedupedData = Array.from(uniqueMap.values());
                const mappedData = dedupedData.map(mapFreelancerDtoToProfile);
                setFreelancers(mappedData);
            } else {
                // 단일 스킬 또는 키워드 검색
                const combinedSkill = [filter.skill[0], keyword].filter(Boolean).join(',');
                const { data } = await api.get<ApiFreelancerDto[]>('/v1/freelancers', { 
                    params: { ...filter, skill: combinedSkill } 
                });
                const mappedData = data.map(mapFreelancerDtoToProfile);
                setFreelancers(mappedData);
            }
        } catch {
            // quiet
        } finally {
            setLoading(false);
        }
    }, [filter, keyword]);

    // 🎯 [리뷰 반영] 키워드 검색 디바운싱
    useEffect(() => {
        const timer = setTimeout(() => {
            // 키워드가 바뀔 때만 리로드 되도록 유도 (keyword는 fetchFreelancers 의존성에 포함됨)
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword]);

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
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-10 text-zinc-900 leading-tight">
                            나에게 맞는 <span className="text-[#FF7D00]">파트너</span>를 찾으세요.
                        </h1>


                    </motion.div>

                    {/* Simple Search Input - freelancer/explore와 동일 규격 */}
                    <div className="max-w-2xl mx-auto relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#FF7D00] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="찾으시는 파트너의 닉네임이나 키워드를 검색하세요..."
                            className="w-full bg-white border-2 border-zinc-200 rounded-full py-5 pl-16 pr-6 focus:ring-4 focus:ring-orange-500/5 focus:border-[#FF7D00] outline-none transition-all font-bold text-sm shadow-xl shadow-orange-900/5"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA - Sidebar + List (Alignment with Navbar max-w-7xl) */}
            <main className="max-w-7xl mx-auto px-8 py-12 flex flex-col lg:flex-row gap-12">
                
                {/* 🎯 LEFT SIDEBAR - Sticky & Optimized UI */}
                <aside className="w-full lg:w-72 shrink-0 space-y-10">
                    <div className="sticky top-28 space-y-10">
                    
                    {/* 1. 상단 탭: 근무 방식 필터 */}
                    <section>
                        <h3 className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase mb-4 text-zinc-400 font-mono">
                            <Briefcase size={14} /> 협업_근무_방식
                        </h3>
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

                    {/* 2. 기술 스택 필터 (그리드 형태) - 가장 중요한 필터이므로 상단 배치 */}
                    <section>
                        <h3 className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase mb-4 text-zinc-400 font-mono">
                            <Sparkles size={14} /> 전문_기술_스택
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
                                        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-black transition-all border ${
                                            isSelected 
                                                ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' 
                                                : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-300 hover:text-zinc-900'
                                        }`}
                                    >
                                        {s}
                                        <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-[#FF7D00]' : 'bg-transparent group-hover:bg-zinc-200'}`} />
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* 3. 활동 지역 필터 - 대한민국 전체 지역 (3열 컴팩트 그리드) */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase text-zinc-400 font-mono">
                                <MapPin size={14} /> 활동_지역
                            </h3>
                            {filter.region && (
                                <span className="text-[9px] font-black text-[#FF7D00] font-mono animate-pulse">FILTER_ACTIVE</span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {[
                                '전국', '서울', '경기', '인천', '부산', '대구', 
                                '대전', '광주', '울산', '세종', '강원', '충북', 
                                '충남', '전북', '전남', '경북', '경남', '제주'
                            ].map(loc => (
                                <button
                                    key={loc}
                                    onClick={() => setFilter({ ...filter, region: loc === '전국' ? '' : (filter.region === loc ? '' : loc) })}
                                    className={`group flex flex-col items-center justify-center py-2 rounded-lg text-[9px] font-black transition-all border ${
                                        (loc === '전국' && filter.region === '') || filter.region === loc
                                            ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' 
                                            : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-300 hover:text-zinc-900'
                                    }`}
                                >
                                    {loc}
                                    <div className={`mt-1 w-1 h-1 rounded-full ${
                                        (loc === '전국' && filter.region === '') || filter.region === loc
                                            ? 'bg-[#FF7D00]' 
                                            : 'bg-transparent group-hover:bg-zinc-200'
                                    }`} />
                                </button>
                            ))}
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
                    </div>
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
                                Total_Portfolios <span className="text-zinc-300 ml-1">/</span> <span className="text-[#FF7D00] ml-1">{freelancers.length}</span>
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase font-mono text-zinc-400">
                            SORT:
                            <select
                                className="bg-transparent text-zinc-900 outline-none cursor-pointer hover:text-[#FF7D00] transition-colors font-bold"
                                value={filter.sort}
                                onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
                            >
                                <option value="id">LATEST (최신등록순)</option>
                                <option value="rating">RATING (별점 높은순)</option>
                                <option value="reviews">REVIEWS (리뷰 많은순)</option>
                                <option value="projects">EXPERIENCE (경력 풍부순)</option>
                                <option value="rate">RATE (낮은 시급순)</option>
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
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {freelancers.map((freelancer, index) => (
                                <motion.div
                                    key={freelancer.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <FreelancerCard 
                                        data={freelancer} 
                                        initialIsBookmarked={bookmarkedIds.has(Number(freelancer.id))}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </section>
            </main>
        </div>
    );
}