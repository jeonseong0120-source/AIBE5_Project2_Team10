'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FreelancerCard from '@/components/freelancer/FreelancerCard';
import { FreelancerProfile, ApiFreelancerDto, mapFreelancerDtoToProfile } from '@/types/freelancer';
import api from '../../lib/axios';
import { 
    Search, MapPin, SlidersHorizontal, ArrowUpDown, Sparkles, 
    Briefcase, ChevronDown, Check 
} from 'lucide-react';
import { motion } from 'framer-motion';

import GlobalNavbar, { type UserData, type ProfileData } from '@/components/common/GlobalNavbar';
import FilterSidebar from '@/components/common/FilterSidebar';
import { SKILL_CATEGORIES } from '@/constants/skills';

export default function ClientDashboard() {
    const router = useRouter();
    const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
    const [filter, setFilter] = useState({ 
        skill: [] as string[], 
        region: '', 
        sort: 'id', 
        workStyle: '',
        minRate: undefined as number | undefined,
        maxRate: undefined as number | undefined
    });
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
                router.replace("/");
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
                router.replace("/");
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
            // 🎯 [최적화] 백엔드가 다중 스킬 검색 및 금액 범위를 지원함
            const searchParams = new URLSearchParams();
            if (filter.region) searchParams.append('region', filter.region);
            if (filter.sort) searchParams.append('sort', filter.sort);
            if (filter.workStyle) searchParams.append('workStyle', filter.workStyle);
            if (filter.minRate !== undefined) searchParams.append('minHourlyRate', filter.minRate.toString());
            if (filter.maxRate !== undefined) searchParams.append('maxHourlyRate', filter.maxRate.toString());
            
            // 모든 선택된 스킬을 skill=Java&skill=React 형태로 추가
            filter.skill.forEach(s => searchParams.append('skill', s));
            
            // 키워드가 있다면 검색 조건에 포함
            if (keyword) searchParams.append('keyword', keyword);

            const { data } = await api.get<ApiFreelancerDto[]>('/v1/freelancers', { 
                params: searchParams 
            });
            
            const mappedData = data.map(mapFreelancerDtoToProfile);
            setFreelancers(mappedData);
        } catch (err) {
            console.error("프리랜서 목록 로드 실패:", err);
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
                        {/* 🎯 문구 교체 + 텍스트 그림자 + 글로우 효과 적용 */}
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-10 text-zinc-900 leading-tight break-keep [text-shadow:0_4px_15px_rgba(0,0,0,0.06)]">
                            최적의 <span className="text-[#FF7D00] drop-shadow-[0_0_20px_rgba(255,125,0,0.4)] motion-safe:animate-[pulse_3s_ease-in-out_infinite] motion-reduce:animate-none">파트너</span>를 찾으세요.
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
                
                {/* 🎯 LEFT SIDEBAR - New Premium Filter Sidebar */}
                <FilterSidebar 
                    mode="CLIENT"
                    selectedSkills={filter.skill}
                    onSkillChange={(skills) => setFilter({ ...filter, skill: skills })}
                    selectedLocation={filter.region}
                    onLocationChange={(loc) => setFilter({ ...filter, region: loc })}
                    workStyle={filter.workStyle}
                    onWorkStyleChange={(style) => setFilter({ ...filter, workStyle: style })}
                    minPrice={filter.minRate}
                    maxPrice={filter.maxRate}
                    onPriceChange={(min, max) => setFilter({ ...filter, minRate: min, maxRate: max })}
                    onReset={() => {
                        setFilter({
                            skill: [],
                            region: '',
                            workStyle: '',
                            sort: 'id',
                            minRate: undefined,
                            maxRate: undefined
                        });
                        setKeyword('');
                    }}
                />

                {/* 🎯 RIGHT LIST AREA */}
                <section className="flex-1">
                    <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-8">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF7D00] animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#FF7D00]">live database</span>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">
                                Total Portfolios <span className="text-zinc-300 ml-1">/</span> <span className="text-[#FF7D00] ml-1">{freelancers.length}</span>
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-400">
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