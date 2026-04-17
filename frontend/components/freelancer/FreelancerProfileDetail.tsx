'use client';

import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Briefcase, Grid3X3 } from 'lucide-react';
import api from '@/app/lib/axios';
import { FreelancerProfile, ApiFreelancerDto, mapFreelancerDtoToProfile } from '@/types/freelancer';
import PortfolioDetailModal from '@/components/portfolio/PortfolioDetailModal';
import type { PortfolioDetailShape } from '@/components/portfolio/PortfolioDetailModal';
import ProposalSendModal from '@/components/proposal/ProposalSendModal';

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
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [proposalMode, setProposalMode] = useState<'PROJECT' | 'FORM'>('PROJECT');
    const [clientProjects, setClientProjects] = useState<any[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [offeredPrice, setOfferedPrice] = useState<string>('');
    const [message, setMessage] = useState('');
    const [positionTitle, setPositionTitle] = useState('');
    const [workScope, setWorkScope] = useState('');
    const [workingPeriod, setWorkingPeriod] = useState('');
    const [isSendingProposal, setIsSendingProposal] = useState(false);

    const FALLBACK_IMAGE_URL =
        'https://ui-avatars.com/api/?name=Agent&background=F4F4F5&color=A1A1AA&size=150';

    useEffect(() => {
        setPortalReady(true);
    }, []);

    const openProposalModal = async () => {
        setIsProposalModalOpen(true);
        setProjectsLoading(true);
        try {
            const { data } = await api.get('/v1/projects/me');
            const list = data?.content ?? data ?? [];
            const usable = list.filter((p: any) => p.status !== 'COMPLETED');
            setClientProjects(usable);
            if (usable.length > 0) {
                setSelectedProjectId(usable[0].projectId);
            } else {
                setSelectedProjectId(null);
            }
        } catch {
            setClientProjects([]);
            setSelectedProjectId(null);
        } finally {
            setProjectsLoading(false);
        }
    };

    const closeProposalModal = () => {
        if (isSendingProposal) return;
        setIsProposalModalOpen(false);
    };

    const buildMessageFromForm = () => {
        const chunks = [
            positionTitle.trim() ? `포지션: ${positionTitle.trim()}` : '',
            workScope.trim() ? `업무 범위: ${workScope.trim()}` : '',
            workingPeriod.trim() ? `예상 기간: ${workingPeriod.trim()}` : '',
            message.trim() ? `추가 메시지: ${message.trim()}` : '',
        ].filter(Boolean);
        return chunks.join('\n');
    };

    const createStandaloneProposalProject = async (parsedPrice: number) => {
        const title = positionTitle.trim() || '제안서 기반 협업 프로젝트';
        const details = [
            '[자동 생성] 제안서 기반 프로젝트',
            workScope.trim() ? `업무 범위: ${workScope.trim()}` : '',
            workingPeriod.trim() ? `예상 기간: ${workingPeriod.trim()}` : '',
            message.trim() ? `추가 메시지: ${message.trim()}` : '',
        ].filter(Boolean).join('\n');
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);
        const deadlineStr = deadline.toISOString().split('T')[0];
        const { data } = await api.post('/v1/projects', {
            projectName: `[제안서] ${title}`,
            budget: Math.max(1, Math.floor(parsedPrice)),
            deadline: deadlineStr,
            detail: details,
            online: true,
            offline: false,
            location: null,
            latitude: null,
            longitude: null,
            skills: [],
        });
        return Number(data);
    };

    const handleSendProposal = async () => {
        if (!freelancer?.id) return;
        if (proposalMode === 'PROJECT' && !selectedProjectId) {
            alert('연결할 프로젝트를 선택해주세요.');
            return;
        }
        const parsedPrice = Number(offeredPrice);
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            alert('제안 금액을 올바르게 입력해주세요.');
            return;
        }
        if (proposalMode === 'FORM' && !positionTitle.trim()) {
            alert('포지션명을 입력해주세요.');
            return;
        }
        if (proposalMode === 'FORM' && !workScope.trim()) {
            alert('업무 범위를 입력해주세요.');
            return;
        }

        const composedMessage = proposalMode === 'FORM' ? buildMessageFromForm() : message.trim();
        if (!composedMessage) {
            alert('제안 메시지를 입력해주세요.');
            return;
        }

        const payload = {
            projectId: selectedProjectId,
            freelancerProfileId: freelancer.id,
            offeredPrice: parsedPrice,
            message: composedMessage,
        };

        setIsSendingProposal(true);
        try {
            if (proposalMode === 'FORM') {
                payload.projectId = await createStandaloneProposalProject(parsedPrice);
            }
            await api.post('/v1/proposals', payload);
            alert('제안을 전송했습니다.');
            setIsProposalModalOpen(false);
            setOfferedPrice('');
            setMessage('');
            setPositionTitle('');
            setWorkScope('');
            setWorkingPeriod('');
        } catch (e: any) {
            const text = e?.response?.data?.message;
            if (typeof text === 'string' && text.includes('ALREADY_PROPOSED')) {
                alert('이미 해당 프로젝트로 이 프리랜서에게 제안을 보냈습니다.');
            } else {
                alert('제안 전송에 실패했습니다.');
            }
        } finally {
            setIsSendingProposal(false);
        }
    };

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
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-mono text-xl font-black uppercase tracking-widest text-dn-orange animate-pulse">
                SCANNING AGENT DOSSIER...
            </div>
        );
    }

    if (!freelancer) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 text-center">
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
        <div className="min-h-screen bg-white pb-40 font-sans text-zinc-900">
            <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-zinc-200 bg-white/80 px-10 py-5 shadow-sm backdrop-blur-xl">
                <div className="flex items-center gap-8">
                    <button
                        type="button"
                        className="cursor-pointer font-black text-2xl tracking-tighter"
                        onClick={() => router.push(cfg.brandHref)}
                    >
                        <span className="text-[#FF7D00]">Dev</span>
                        <span className="text-[#7A4FFF]">Near</span>
                    </button>

                    <div className="hidden h-4 w-px bg-zinc-200 md:block" />

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="group flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-all hover:text-zinc-900"
                    >
                        <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        BACK_TO_LIST
                    </button>
                </div>

                <div className="hidden items-center gap-4 sm:flex">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
                        {cfg.navLabel}
                    </span>
                </div>
            </nav>

            <main className="mx-auto max-w-4xl px-4 pt-32">
                <section className="mb-16 flex flex-col items-center gap-8 px-4 md:flex-row md:items-start md:gap-12">
                    <div className="relative shrink-0">
                        <div className="h-32 w-32 rounded-full bg-gradient-to-tr from-[#FF7D00] to-[#7A4FFF] p-1 md:h-40 md:w-40">
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
                        <div className="mb-6 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                            <h1 className="text-3xl font-black">{freelancer.nickname}</h1>
                            {isOwner && (
                                <button
                                    type="button"
                                    className="rounded-lg bg-zinc-100 px-5 py-1.5 font-mono text-sm font-bold tracking-tighter transition hover:bg-zinc-200"
                                >
                                    Edit_Profile
                                </button>
                            )}
                            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#7A4FFF]">
                                Agent Profile
                            </span>
                        </div>

                        <div className="mb-6 flex justify-center gap-8 border-y border-zinc-100 py-4 font-mono md:justify-start md:border-none md:py-0">
                            <div className="text-center md:text-left">
                                <span className="font-bold">{portfolioList.length}</span>{' '}
                                <span className="text-zinc-500">게시물</span>
                            </div>
                            <div className="text-center md:text-left">
                                <span className="font-bold">{freelancer.completedProjects || 0}</span>{' '}
                                <span className="text-zinc-500">프로젝트</span>
                            </div>
                            <div className="text-center md:text-left">
                                <span className="font-bold text-[#FF7D00]">{freelancer.averageRating.toFixed(1)}</span>{' '}
                                <span className="text-zinc-500">평점</span>
                            </div>
                        </div>

                        <div className="space-y-1 text-center md:text-left">
                            <p className="font-mono text-sm font-bold tracking-tight text-[#7A4FFF]">
                                {freelancer.location} • {freelancer.workStyle || 'HYBRID'}
                            </p>
                            <p className="mt-2 max-w-xl italic leading-relaxed text-zinc-600">
                                &quot;{freelancer.introduction}&quot;
                            </p>
                        </div>
                    </div>
                </section>

                <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-8">
                    {freelancer.skills.map((skill) => (
                        <div key={skill.id} className="group flex shrink-0 flex-col items-center gap-2">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-xl shadow-sm transition-transform group-hover:scale-105 group-hover:border-[#FF7D00]">
                                🚀
                            </div>
                            <span className="font-mono text-[10px] font-bold uppercase tracking-tighter text-zinc-500">
                                {skill.name}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="border-t border-zinc-200 px-4 pt-8">
                    <div className="mb-8 flex justify-center gap-12">
                        <div className="-mt-[34px] flex cursor-pointer items-center gap-1.5 border-t-2 border-zinc-950 pt-3 font-mono text-xs font-bold uppercase tracking-widest text-zinc-900">
                            <Grid3X3 size={14} /> PORTFOLIOS
                        </div>
                        <div className="-mt-[34px] flex cursor-pointer items-center gap-1.5 pt-3 font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 transition hover:text-zinc-600">
                            <Briefcase size={14} /> PROJECTS
                        </div>
                    </div>

                    {!portfolioFetchDone ? (
                        <div className="grid animate-pulse grid-cols-3 gap-1 md:gap-4">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="aspect-square rounded-xl border border-zinc-200 bg-zinc-100"
                                />
                            ))}
                        </div>
                    ) : portfolioList.length === 0 ? (
                        <div className="flex w-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-zinc-200 bg-zinc-50 py-20 text-center shadow-inner">
                            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
                                <Briefcase className="text-zinc-300" size={28} />
                            </div>
                            <p className="font-mono text-sm font-black uppercase tracking-widest text-[#7A4FFF]">
                                &gt; NO_PORTFOLIO_DATA_ATTACHED
                            </p>
                            <p className="mt-2 text-sm font-bold text-zinc-400">
                                이 요원은 아직 설계도를 업로드하지 않았습니다.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-1 md:gap-4">
                            {portfolioList.map((p) => {
                                const thumb =
                                    p.thumbnailUrl || p.portfolioImages?.[0] || FALLBACK_IMAGE_URL;
                                return (
                                    <motion.button
                                        type="button"
                                        key={p.id}
                                        whileHover={{ opacity: 0.9 }}
                                        onClick={() => setSelectedPortfolio(p)}
                                        className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 text-left"
                                    >
                                        <img
                                            src={thumb}
                                            alt={p.title}
                                            className="h-full w-full object-cover"
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
                    className="fixed bottom-6 left-1/2 z-[60] w-[90%] max-w-2xl -translate-x-1/2"
                >
                    <div className="flex items-center justify-between rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
                        <div className="border-l-4 border-[#FF7D00] pl-6">
                            <div className="mb-1 font-mono text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                Estimated Rate
                            </div>
                            <div className="text-2xl font-black tracking-tighter text-white">
                                ₩{(freelancer.hourlyRate || 0).toLocaleString()}{' '}
                                <span className="font-mono text-xs text-[#7A4FFF]">/HR</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={openProposalModal}
                            className="rounded-2xl bg-white px-8 py-3.5 font-mono text-sm font-black uppercase tracking-tighter text-zinc-900 shadow-[0_0_20px_rgba(255,125,0,0.2)] transition-all hover:bg-[#FF7D00] hover:text-white active:scale-95"
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

            {portalReady &&
                isProposalModalOpen &&
                createPortal(
                    <AnimatePresence>
                        <motion.div
                            key="proposal-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                                className="w-full max-w-2xl"
                            >
                                <ProposalSendModal
                                    open={isProposalModalOpen}
                                    mode={proposalMode}
                                    onChangeMode={setProposalMode}
                                    projects={clientProjects}
                                    projectsLoading={projectsLoading}
                                    selectedProjectId={selectedProjectId}
                                    onChangeProjectId={setSelectedProjectId}
                                    offeredPrice={offeredPrice}
                                    onChangeOfferedPrice={setOfferedPrice}
                                    positionTitle={positionTitle}
                                    onChangePositionTitle={setPositionTitle}
                                    workScope={workScope}
                                    onChangeWorkScope={setWorkScope}
                                    workingPeriod={workingPeriod}
                                    onChangeWorkingPeriod={setWorkingPeriod}
                                    message={message}
                                    onChangeMessage={setMessage}
                                    sending={isSendingProposal}
                                    onClose={closeProposalModal}
                                    onSend={handleSendProposal}
                                />
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    );
}
