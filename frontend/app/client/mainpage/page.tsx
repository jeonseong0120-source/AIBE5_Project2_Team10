'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FreelancerCard from '@/components/freelancer/FreelancerCard';
import { FreelancerProfile, ApiFreelancerDto, mapFreelancerDtoToProfile } from '@/types/freelancer';
import api from '../../lib/axios';
import { 
    Search, MapPin, SlidersHorizontal, ArrowUpDown, Sparkles, 
    Briefcase, ChevronDown, Check, Clock, Star, MessageSquare, 
    TrendingUp, CircleDollarSign, Filter, ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        sortOrder: 'desc' as 'asc' | 'desc',
        workStyle: '',
        minRate: undefined as number | undefined,
        maxRate: undefined as number | undefined
    });
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // 🎯 GlobalNavbar 정보
    const [user, setUser] = useState<UserData | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
    const [cursor, setCursor] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
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

                const navbarRole: UserData['role'] = normalizedRoles.includes('BOTH') ? 'BOTH' : 'CLIENT';
                const profileImg = (typeof raw.profileImage === 'string' ? raw.profileImage : undefined)
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
            api.get('/client/profile').then(res => setProfile(res.data as ProfileData)).catch(() => {});
            api.get('/v1/bookmarks/freelancers?size=1000').then(res => {
                const list = res.data.content || [];
                const ids = new Set<number>(list.map((b: any) => Number(b.profileId)));
                setBookmarkedIds(ids);
            }).catch(err => console.error("Failed to fetch bookmarks:", err));
        }
    }, [authorized]);

    const fetchFreelancers = useCallback(async (searchKeyword: string) => {
        setLoading(true);
        try {
            const searchParams = new URLSearchParams();
            if (filter.region) searchParams.append('region', filter.region);
            
            if (filter.sort) {
                searchParams.append('sort', `${filter.sort},${filter.sortOrder}`);
            }
            
            if (filter.workStyle) searchParams.append('workStyle', filter.workStyle);
            if (filter.minRate !== undefined) searchParams.append('minHourlyRate', filter.minRate.toString());
            if (filter.maxRate !== undefined) searchParams.append('maxHourlyRate', filter.maxRate.toString());
            filter.skill.forEach(s => searchParams.append('skill', s));
            if (searchKeyword) searchParams.append('keyword', searchKeyword);

            const { data } = await api.get<ApiFreelancerDto[]>('/v1/freelancers', { params: searchParams });
            const mappedData = data.map(mapFreelancerDtoToProfile);
            setFreelancers(mappedData);
        } catch (err) {
            console.error("프리랜서 목록 로드 실패:", err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        if (authorized) {
            const timer = setTimeout(() => {
                fetchFreelancers(keyword);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [authorized, fetchFreelancers, keyword]);

    // 🎯 [개선] 텍스트 심플하게 변경
    const sortOptions = [
        { id: 'id', label: '등록순' },
        { id: 'grade.id', label: '등급순' },
        { id: 'rating', label: '평점순' },
        { id: 'hourlyRate', label: '시급순' },
    ];

    const handleSortClick = (id: string) => {
        if (filter.sort === id) {
            setFilter({ ...filter, sortOrder: filter.sortOrder === 'desc' ? 'asc' : 'desc' });
        } else {
            setFilter({ ...filter, sort: id, sortOrder: 'desc' });
        }
    };

    if (!authorized) return <div className="min-h-screen bg-white flex items-center justify-center text-[#FF7D00] font-black tracking-widest animate-pulse font-mono uppercase text-xs">인증 정보를 확인 중입니다...</div>;

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 pb-20 font-sans overflow-x-hidden relative">
            <div
                className="pointer-events-none fixed left-0 top-0 z-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-[#FF7D00]/10 to-[#7A4FFF]/10 blur-[120px] will-change-transform"
                style={{ transform: `translate(${cursor.x - 200}px, ${cursor.y - 200}px)` }}
            />
            <GlobalNavbar user={user} profile={profile} />

            <header className="relative pt-24 pb-12 px-6 bg-white border-b border-zinc-100 overflow-hidden text-center">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-10 text-zinc-900 leading-tight break-keep">
                            최적의 <span className="text-[#FF7D00]">파트너</span>를 찾으세요.
                        </h1>
                    </motion.div>
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

            <main className="max-w-7xl mx-auto px-8 py-10 flex flex-col lg:flex-row gap-12 items-start">
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
                    onReset={() => { setFilter({ skill: [], region: '', workStyle: '', sort: 'id', sortOrder: 'desc', minRate: undefined, maxRate: undefined }); setKeyword(''); }} 
                />

                <section className="flex-1 w-full mt-0">
                    <div className="mb-8 px-6 h-[62px] bg-white/70 backdrop-blur-md rounded-full border border-zinc-100 shadow-sm flex items-center justify-between gap-4 p-1.5 relative z-20">
                        <div className="flex items-center gap-2.5 pl-1">
                            <div className="h-5 w-1.5 rounded-full bg-[#FF7D00]" />
                            <h2 className="text-xl font-black tracking-tight text-zinc-950">
                                프리랜서 포트폴리오
                            </h2>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/50 p-1 rounded-full border border-zinc-50">
                            {sortOptions.map((opt) => {
                                const isActive = filter.sort === opt.id;
                                // 🎯 [개선] 최신순/오래된순 외에는 텍스트 고정
                                const label = opt.label;
                                
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleSortClick(opt.id)}
                                        className={`px-5 py-2.5 rounded-full text-[11px] font-bold transition-all tracking-wider flex items-center gap-2 ${
                                            isActive 
                                                ? 'bg-[#FF7D00] text-white shadow-lg shadow-orange-500/20 scale-[1.02]' 
                                                : 'text-zinc-400 hover:text-zinc-600 hover:bg-white'
                                        }`}
                                    >
                                        {label}
                                        {isActive && (
                                            <motion.div
                                                initial={{ rotate: filter.sortOrder === 'desc' ? 0 : 180 }}
                                                animate={{ rotate: filter.sortOrder === 'desc' ? 0 : 180 }}
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

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <div className="w-12 h-12 border-4 border-[#FF7D00]/20 border-t-[#FF7D00] rounded-full animate-spin" />
                            <p className="text-zinc-400 text-xs font-mono font-black animate-pulse uppercase tracking-widest">Searching_Network...</p>
                        </div>
                    ) : freelancers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 text-center">
                            <Search size={48} className="text-zinc-200 mb-6" />
                            <h3 className="text-zinc-300 font-black text-xl font-mono uppercase tracking-[0.2em]">Null: No_Expert_Found</h3>
                            <button
                                onClick={() => setFilter({ skill: [], region: '', sort: 'id', sortOrder: 'desc', workStyle: '', minRate: undefined, maxRate: undefined })}
                                className="px-8 py-4 bg-[#FF7D00] text-white rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase font-mono hover:bg-zinc-950 shadow-xl active:scale-95 transition-all"
                            >
                                Reset_System_Filter
                            </button>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {freelancers.map((freelancer, index) => (
                                <motion.div key={freelancer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="h-full">
                                    <FreelancerCard data={freelancer} initialIsBookmarked={bookmarkedIds.has(Number(freelancer.id))} />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </section>
            </main>
        </div>
    );
}