'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FreelancerCard from '@/components/freelancer/FreelancerCard';
import { FreelancerProfile, ApiFreelancerDto, mapFreelancerDtoToProfile } from '@/types/freelancer';
import api from '../../lib/axios';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

// 🎯 1. 대통합 네비게이션 바 불러오기
import GlobalNavbar, { type UserData, type ProfileData } from '@/components/common/GlobalNavbar';

export default function ClientDashboard() {
    const router = useRouter();
    const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
    const [filter, setFilter] = useState({ skill: '', region: '', sort: 'id' });
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
                const raw = res.data as Record<string, unknown>;
                const normalizedRole = String(raw.role ?? '').replace("ROLE_", "");

                if (normalizedRole === "GUEST") {
                    router.replace("/onboarding");
                    return;
                }

                if (normalizedRole === "FREELANCER") {
                    alert("해당 대시보드는 클라이언트 전용 화면입니다.");
                    router.replace("/");
                    return;
                }

                const navbarRole: UserData['role'] =
                    normalizedRole === 'BOTH' ? 'BOTH' : 'CLIENT';

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

    // 🎯 [리뷰 반영] 프로필 호출을 필터 의존성에서 분리하여 세션 스코프로 한 번만 실행
    useEffect(() => {
        if (authorized) {
            api.get('/client/profile')
                .then(res => setProfile(res.data as ProfileData))
                .catch(() => {});
        }
    }, [authorized]);

    const fetchFreelancers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get<ApiFreelancerDto[]>('/v1/freelancers', { params: filter });
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

    const presetSkills = ['Java', 'React', 'Spring Boot', 'Figma', 'Node.js', 'Python', 'AWS'];

    if (!authorized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-[#FF7D00] font-black text-xl animate-pulse">
                AUTHORIZING ACCESS...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 relative overflow-hidden font-sans">

            {/* 🔥 커서 글로우 */}
            <div
                className="pointer-events-none fixed left-0 top-0 z-0 h-[300px] w-[300px] rounded-full bg-[#FF7D00]/20 blur-[120px] will-change-transform"
                style={{ transform: `translate(${cursor.x - 150}px, ${cursor.y - 150}px)` }}
            />

            {/* 🎯 user와 함께 profile 데이터(logoUrl 포함)를 넘겨줍니다. */}
            <GlobalNavbar user={user} profile={profile} />

            {/* HEADER */}
            <section className="relative pt-24 pb-16 px-8 bg-white border-b border-zinc-200 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <svg className="absolute w-full h-full opacity-[0.06]" viewBox="0 0 1000 300">
                        <polyline
                            fill="none"
                            stroke="#FF7D00"
                            strokeWidth="2"
                            points="0,200 150,120 300,160 450,80 600,140 750,60 900,100 1000,70"
                        />
                    </svg>
                </div>

                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <div className="flex justify-center gap-6 text-xs text-zinc-500 mb-4 font-bold font-mono">
                        <div>🔥 MATCH RATE: 92%</div>
                        <div>📍 SEOUL AGENTS: 1,284</div>
                        <div>⚡ AVG RESPONSE: 3.2H</div>
                    </div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-5xl font-black tracking-tight mb-4"
                    >
                        완벽한 파트너를 <br />
                        <span className="text-[#FF7D00]">데이터 기반</span>으로 찾으세요
                    </motion.h1>

                    <p className="text-zinc-500 mb-10 font-medium">
                        DevNear는 개발자와 클라이언트를 가장 타당하게 연결합니다.
                    </p>

                    {/* SEARCH */}
                    <div className="bg-white p-2 rounded-2xl shadow-xl border border-zinc-100 flex flex-col md:flex-row gap-2">
                        <div className="flex-1 flex items-center px-5 py-3 bg-zinc-50 rounded-xl border border-zinc-100 focus-within:border-[#FF7D00] transition">
                            <Search className="w-5 h-5 text-zinc-400 mr-2" />
                            <input
                                className="w-full bg-transparent outline-none text-sm font-medium"
                                placeholder="기술 스택 (React, Spring...)"
                                value={filter.skill}
                                onChange={(e) => setFilter({ ...filter, skill: e.target.value })}
                            />
                        </div>

                        <div className="flex-1 flex items-center px-5 py-3 bg-zinc-50 rounded-xl border border-zinc-100 focus-within:border-[#FF7D00] transition">
                            <MapPin className="w-5 h-5 text-zinc-400 mr-2" />
                            <input
                                className="w-full bg-transparent outline-none text-sm font-medium"
                                placeholder="지역 (서울, 부산...)"
                                value={filter.region}
                                onChange={(e) => setFilter({ ...filter, region: e.target.value })}
                            />
                        </div>

                        <button className="bg-[#FF7D00] text-white px-8 py-3 rounded-xl font-bold hover:brightness-110 transition shadow-lg shadow-orange-100 font-mono tracking-widest">
                            SEARCH
                        </button>
                    </div>

                    {/* TAGS */}
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {presetSkills.map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter({ ...filter, skill: filter.skill === s ? '' : s })}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition font-mono ${
                                    filter.skill === s
                                        ? 'bg-[#FF7D00] text-white border-[#FF7D00] shadow-md'
                                        : 'bg-white text-zinc-500 border-zinc-200 hover:border-[#FF7D00]'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* LIST */}
            <main className="max-w-7xl mx-auto px-8 py-16">
                <div className="flex justify-between items-center mb-10 border-b border-zinc-100 pb-6">
                    <h2 className="text-xl font-black tracking-tight text-zinc-950 uppercase font-mono">
                        System_Agents <span className="text-[#7A4FFF] ml-1">[{freelancers.length}]</span>
                    </h2>

                    <div className="flex items-center gap-2 text-sm text-zinc-500 font-bold bg-white px-4 py-2 rounded-lg border border-zinc-200">
                        <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
                        <select
                            className="bg-transparent outline-none cursor-pointer font-mono tracking-widest text-[10px] uppercase font-black"
                            value={filter.sort}
                            onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
                        >
                            <option value="id">LATEST</option>
                            <option value="rating">RATING</option>
                            <option value="projects">PROJECTS</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center py-32">
                        <div className="w-12 h-12 border-4 border-[#7A4FFF] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-zinc-400 font-black font-mono text-xs tracking-widest uppercase">Fetching_Experts...</p>
                    </div>
                ) : freelancers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {freelancers.map((item, idx) => (
                            <div key={item.id || idx}>
                                <FreelancerCard data={item} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-[2rem] border-2 border-dashed border-zinc-200">
                        <Search className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                        <h3 className="text-zinc-400 font-bold text-lg italic uppercase font-mono tracking-tighter">Null: No_Expert_Found</h3>
                        <button
                            onClick={() => setFilter({ skill: '', region: '', sort: 'id' })}
                            className="mt-4 text-[#FF7D00] font-black underline decoration-2 underline-offset-4 uppercase text-xs tracking-widest font-mono"
                        >
                            Reset_System_Filter
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}