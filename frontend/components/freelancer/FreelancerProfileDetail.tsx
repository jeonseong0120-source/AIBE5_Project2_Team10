'use client';

import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Briefcase, Grid3X3, Heart, ArrowUpRight, MapPin, Star, Sparkles } from 'lucide-react';
import api from '@/app/lib/axios';
import { FreelancerProfile, ApiFreelancerDto, mapFreelancerDtoToProfile, ReviewResponse } from '@/types/freelancer';
import PortfolioDetailModal from '@/components/portfolio/PortfolioDetailModal';
import type { PortfolioDetailShape } from '@/components/portfolio/PortfolioDetailModal';
import ProposalSendModal, {
    mapProjectsForProposalPicker,
    type ProjectOption,
} from '@/components/proposal/ProposalSendModal';
import { useNotifications } from '@/components/notifications/notificationContext';
import ChatStartButton from '@/components/chat/ChatStartButton';

export type FreelancerProfileDetailVariant = 'freelancer' | 'client';

type Props = {
    profileId: string;
    variant: FreelancerProfileDetailVariant;
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

export default function FreelancerProfileDetail({
                                                    profileId,
                                                    variant,
                                                    showFallbackHeader = true,
                                                }: Props) {
    const router = useRouter();
    const cfg = VARIANT_CONFIG[variant];
    const viewerIsClient = variant === 'client';

    const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [portfolioList, setPortfolioList] = useState<PortfolioDetailShape[]>([]);
    const [portfolioFetchDone, setPortfolioFetchDone] = useState(false);
    const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioDetailShape | null>(null);
    const [portalReady, setPortalReady] = useState(false);

    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [proposalMode, setProposalMode] = useState<'PROJECT' | 'FORM'>('PROJECT');
    const [clientProjects, setClientProjects] = useState<ProjectOption[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [offeredPrice, setOfferedPrice] = useState<string>('');
    const [message, setMessage] = useState('');
    const [positionTitle, setPositionTitle] = useState('');
    const [workScope, setWorkScope] = useState('');
    const [workingPeriod, setWorkingPeriod] = useState('');
    const [isSendingProposal, setIsSendingProposal] = useState(false);
    const { setToast } = useNotifications();

    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);

    // 🎯 [추가] 탭 상태 및 리뷰 데이터
    const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'PROJECT' | 'REVIEW'>('PORTFOLIO');
    const [reviews, setReviews] = useState<ReviewResponse[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsFetchDone, setReviewsFetchDone] = useState(false);

    const FALLBACK_IMAGE_URL =
        'https://ui-avatars.com/api/?name=Agent&background=F4F4F5&color=A1A1AA&size=150';

    useEffect(() => {
        setPortalReady(true);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!profileId) return;
            setLoading(true);

            try {
                const { data } = await api.get<ApiFreelancerDto>(`/v1/freelancers/${profileId}`);
                setFreelancer(mapFreelancerDtoToProfile(data));
            } catch (err) {
                console.error('Agent Dossier 로드 실패', err);
            }

            const token =
                typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

            if (token && viewerIsClient) {
                try {
                    const res = await api.get('/v1/bookmarks/freelancers?size=1000');
                    const bookmarkList = res.data.content || [];
                    const isMarked = bookmarkList.some(
                        (b: any) => Number(b.profileId) === Number(profileId)
                    );
                    setIsBookmarked(isMarked);
                } catch (e) {
                    console.error('북마크 내역 동기화 실패', e);
                }
            }

            setLoading(false);
        };

        fetchData();
    }, [profileId, viewerIsClient]);

    const handleBookmark = async () => {
        if (!freelancer?.id || bookmarkLoading) return;
        setBookmarkLoading(true);

        try {
            if (isBookmarked) {
                await api.delete(`/v1/bookmarks/freelancers/${freelancer.id}`);
                setIsBookmarked(false);
            } else {
                await api.post(`/v1/bookmarks/freelancers/${freelancer.id}`);
                setIsBookmarked(true);
            }
        } catch (err: any) {
            if (err.response?.status === 409) {
                setIsBookmarked(true);
            } else {
                console.error('Bookmark toggle failed:', err);
                setToast('찜 처리 중 에러가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
        } finally {
            setBookmarkLoading(false);
        }
    };

    const openProposalModal = async () => {
        if (!viewerIsClient) return;
        setIsProposalModalOpen(true);
        setProjectsLoading(true);

        try {
            const { data } = await api.get('/v1/projects/me');
            const usable = mapProjectsForProposalPicker(data?.content ?? data ?? []);
            setClientProjects(usable);
            setSelectedProjectId(usable.length > 0 ? usable[0].projectId : null);
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
        ]
            .filter(Boolean)
            .join('\n');

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);

        const deadlineStr = [
            deadline.getFullYear(),
            String(deadline.getMonth() + 1).padStart(2, '0'),
            String(deadline.getDate()).padStart(2, '0'),
        ].join('-');

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
            return alert('연결할 프로젝트를 선택해주세요.');
        }

        const parsedPrice = Number(offeredPrice);
        if (!Number.isFinite(parsedPrice) || parsedPrice < 1) {
            return alert('제안 금액은 1원 이상으로 입력해주세요.');
        }

        if (proposalMode === 'FORM' && !positionTitle.trim()) {
            return alert('포지션명을 입력해주세요.');
        }

        if (proposalMode === 'FORM' && !workScope.trim()) {
            return alert('업무 범위를 입력해주세요.');
        }

        const composedMessage = proposalMode === 'FORM' ? buildMessageFromForm() : message.trim();
        if (!composedMessage) {
            return alert('제안 메시지를 입력해주세요.');
        }

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
                await api.post('/v1/proposals', {
                    projectId: selectedProjectId,
                    freelancerProfileId: freelancer.id,
                    offeredPrice: parsedPrice,
                    message: composedMessage,
                });
            }

            alert('제안을 전송했습니다. 🚀');
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

    // 🎯 [추가] 리뷰 로드 함수
    useEffect(() => {
        if (!freelancer?.id) {
            setReviews([]);
            setReviewsFetchDone(false);
            return;
        }

        // 프로필이 바뀌면 리뷰 로드 상태 초기화
        setReviewsFetchDone(false);

        if (activeTab !== 'REVIEW') return;

        const controller = new AbortController();

        const fetchReviews = async () => {
            setReviewsLoading(true);
            try {
                const { data } = await api.get(`/reviews/freelancers/${freelancer.id}`, {
                    signal: controller.signal
                });
                const finalData = Array.isArray(data) ? data : (data.content || []);
                setReviews(finalData);
                setReviewsFetchDone(true);
            } catch (err: any) {
                if (err.name === 'CanceledError' || axios.isCancel(err)) {
                    return;
                }
                console.error('리뷰 로드 실패', err);
            } finally {
                setReviewsLoading(false);
            }
        };

        void fetchReviews();

        return () => {
            controller.abort();
        };
    }, [activeTab, freelancer?.id]);

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center animate-pulse font-mono text-xl font-black uppercase text-[#7A4FFF]">
                SCANNING AGENT DOSSIER...
            </div>
        );
    }

    if (!freelancer) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
                <h3 className="font-mono text-lg font-bold text-zinc-400">
                    Null: No_Expert_Found
                </h3>
                <button
                    type="button"
                    onClick={() => router.push(cfg.notFoundHref)}
                    className="mt-4 font-mono text-xs font-black text-[#7A4FFF] underline"
                >
                    Return_To_Base
                </button>
            </div>
        );
    }

    return (
        <div className="relative pb-40 font-sans text-zinc-900">
            <main className="relative z-10 mx-auto max-w-6xl px-8 pt-12">
                {showFallbackHeader && (
                    <div className="mb-8 flex">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="group flex items-center gap-2.5 rounded-2xl border border-zinc-100 bg-white/50 px-4 py-2 transition-all hover:border-[#7A4FFF]/30 hover:bg-white hover:shadow-lg active:scale-95"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-50 transition-colors group-hover:bg-[#7A4FFF]/10">
                                <ChevronLeft
                                    size={16}
                                    className="text-zinc-400 transition-transform group-hover:-translate-x-0.5 group-hover:text-[#7A4FFF]"
                                />
                            </div>
                            <span className="pr-1 text-[13px] font-black tracking-tight text-zinc-500 transition-colors group-hover:text-zinc-950">
                                뒤로 가기
                            </span>
                        </button>
                    </div>
                )}

                <div className="relative mb-12 rounded-[3rem] border border-zinc-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:p-10">
                    {viewerIsClient && (
                        <div className="absolute right-6 top-6 z-20 md:right-8 md:top-8">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleBookmark}
                                disabled={bookmarkLoading}
                                aria-label={isBookmarked ? 'Unbookmark profile' : 'Bookmark profile'}
                                aria-pressed={isBookmarked}
                                className={`relative group overflow-hidden rounded-[1.8rem] border-2 p-3.5 shadow-xl transition-all duration-500 ${
                                    isBookmarked
                                        ? 'border-red-200 bg-red-50 text-red-500 shadow-red-200/40'
                                        : 'border-zinc-100 bg-white text-zinc-300 hover:border-red-100 hover:bg-red-50 hover:text-red-400'
                                }`}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={isBookmarked ? 'filled' : 'outline'}
                                        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                        exit={{ scale: 1.5, opacity: 0, rotate: 20 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 15,
                                        }}
                                        className="relative z-10"
                                    >
                                        <Heart
                                            size={26}
                                            fill={isBookmarked ? 'currentColor' : 'none'}
                                            strokeWidth={isBookmarked ? 0 : 2}
                                            className={bookmarkLoading ? 'animate-pulse' : ''}
                                        />
                                    </motion.div>
                                </AnimatePresence>

                                {isBookmarked && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0.5 }}
                                        animate={{ scale: 2.5, opacity: 0 }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        className="pointer-events-none absolute inset-0 z-0 rounded-full bg-red-400"
                                    />
                                )}
                            </motion.button>
                        </div>
                    )}

                    <div className="flex flex-col gap-6">
                        <section className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
                            <div className="relative shrink-0">
                                <div className="h-28 w-28 rounded-[2.2rem] border border-zinc-100 bg-white p-1.5 shadow-2xl shadow-zinc-200 ring-1 ring-white md:h-36 md:w-36">
                                    <div className="h-full w-full overflow-hidden rounded-[1.8rem] border border-zinc-100/50">
                                        <img
                                            src={freelancer.profileImageUrl || FALLBACK_IMAGE_URL}
                                            alt={freelancer.nickname}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="w-full flex-1">
                                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-center md:justify-start">
                                            <span className="rounded-full bg-[#7A4FFF] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-purple-200 ring-1 ring-purple-100/20">
                                                {freelancer.gradeName || '일반'}
                                            </span>
                                        </div>

                                        <h1 className="text-center text-4xl font-black tracking-tighter md:text-left text-zinc-950">
                                            {freelancer.nickname}
                                        </h1>

                                        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] font-bold text-zinc-500 md:justify-start">
                                            <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-1">
                                                <MapPin size={13} className="text-[#7A4FFF]" />
                                                {freelancer.location}
                                            </div>
                                            <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-1">
                                                <Briefcase size={13} className="text-[#7A4FFF]" />
                                                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                    STYLE:
                                                </span>
                                                {freelancer.workStyle || 'HYBRID'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center divide-x divide-zinc-100 font-mono md:justify-start">
                                    <div className="flex flex-col px-6 text-center first:pl-0 md:text-left">
                                        <span className="text-2xl font-black tracking-tighter text-zinc-950">
                                            {portfolioList.length}
                                        </span>
                                        <span className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            Portfolios
                                        </span>
                                    </div>
                                    <div className="flex flex-col px-6 text-center md:text-left">
                                        <span className="text-2xl font-black tracking-tighter text-zinc-950">
                                            {freelancer.completedProjects || 0}
                                        </span>
                                        <span className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            Completed
                                        </span>
                                    </div>
                                    <div className="flex flex-col px-6 text-center md:text-left">
                                        <span className="text-2xl font-black tracking-tighter text-[#7A4FFF]">
                                            {(freelancer.averageRating || 0).toFixed(1)}
                                        </span>
                                        <span className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#7A4FFF]">
                                            Rating
                                        </span>
                                    </div>
                                </div>

                                {viewerIsClient && freelancer?.userId && (
                                    <div className="mt-6 flex flex-col items-center gap-3 md:items-start">
                                        {selectedProjectId ? (
                                            <ChatStartButton
                                                targetUserId={freelancer.userId}
                                                projectId={selectedProjectId}
                                                className="rounded-2xl bg-[#7A4FFF] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#6840e0]"
                                            >
                                                문의하기
                                            </ChatStartButton>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={openProposalModal}
                                                className="rounded-2xl bg-[#7A4FFF] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#6840e0]"
                                            >
                                                문의하기
                                            </button>
                                        )}

                                        <p className="text-xs text-zinc-400">
                                            {!selectedProjectId
                                                ? '먼저 연결할 프로젝트를 선택해야 채팅을 시작할 수 있습니다.'
                                                : `선택된 프로젝트 ID: ${selectedProjectId}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="w-full border-t border-zinc-100 pt-8">
                            <div className="rounded-[2.5rem] border border-zinc-100/50 bg-zinc-50/30 p-8">
                                <p className="max-w-4xl text-base font-bold leading-relaxed text-zinc-600 italic">
                                    &quot;{freelancer.introduction}&quot;
                                </p>
                            </div>
                        </section>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-3 border-t border-zinc-100 pt-8">
                        {freelancer.skills.map((skill) => (
                            <span
                                key={skill.id}
                                className="cursor-default rounded-2xl bg-zinc-950 px-6 py-3 font-mono text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-zinc-200 transition-all hover:scale-105 hover:bg-[#7A4FFF]"
                            >
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="rounded-[3rem] border border-zinc-100 bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="mb-10 flex justify-center">
                        <div className="relative flex w-full max-w-2xl items-center justify-between gap-2 rounded-[2rem] bg-zinc-50 p-1.5 shadow-inner">
                            {[
                                { id: 'PORTFOLIO', label: '포트폴리오', icon: Grid3X3, count: portfolioList.length },
                                { id: 'REVIEW', label: '리뷰/평점', icon: Star, count: reviews.length },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`relative flex flex-1 items-center justify-center gap-2.5 rounded-2xl py-3.5 transition-all duration-500 ${
                                        activeTab === tab.id
                                            ? 'text-white'
                                            : 'text-zinc-400 hover:text-zinc-600'
                                    }`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTabIndicator"
                                            className="absolute inset-0 z-0 rounded-2xl bg-zinc-950 shadow-xl shadow-zinc-200"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <tab.icon size={15} className="relative z-10" />
                                    <span className="relative z-10 text-[13px] font-black tracking-tight">
                                        {tab.label}
                                    </span>
                                    {tab.count > 0 && (
                                        <span className={`relative z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 font-mono text-[9px] font-black ${
                                            activeTab === tab.id ? 'bg-[#7A4FFF] text-white' : 'bg-zinc-200 text-zinc-500'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'PORTFOLIO' && (
                            <motion.div
                                key="portfolio-tab"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {!portfolioFetchDone ? (
                                    <div className="grid animate-pulse grid-cols-3 gap-3 md:gap-4">
                                        {[0, 1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className="aspect-square rounded-[2rem] border border-zinc-200 bg-zinc-50"
                                            />
                                        ))}
                                    </div>
                                ) : portfolioList.length === 0 ? (
                                    <div className="flex w-full flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-24 text-center">
                                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-100 bg-white shadow-sm">
                                            <Briefcase className="text-zinc-300" size={32} />
                                        </div>
                                        <p className="font-mono text-sm font-black uppercase tracking-widest text-[#7A4FFF]">
                                            &gt; NO_PORTFOLIO_RECORDS_FOUND
                                        </p>
                                        <p className="mt-3 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                            이 요원은 아직 설계도를 업로드하지 않았습니다.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                                        {portfolioList.map((p) => {
                                            const thumb =
                                                p.thumbnailUrl || p.portfolioImages?.[0] || FALLBACK_IMAGE_URL;
                                            const portSkills = p.skills ?? [];

                                            return (
                                                <motion.button
                                                    type="button"
                                                    key={p.id}
                                                    whileHover={{ y: -12 }}
                                                    onClick={() => setSelectedPortfolio(p)}
                                                    aria-label={`포트폴리오 열기: ${p.title}`}
                                                    className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[3rem] border border-zinc-100 bg-white text-left transition-all duration-500 hover:shadow-[0_30px_60px_-12px_rgba(122,79,255,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A4FFF] focus-visible:ring-offset-2"
                                                >
                                                    <div className="relative aspect-[7/5] w-full overflow-hidden bg-zinc-50">
                                                        <img
                                                            src={thumb}
                                                            alt={p.title}
                                                            className="h-full w-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-110"
                                                            onError={(e) => {
                                                                if (e.currentTarget.src !== FALLBACK_IMAGE_URL) {
                                                                    e.currentTarget.src = FALLBACK_IMAGE_URL;
                                                                }
                                                            }}
                                                        />

                                                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                                                            <div className="flex translate-y-4 items-center gap-2 rounded-2xl bg-white/90 px-5 py-3 shadow-2xl backdrop-blur-md transition-transform duration-500 group-hover:translate-y-0">
                                                                <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950">
                                                                    Open_Project
                                                                </span>
                                                                <ArrowUpRight
                                                                    size={14}
                                                                    className="text-[#7A4FFF]"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-center p-7 text-center">
                                                        <h3 className="mb-4 flex min-h-[2.5rem] items-center justify-center text-lg font-black leading-tight text-zinc-950 transition-colors line-clamp-2 group-hover:text-[#7A4FFF] tracking-tighter">
                                                            {p.title}
                                                        </h3>

                                                        <div className="flex flex-wrap justify-center gap-1.5 opacity-70 transition-opacity duration-500 group-hover:opacity-100">
                                                            {portSkills.slice(0, 5).map((s, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-tighter text-zinc-600 group-hover:border-[#7A4FFF]/30"
                                                                >
                                                                    #{s.name}
                                                                </span>
                                                            ))}
                                                            {portSkills.length > 5 && (
                                                                <span className="rounded-lg bg-zinc-950 px-2 py-1 font-mono text-[8px] font-black text-white">
                                                                    +{portSkills.length - 5}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}


                        {activeTab === 'REVIEW' && (
                            <motion.div
                                key="review-tab"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    {reviewsLoading ? (
                                        <div className="py-20 flex justify-center">
                                            <div className="w-8 h-8 border-4 border-[#7A4FFF]/20 border-t-[#7A4FFF] rounded-full animate-spin" />
                                        </div>
                                    ) : reviews.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 rounded-[2.5rem] border-2 border-dashed border-zinc-100">
                                            <Star size={32} className="text-zinc-100 mb-4" />
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] font-mono">Awaiting_Your_Review</p>
                                        </div>
                                    ) : (
                                        reviews.map((rev, idx) => (
                                            <motion.div
                                                key={rev.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="p-8 bg-zinc-50 border border-zinc-100 rounded-[2.5rem] hover:border-[#7A4FFF]/20 transition-all group"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-1 text-[#FF7D00]">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={12}
                                                                fill={i < Math.floor(rev.averageScore || 0) ? "currentColor" : "none"}
                                                            />
                                                        ))}
                                                        <span className="ml-2 text-xs font-black text-zinc-950 font-mono">{(rev.averageScore || 0).toFixed(1)}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-300 font-mono tracking-widest">VERIFIED_CLIENT</span>
                                                </div>
                                                <p className="text-zinc-700 text-base leading-relaxed font-bold italic group-hover:text-zinc-950 transition-colors">
                                                    &quot;{rev.comment || '상세 후기 내용이 없습니다.'}&quot;
                                                </p>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {variant === 'client' && (
                <AnimatePresence>
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        className="fixed bottom-6 left-1/2 z-[60] w-[90%] max-w-2xl -translate-x-1/2"
                    >
                        <div className="flex items-center justify-between rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
                            <div className="border-l-4 border-[#7A4FFF] pl-6">
                                <div className="mb-1 font-mono text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                    Estimated Rate
                                </div>
                                <div className="text-2xl font-black tracking-tighter text-white">
                                    ₩{(freelancer.hourlyRate || 0).toLocaleString()}{' '}
                                    <span className="font-mono text-xs text-zinc-400">/HR</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={openProposalModal}
                                className="rounded-2xl bg-white px-8 py-3.5 font-mono text-sm font-black uppercase tracking-tighter text-zinc-900 shadow-[0_0_20px_rgba(122,79,255,0.2)] transition-all hover:bg-[#7A4FFF] hover:text-white active:scale-95"
                            >
                                Offer_Project
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}

            {portalReady &&
                selectedPortfolio != null &&
                createPortal(
                    <PortfolioDetailModal
                        portfolio={selectedPortfolio}
                        readOnly
                        onClose={() => setSelectedPortfolio(null)}
                        authorNickname={freelancer.nickname}
                        authorProfileImage={freelancer.profileImageUrl}
                        authorRating={freelancer.averageRating}
                        authorGradeName={freelancer.gradeName}
                    />,
                    document.body
                )}

            {portalReady &&
                viewerIsClient &&
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
                                    targetName={freelancer.nickname}
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