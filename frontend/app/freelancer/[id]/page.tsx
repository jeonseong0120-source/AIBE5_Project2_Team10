'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, CheckCircle, ChevronLeft, Briefcase, Globe, Clock, Grid3X3, MessageSquarePlus } from 'lucide-react';
import api from '@/app/lib/axios';
import { FreelancerProfile, ApiFreelancerDto, mapFreelancerDtoToProfile } from '@/types/freelancer';

export default function FreelancerDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const mockPortfolios = [
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000",
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000",
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000",
        "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?q=80&w=1000",
        "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1000"
    ];

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const { data } = await api.get<ApiFreelancerDto>(`/v1/freelancers/${id}`);
                setFreelancer(mapFreelancerDtoToProfile(data));
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        if (id) fetchDetail();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-[#FF7D00] animate-pulse">LOADING PROFILE...</div>;
    if (!freelancer) return <div className="min-h-screen flex items-center justify-center font-bold text-zinc-400">요원을 찾을 수 없습니다.</div>;

    return (
        <div className="min-h-screen bg-white text-zinc-900 pb-40">{/* [수정] NAV: 배경 화이트 변경 및 로고 좌측 정렬 */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200 px-10 py-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-8">
                    {/* [로고 좌측 배치] Dev(#FF7D00) / Near(#7A4FFF) */}
                    <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/")}>
                        <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                    </div>

                    {/* 구분선 및 뒤로가기 */}
                    <div className="w-px h-4 bg-zinc-200 hidden md:block" />

                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-900 font-black text-[10px] tracking-widest uppercase transition-all group font-mono"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        BACK_TO_LIST
                    </button>
                </div>

                {/* 우측 여백 또는 추가 버튼용 공간 */}
                <div className="flex items-center gap-4">
        <span className="text-[10px] font-mono text-zinc-300 tracking-widest uppercase hidden sm:block">
            Agent_Profile_Dossier
        </span>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto pt-32 px-4">
                {/* 1. 상단 프로필 영역 (기존 인스타 스타일 레이아웃 유지) */}
                <section className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 mb-16 px-4">
                    <div className="relative shrink-0">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-[#FF7D00] to-[#7A4FFF]">
                            <img
                                src={freelancer.profileImageUrl || 'https://via.placeholder.com/150'}
                                className="w-full h-full rounded-full object-cover border-4 border-white"
                            />
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                            <h1 className="text-2xl font-bold">{freelancer.nickname}</h1>
                            <button className="px-5 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-bold transition">프로필 편집</button>
                            <span className="text-[#7A4FFF] font-black text-[10px] tracking-widest uppercase">Agent Profile</span>
                        </div>

                        <div className="flex justify-center md:justify-start gap-8 mb-6 border-y md:border-none py-4 md:py-0 border-zinc-100 font-mono">
                            <div className="text-center md:text-left"><span className="font-bold">{mockPortfolios.length}</span> <span className="text-zinc-500">게시물</span></div>
                            <div className="text-center md:text-left"><span className="font-bold">{freelancer.completedProjects || 0}</span> <span className="text-zinc-500">프로젝트</span></div>
                            <div className="text-center md:text-left"><span className="font-bold">{freelancer.averageRating.toFixed(1)}</span> <span className="text-zinc-500">평점</span></div>
                        </div>

                        <div className="space-y-1 text-center md:text-left">
                            <p className="font-bold">{freelancer.location} • {freelancer.workStyle || 'HYBRID'}</p>
                            <p className="text-zinc-600 leading-relaxed max-w-xl italic">"{freelancer.introduction}"</p>
                        </div>
                    </div>
                </section>

                {/* 2. 스킬 뱃지 */}
                <div className="flex gap-2 overflow-x-auto pb-8 px-4 no-scrollbar">
                    {freelancer.skills.map(skill => (
                        <div key={skill.id} className="shrink-0 flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-xl hover:scale-105 transition-transform">🚀</div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">{skill.name}</span>
                        </div>
                    ))}
                </div>

                {/* 3. 포트폴리오 그리드 (3열) */}
                <div className="border-t border-zinc-100 pt-2">
                    <div className="flex justify-center gap-12 mb-4">
                        <div className="flex items-center gap-1.5 border-t border-zinc-950 pt-3 -mt-[13px] font-bold text-xs tracking-widest uppercase cursor-pointer text-zinc-900">
                            <Grid3X3 size={14} /> 게시물
                        </div>
                        <div className="flex items-center gap-1.5 pt-3 font-bold text-xs tracking-widest uppercase cursor-pointer text-zinc-400">
                            <Briefcase size={14} /> 프로젝트 정보
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 md:gap-4">
                        {mockPortfolios.map((url, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ opacity: 0.9 }}
                                className="aspect-square bg-zinc-100 relative group cursor-pointer overflow-hidden rounded-md"
                            >
                                <img src={url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-4">
                                    <div className="flex items-center gap-1 font-bold text-sm"><Star size={16} fill="white"/> 4.8</div>
                                    <div className="flex items-center gap-1 font-bold text-sm"><MessageSquarePlus size={16} fill="white"/> 12</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            {/* 하단 플로팅 바 (기존 스타일 유지하되 폰트 등 정제) */}
            <AnimatePresence>
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-[60]"
                >
                    <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-5 flex items-center justify-between shadow-2xl">
                        <div className="pl-6 border-l-4 border-[#FF7D00]">
                            <div className="text-[10px] font-black text-zinc-500 tracking-widest uppercase mb-1">Estimated Rate</div>
                            <div className="text-white font-black text-2xl tracking-tighter">
                                ₩{(freelancer.hourlyRate || 0).toLocaleString()} <span className="text-[#7A4FFF] text-xs font-mono">/HR</span>
                            </div>
                        </div>
                        <button
                            onClick={() => alert("제안 준비 중")}
                            className="bg-white text-zinc-900 px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-[#7A4FFF] hover:text-white transition-all active:scale-95"
                        >
                            프로젝트 제안하기
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}