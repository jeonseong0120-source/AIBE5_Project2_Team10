'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FreelancerCard from '@/components/freelancer/FreelancerCard';
import { FreelancerProfile, ApiFreelancerDto, mapFreelancerDtoToProfile } from '@/types/freelancer';
import api from '../lib/axios';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ClientDashboard() {
    const router = useRouter();
    const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
    const [filter, setFilter] = useState({ skill: '', region: '', sort: 'id' });
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // 🔥 커서 글로우 (마스터의 기존 로직 보존)
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
                const role = res.data.role;

                if (role === "GUEST" || role === "ROLE_GUEST") {
                    router.replace("/onboarding");
                    return;
                }

                if (role === "FREELANCER" || role === "ROLE_FREELANCER") {
                    alert("해당 대시보드는 클라이언트 전용 화면입니다.");
                    router.replace("/");
                    return;
                }

                setAuthorized(true);
            } catch (err) {
                router.replace("/login");
            }
        };

        checkAccess();
    }, [router]);

    const fetchFreelancers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get<ApiFreelancerDto[]>('/v1/freelancers', { params: filter });
            const mappedData = data.map(mapFreelancerDtoToProfile);
            setFreelancers(mappedData);
        } catch (err) {
            console.error("인재를 불러오지 못했습니다!", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authorized) {
            fetchFreelancers();
        }
    }, [filter, authorized]);

    const presetSkills = ['Java', 'React', 'Spring Boot', 'Figma', 'Node.js', 'Python', 'AWS'];

    if (!authorized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-[#FF7D00] font-black text-xl animate-pulse">
                AUTHORIZING ACCESS...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 relative overflow-hidden">

            {/* 🔥 커서 글로우 */}
            <div
                className="pointer-events-none fixed z-0 w-[300px] h-[300px] rounded-full bg-[#FF7D00]/20 blur-[120px] transition-all duration-200"
                style={{
                    left: cursor.x - 150,
                    top: cursor.y - 150
                }}
            />
            {/* [수정] NAV: 배경 화이트 원복 및 로고 컬러 유지 */}
            <nav className="w-full py-5 px-10 bg-white/80 backdrop-blur-xl border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                {/* [로고] Dev(#FF7D00) / Near(#7A4FFF) - 화이트 배경에서 가독성 최상 */}
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/")}>
                    <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                </div>

                <div className="flex gap-6 items-center">
                    <button
                        onClick={() => router.push('/profile')}
                        className="text-xs font-bold text-zinc-500 hover:text-zinc-900 tracking-widest transition uppercase font-mono"
                    >
                        MY_PROFILE
                    </button>

                    <button className="px-6 py-2.5 bg-[#FF7D00] text-white rounded-xl text-xs font-black tracking-widest hover:brightness-110 transition shadow-md shadow-orange-100 uppercase">
                        Register_Project
                    </button>
                </div>
            </nav>

            {/* HEADER (기존 로직 및 스타일 유지) */}
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
                    <div className="flex justify-center gap-6 text-xs text-zinc-500 mb-4 font-bold">
                        <div>🔥 매칭률 92%</div>
                        <div>📍 서울 프리랜서 1,284명</div>
                        <div>⚡ 평균 응답 3.2h</div>
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
                        DevNear는 개발자와 클라이언트를 가장 효율적으로 연결합니다.
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

                        <button className="bg-[#FF7D00] text-white px-8 py-3 rounded-xl font-bold hover:brightness-110 transition shadow-lg shadow-orange-100">
                            탐색
                        </button>
                    </div>

                    {/* TAGS */}
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {presetSkills.map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter({ ...filter, skill: filter.skill === s ? '' : s })}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold border transition ${
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

            {/* LIST (기존 리스트 보존) */}
            <main className="max-w-7xl mx-auto px-8 py-16">
                <div className="flex justify-between items-center mb-10 border-b border-zinc-100 pb-6">
                    <h2 className="text-2xl font-black tracking-tight text-zinc-950 uppercase">
                        전문가 검색 결과 <span className="text-[#7A4FFF] ml-1">[{freelancers.length}]</span>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {freelancers.map((item) => (
                            <div key={item.id} className="transition-transform duration-300 hover:scale-[1.02]">
                                <FreelancerCard data={item} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-[2rem] border-2 border-dashed border-zinc-100">
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