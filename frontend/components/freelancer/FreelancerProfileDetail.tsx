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
    // 🎯 [리뷰 반영] 별도의 Navbar가 없을 때 보여줄 보조 헤더 옵션 추가
    showFallbackHeader?: boolean;
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

export default function FreelancerProfileDetail({ profileId, variant, showFallbackHeader = true }: Props) {
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

    const buildStandaloneProjectPayload = (parsedPrice: number) => {
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
        return {
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
        };
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
                await api.post('/v1/proposals/with-standalone-project', {
                    project: buildStandaloneProjectPayload(parsedPrice),
                    freelancerProfileId: freelancer.id,
                    offeredPrice: parsedPrice,
                    message: composedMessage,
                });
            } else {
                await api.post('/v1/proposals', payload);
            }
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

                {/* 🎯 [리뷰 반영] showFallbackHeader가 true일 때만 뒤로가기 버튼 표시 */}
                {showFallbackHeader && (
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="group mb-12 flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-all hover:text-zinc-900"
                    >
                        <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        BACK_TO_PREVIOUS
                    </button>
                )}

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
                        {/* 🎯 [리뷰 반영] 아직 구현되지 않은 PROJECTS 탭의 클릭 속성 및 스타일 비활성화 처리 */}
                        <div className="-mt-[34px] flex items-center gap-1.5 pt-3 font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">
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