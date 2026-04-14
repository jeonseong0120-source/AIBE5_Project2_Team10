'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, CheckCircle, ChevronLeft, Briefcase, Globe, Clock, Grid3X3 } from 'lucide-react';
import api from '@/app/lib/axios';
import { FreelancerProfile, ApiFreelancerDto, mapFreelancerDtoToProfile } from '@/types/freelancer';

export default function FreelancerDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const { data } = await api.get<ApiFreelancerDto>(`/v1/freelancers/${id}`);
                setFreelancer(mapFreelancerDtoToProfile(data));
            } catch (err) {
                // 불필요한 console.log 제거
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-black text-dn-orange text-xl animate-pulse font-mono tracking-widest uppercase">
                SCANNING AGENT DOSSIER...
            </div>
        );
    }

    if (!freelancer) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center text-center">
                <h3 className="text-zinc-400 font-bold text-lg italic uppercase font-mono tracking-tighter">Null: No_Expert_Found</h3>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="mt-4 text-[#FF7D00] font-black underline decoration-2 underline-offset-4 uppercase text-xs tracking-widest font-mono"
                >
                    Return_To_Base
                </button>
            </div>
        );
    }

    // 임시로 현재 유저 ID를 비교하는 로직 (추후 백엔드에서 받아온 내 ID와 비교)
    const isOwner = false; 

    // 안전하게 portfolios 배열 확인 (에러 방지)
    const portfolios = (freelancer as any).portfolios || [];

    return (
        <div className="min-h-screen bg-white text-zinc-900 pb-40 font-sans">
            {/* 상단 네비바 */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200 px-10 py-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-8">
                    <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/")}>
                        <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                    </div>

                    <div className="w-px h-4 bg-zinc-200 hidden md:block" />

                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-900 font-black text-[10px] tracking-widest uppercase transition-all group font-mono"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        BACK_TO_LIST
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-zinc-300 tracking-widest uppercase hidden sm:block">
                        Agent_Profile_Dossier
                    </span>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto pt-32 px-4">
                {/* 1. 상단 프로필 영역 */}
                <section className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 mb-16 px-4">
                    <div className="relative shrink-0">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-[#FF7D00] to-[#7A4FFF]">
                            <img
                                src={freelancer.profileImageUrl || 'https://via.placeholder.com/150'}
                                alt={freelancer.nickname}
                                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150'; }}
                                className="w-full h-full rounded-full object-cover border-4 border-white"
                            />
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                            <h1 className="text-3xl font-black">{freelancer.nickname}</h1>
                            {/* [수정] 조건부 렌더링 (isOwner) */}
                            {isOwner && (
                                <button className="px-5 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-bold transition font-mono tracking-tighter">
                                    Edit_Profile
                                </button>
                            )}
                            <span className="text-[#7A4FFF] font-black text-[10px] tracking-widest uppercase font-mono">Agent Profile</span>
                        </div>

                        <div className="flex justify-center md:justify-start gap-8 mb-6 border-y md:border-none py-4 md:py-0 border-zinc-100 font-mono">
                            <div className="text-center md:text-left"><span className="font-bold">{portfolios.length}</span> <span className="text-zinc-500">게시물</span></div>
                            <div className="text-center md:text-left"><span className="font-bold">{freelancer.completedProjects || 0}</span> <span className="text-zinc-500">프로젝트</span></div>
                            <div className="text-center md:text-left"><span className="font-bold text-[#FF7D00]">{freelancer.averageRating.toFixed(1)}</span> <span className="text-zinc-500">평점</span></div>
                        </div>

                        <div className="space-y-1 text-center md:text-left">
                            <p className="font-bold font-mono tracking-tight text-sm text-[#7A4FFF]">
                                {freelancer.location} • {freelancer.workStyle || 'HYBRID'}
                            </p>
                            <p className="text-zinc-600 leading-relaxed max-w-xl italic mt-2">"{freelancer.introduction}"</p>
                        </div>
                    </div>
                </section>

                {/* 2. 스킬 뱃지 */}
                <div className="flex gap-2 overflow-x-auto pb-8 px-4 no-scrollbar">
                    {freelancer.skills.map(skill => (
                        <div key={skill.id} className="shrink-0 flex flex-col items-center gap-2 group">
                            <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-xl group-hover:scale-105 group-hover:border-[#FF7D00] transition-transform shadow-sm">
                                🚀
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase font-mono tracking-tighter">{skill.name}</span>
                        </div>
                    ))}
                </div>

                {/* 3. 포트폴리오 섹션 */}
                <div className="border-t border-zinc-200 pt-8 px-4">
                    <div className="flex justify-center gap-12 mb-8">
                        <div className="flex items-center gap-1.5 border-t-2 border-zinc-950 pt-3 -mt-[34px] font-bold text-xs tracking-widest uppercase cursor-pointer text-zinc-900 font-mono">
                            <Grid3X3 size={14} /> PORTFOLIOS
                        </div>
                        <div className="flex items-center gap-1.5 pt-3 -mt-[34px] font-bold text-xs tracking-widest uppercase cursor-pointer text-zinc-400 hover:text-zinc-600 transition font-mono">
                            <Briefcase size={14} /> PROJECTS
                        </div>
                    </div>

                    {/* [수정] 포트폴리오 데이터 유무에 따른 조건부 렌더링 (Tech-Blueprint Empty State 적용) */}
                    {(!portfolios || portfolios.length === 0) ? (
                        <div className="w-full py-20 rounded-[2rem] border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center text-center shadow-inner">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-zinc-200 flex items-center justify-center mb-6">
                                <Briefcase className="text-zinc-300" size={28} />
                            </div>
                            <p className="font-mono text-[#7A4FFF] font-black text-sm tracking-widest uppercase">
                                &gt; NO_PORTFOLIO_DATA_ATTACHED
                            </p>
                            <p className="text-sm font-bold text-zinc-400 mt-2">
                                이 요원은 아직 설계도를 업로드하지 않았습니다.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-1 md:gap-4">
                            {portfolios.map((url: string, idx: number) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ opacity: 0.9 }}
                                    className="aspect-square bg-zinc-100 relative group cursor-pointer overflow-hidden rounded-xl border border-zinc-200"
                                >
                                    <img src={url} className="w-full h-full object-cover" />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* 하단 플로팅 바 */}
            <AnimatePresence>
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-[60]"
                >
                    <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-5 flex items-center justify-between shadow-2xl">
                        <div className="pl-6 border-l-4 border-[#FF7D00]">
                            <div className="text-[10px] font-black text-zinc-500 tracking-widest uppercase mb-1 font-mono">Estimated Rate</div>
                            <div className="text-white font-black text-2xl tracking-tighter">
                                ₩{(freelancer.hourlyRate || 0).toLocaleString()} <span className="text-[#7A4FFF] text-xs font-mono">/HR</span>
                            </div>
                        </div>
                        <button
                            onClick={() => alert("시스템 설계 중입니다. 다음 업데이트를 기다려주세요.")}
                            className="bg-white text-zinc-900 px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-[#FF7D00] hover:text-white transition-all active:scale-95 font-mono uppercase tracking-tighter shadow-[0_0_20px_rgba(255,125,0,0.2)]"
                        >
                            Offer_Project
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
