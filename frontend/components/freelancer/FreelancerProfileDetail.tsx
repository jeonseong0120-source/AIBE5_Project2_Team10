'use client';

import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Grid3X3 } from 'lucide-react';
import api from '@/app/lib/axios';
import { FreelancerProfile, ApiFreelancerDto, mapFreelancerDtoToProfile } from '@/types/freelancer';
import PortfolioDetailModal from '@/components/portfolio/PortfolioDetailModal';
import type { PortfolioDetailShape } from '@/components/portfolio/PortfolioDetailModal';

export type FreelancerProfileDetailVariant = 'freelancer' | 'client';

type Props = {
    profileId: string;
    variant: FreelancerProfileDetailVariant;
};

const VARIANT_CONFIG = {
    freelancer: {
        brandHref: '/freelancer/explore',
        notFoundHref: '/freelancer/explore',
        navLabel: 'Agent_Profile_Dossier',
    },
    client: {
        brandHref: '/client/mainpage',
        notFoundHref: '/client/mainpage',
        navLabel: 'Client_Agent_View',
    },
} as const;

export default function FreelancerProfileDetail({ profileId, variant }: Props) {
    const router = useRouter();
    const cfg = VARIANT_CONFIG[variant];
    const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [portfolioList, setPortfolioList] = useState<PortfolioDetailShape[]>([]);
    const [portfolioFetchDone, setPortfolioFetchDone] = useState(false);
    const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioDetailShape | null>(null);
    const [portalReady, setPortalReady] = useState(false);

    const FALLBACK_IMAGE_URL =
        'https://ui-avatars.com/api/?name=Agent&background=F4F4F5&color=A1A1AA&size=150';

    useEffect(() => {
        setPortalReady(true);
    }, []);

    // 🎯 [리뷰 반영] 중복 API 호출(fetchMyInfo) 및 미사용 상태(myUser, myProfile) 삭제 완료

    useEffect(() => {
        if (!profileId) return;
        setLoading(true);
        setFreelancer(null);
        let cancelled = false;
        const fetchDetail = async () => {
            try {
                const { data } = await api.get<ApiFreelancerDto>(`/v1/freelancers/${profileId}`);
                if (!cancelled) {
                    setFreelancer(mapFreelancerDtoToProfile(data));
                }
            } catch {
                // quiet
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        void fetchDetail();
        return () => {
            cancelled = true;
        };
    }, [profileId]);

    useEffect(() => {
        const uid = freelancer?.userId;
        if (uid == null) {
            setPortfolioList([]);
            setPortfolioFetchDone(!!freelancer);
            return;
        }
        let cancelled = false;
        setPortfolioFetchDone(false);
        (async () => {
            try {
                const { data } = await api.get<PortfolioDetailShape[]>('/portfolios', {
                    params: { userId: uid },
                });
                if (!cancelled) setPortfolioList(data ?? []);
            } catch {
                if (!cancelled) setPortfolioList([]);
            } finally {
                if (!cancelled) setPortfolioFetchDone(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [freelancer?.userId]);

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center font-mono text-xl font-black uppercase tracking-widest text-[#FF7D00] animate-pulse">
                SCANNING AGENT DOSSIER...
            </div>
        );
    }

    if (!freelancer) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
                <h3 className="font-mono text-lg font-bold italic uppercase tracking-tighter text-zinc-400">
                    Null: No_Expert_Found
                </h3>
                <button
                    type="button"
                    onClick={() => router.push(cfg.notFoundHref)}
                    className="mt-4 font-mono text-xs font-black uppercase tracking-widest text-[#FF7D00] underline decoration-2 underline-offset-4"
                >
                    Return_To_Base
                </button>
            </div>
        );
    }

    const isOwner = false;

    return (
        <div className="pb-40 font-sans text-zinc-900 relative">
            <main className="mx-auto max-w-4xl px-4 pt-12 relative z-10">
                <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-12">
                    <section className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-12">
                        <div className="relative shrink-0">
                            <div className="h-32 w-32 rounded-full bg-gradient-to-tr from-[#FF7D00] to-[#FFB347] p-1 md:h-40 md:w-40 shadow-xl shadow-orange-900/10">
                                <img
                                    src={freelancer.profileImageUrl || FALLBACK_IMAGE_URL}
                                    alt={freelancer.nickname}
                                    onError={(e) => {
                                        if (e.currentTarget.src !== FALLBACK_IMAGE_URL) {
                                            e.currentTarget.src = FALLBACK_IMAGE_URL;
                                        }
                                    }}
                                    className="h-full w-full rounded-full border-4 border-white bg-white object-cover"
                                />
                            </div>
                        </div>

                        <div className="w-full flex-1">
                            <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
                                <h1 className="text-4xl font-black tracking-tight text-center md:text-left">{freelancer.nickname}</h1>
                                <div className="flex justify-center md:justify-start items-center gap-3">
                                    <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#FF7D00] bg-orange-50 px-3 py-1 rounded-md border border-orange-100">
                                        Agent Profile
                                    </span>
                                    {isOwner && (
                                        <button
                                            type="button"
                                            className="rounded-lg bg-zinc-100 px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition hover:bg-zinc-200"
                                        >
                                            Edit_Profile
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mb-8 flex justify-center md:justify-start divide-x divide-zinc-200 font-mono">
                                <div className="px-6 first:pl-0 text-center md:text-left flex flex-col">
                                    <span className="font-black text-2xl leading-none">{portfolioList.length}</span>
                                    <span className="text-zinc-400 text-[10px] uppercase tracking-widest mt-1">Posts</span>
                                </div>
                                <div className="px-6 text-center md:text-left flex flex-col">
                                    <span className="font-black text-2xl leading-none">{freelancer.completedProjects || 0}</span>
                                    <span className="text-zinc-400 text-[10px] uppercase tracking-widest mt-1">Projects</span>
                                </div>
                                <div className="px-6 text-center md:text-left flex flex-col">
                                    <span className="font-black text-2xl text-[#FF7D00] leading-none">{freelancer.averageRating.toFixed(1)}</span>
                                    <span className="text-zinc-400 text-[10px] uppercase tracking-widest mt-1">Rating</span>
                                </div>
                            </div>

                            <div className="space-y-4 text-center md:text-left">
                                <p className="font-mono text-xs font-bold tracking-widest text-[#FF7D00] uppercase flex items-center justify-center md:justify-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF7D00]"></span>
                                    {freelancer.location} • {freelancer.workStyle || 'HYBRID'}
                                </p>
                                <div className="p-6 bg-orange-50/30 rounded-3xl border border-orange-50/50">
                                    <p className="text-sm font-medium leading-relaxed text-zinc-600 italic">
                                        &quot;{freelancer.introduction}&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="mt-8 border-t border-zinc-100 pt-8">
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            {freelancer.skills.map((skill) => (
                                <span key={skill.id} className="px-4 py-2 bg-zinc-950 text-white rounded-xl font-mono text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#FF7D00] transition-colors cursor-default">
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] p-10 border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="mb-8 flex justify-center gap-12">
                        <div className="-mt-[34px] flex cursor-pointer items-center gap-1.5 border-t-2 border-[#FF7D00] pt-3 font-mono text-xs font-black uppercase tracking-widest text-zinc-900">
                            <Grid3X3 size={14} className="text-[#FF7D00]" /> PORTFOLIOS
                        </div>
                        <div className="-mt-[34px] flex cursor-pointer items-center gap-1.5 pt-3 font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 transition hover:text-[#FF7D00]">
                            <Briefcase size={14} /> PROJECTS
                        </div>
                    </div>

                    {!portfolioFetchDone ? (
                        <div className="grid animate-pulse grid-cols-3 gap-3 md:gap-4">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="aspect-square rounded-[2rem] border border-zinc-200 bg-zinc-50" />
                            ))}
                        </div>
                    ) : portfolioList.length === 0 ? (
                        <div className="flex w-full flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-24 text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-100 bg-white shadow-sm">
                                <Briefcase className="text-zinc-300" size={32} />
                            </div>
                            <p className="font-mono text-sm font-black uppercase tracking-widest text-[#FF7D00]">
                                &gt; NO_PORTFOLIO_DATA_ATTACHED
                            </p>
                            <p className="mt-3 text-xs font-bold text-zinc-400">
                                이 요원은 아직 설계도를 업로드하지 않았습니다.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                            {portfolioList.map((p) => {
                                const thumb = p.thumbnailUrl || p.portfolioImages?.[0] || FALLBACK_IMAGE_URL;
                                return (
                                    <motion.button
                                        type="button"
                                        key={p.id}
                                        whileHover={{ y: -5, opacity: 0.95 }}
                                        onClick={() => setSelectedPortfolio(p)}
                                        className="group relative aspect-square cursor-pointer overflow-hidden rounded-[2rem] border border-zinc-200 bg-zinc-100 text-left shadow-sm hover:shadow-xl hover:border-[#FF7D00]/50 transition-all duration-300"
                                    >
                                        <img
                                            src={thumb}
                                            alt={p.title}
                                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => {
                                                if (e.currentTarget.src !== FALLBACK_IMAGE_URL) {
                                                    e.currentTarget.src = FALLBACK_IMAGE_URL;
                                                }
                                            }}
                                        />
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence>
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-6 left-1/2 z-[60] w-[95%] max-w-3xl -translate-x-1/2"
                >
                    <div className="flex items-center justify-between rounded-full border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl px-8 py-4 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-1 bg-[#FF7D00] rounded-full"></div>
                            <div>
                                <div className="mb-0.5 font-mono text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                    Estimated Rate
                                </div>
                                <div className="text-xl font-black tracking-tighter text-white">
                                    ₩{(freelancer.hourlyRate || 0).toLocaleString()}{' '}
                                    <span className="font-mono text-[10px] text-[#FF7D00]">/HR</span>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => alert('시스템 설계 중입니다. 다음 업데이트를 기다려주세요.')}
                            className="rounded-full bg-white px-8 py-3 font-mono text-xs font-black uppercase tracking-widest text-zinc-900 shadow-[0_0_20px_rgba(255,125,0,0.2)] transition-all hover:bg-[#FF7D00] hover:text-white active:scale-95"
                        >
                            Offer_Project
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {portalReady &&
                selectedPortfolio != null &&
                createPortal(
                    <PortfolioDetailModal
                        portfolio={selectedPortfolio}
                        readOnly
                        onClose={() => setSelectedPortfolio(null)}
                    />,
                    document.body
                )}
        </div>
    );
}