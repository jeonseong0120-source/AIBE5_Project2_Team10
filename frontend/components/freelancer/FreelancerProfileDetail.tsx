'use client';

import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 🎯 아이콘들
import { ChevronLeft, Briefcase, Grid3X3, Heart, ArrowUpRight, Star, MapPin, User } from 'lucide-react';
import api from '@/app/lib/axios';
import { FreelancerProfile, ApiFreelancerDto, mapFreelancerDtoToProfile } from '@/types/freelancer';
import PortfolioDetailModal from '@/components/portfolio/PortfolioDetailModal';
import type { PortfolioDetailShape } from '@/components/portfolio/PortfolioDetailModal';
import ProposalSendModal, { mapProjectsForProposalPicker, type ProjectOption } from '@/components/proposal/ProposalSendModal';
import { useNotifications } from '@/components/notifications/notificationContext';

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

export default function FreelancerProfileDetail({ profileId, variant, showFallbackHeader = true }: Props) {
    const router = useRouter();
    const cfg = VARIANT_CONFIG[variant];
    const viewerIsClient = variant === 'client';

    // --- 주요 정보 상태 ---
    const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [portfolioList, setPortfolioList] = useState<PortfolioDetailShape[]>([]);
    const [portfolioFetchDone, setPortfolioFetchDone] = useState(false);
    const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioDetailShape | null>(null);
    const [portalReady, setPortalReady] = useState(false);

    // --- 제안 모달 관련 상세 상태 ---
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

    // --- 🎯 북마크(하트) 상태 및 로딩 (참고하신 프리랜서 방식 적용) ---
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);

    const FALLBACK_IMAGE_URL = 'https://ui-avatars.com/api/?name=Agent&background=F4F4F5&color=A1A1AA&size=150';

    useEffect(() => {
        setPortalReady(true);
    }, []);

    // --- 🎯 [핵심] 데이터 페칭 로직 (프리랜서 페이지의 "찜 목록 대조" 방식 완벽 이식) ---
    useEffect(() => {
        const fetchData = async () => {
            if (!profileId) return;
            setLoading(true);

            // 1. 프리랜서 상세 정보 호출
            try {
                const { data } = await api.get<ApiFreelancerDto>(`/v1/freelancers/${profileId}`);
                setFreelancer(mapFreelancerDtoToProfile(data));
            } catch (err) {
                console.error("Agent Dossier 로드 실패", err);
            }

            // 2. 🎯 [프리랜서 방식] 직접 찜 목록을 가져와서 현재 profileId가 있는지 대조
            const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;
            if (token && viewerIsClient) {
                try {
                    // size=1000으로 넉넉하게 가져와서 누락 방지
                    const res = await api.get('/v1/bookmarks/freelancers?size=1000');
                    const bookmarkList = res.data.content || [];
                    // 현재 페이지의 profileId가 찜 목록에 있는지 확인
                    const isMarked = bookmarkList.some((b: any) => Number(b.profileId) === Number(profileId));
                    setIsBookmarked(isMarked);
                } catch (e) {
                    console.error("북마크 내역 동기화 실패", e);
                }
            }

            setLoading(false);
        };

        fetchData();
    }, [profileId, viewerIsClient]);

    // --- 🎯 북마크 토글 핸들러 (추가 및 삭제 지원) ---
    const handleBookmark = async () => {
        if (!freelancer?.id || bookmarkLoading) return;
        setBookmarkLoading(true);
        try {
            if (isBookmarked) {
                // 이미 찜한 상태면 해제 (DELETE)
                await api.delete(`/v1/bookmarks/freelancers/${freelancer.id}`);
                setIsBookmarked(false);
            } else {
                // 찜 안된 상태면 추가 (POST)
                await api.post(`/v1/bookmarks/freelancers/${freelancer.id}`);
                setIsBookmarked(true);
            }
        } catch (err: any) {
            // 409 Conflict 발생 시 이미 등록된 것이므로 찜 상태 유지
            if (err.response?.status === 409) {
                setIsBookmarked(true);
            } else {
                console.error("Bookmark toggle failed:", err);
                setToast("찜 처리 중 에러가 발생했습니다. 잠시 후 다시 시도해주세요.");
            }
        } finally {
            setBookmarkLoading(false);
        }
    };

    // --- 제안 모달 관련 함수들 (원본 보존) ---
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
        ].filter(Boolean).join('\n');
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
        if (proposalMode === 'PROJECT' && !selectedProjectId) return alert('연결할 프로젝트를 선택해주세요.');
        const parsedPrice = Number(offeredPrice);
        if (!Number.isFinite(parsedPrice) || parsedPrice < 1) return alert('제안 금액은 1원 이상으로 입력해주세요.');
        if (proposalMode === 'FORM' && !positionTitle.trim()) return alert('포지션명을 입력해주세요.');
        if (proposalMode === 'FORM' && !workScope.trim()) return alert('업무 범위를 입력해주세요.');

        const composedMessage = proposalMode === 'FORM' ? buildMessageFromForm() : message.trim();
        if (!composedMessage) return alert('제안 메시지를 입력해주세요.');

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
            setOfferedPrice(''); setMessage(''); setPositionTitle(''); setWorkScope(''); setWorkingPeriod('');
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

    // --- 포트폴리오 페칭 (원본 보존) ---
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
        return () => { cancelled = true; };
    }, [freelancer?.userId]);

    if (loading) return <div className="flex min-h-[70vh] items-center justify-center font-mono text-xl font-black uppercase text-[#7A4FFF] animate-pulse">SCANNING AGENT DOSSIER...</div>;
    if (!freelancer) return <div className="flex min-h-[70vh] flex-col items-center justify-center text-center"><h3 className="font-mono text-lg font-bold text-zinc-400">Null: No_Expert_Found</h3><button type="button" onClick={() => router.push(cfg.notFoundHref)} className="mt-4 font-mono text-xs font-black text-[#7A4FFF] underline">Return_To_Base</button></div>;

    return (
        <div className="pb-40 font-sans text-zinc-900 relative">
            <main className="mx-auto max-w-6xl px-8 pt-12 relative z-10">

                {showFallbackHeader && (
                    <button type="button" onClick={() => router.back()} className="group mb-12 flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900">
                        <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" /> BACK_TO_PREVIOUS
                    </button>
                )}

                {/* 프로필 정보 영역 */}
                <div className="relative bg-white rounded-[3rem] p-8 md:p-10 border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-12">
                    {/* 💘 Bookmark Button: Top Right Floating */}
                    {viewerIsClient && (
                        <div className="absolute right-6 top-6 z-20 md:right-8 md:top-8">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleBookmark}
                                disabled={bookmarkLoading}
                                aria-label={isBookmarked ? 'Unbookmark profile' : 'Bookmark profile'}
                                aria-pressed={isBookmarked}
                                className={`relative group p-3.5 rounded-[1.8rem] border-2 transition-all duration-500 shadow-xl overflow-hidden ${
                                    isBookmarked
                                        ? 'bg-red-50 border-red-200 text-red-500 shadow-red-200/40'
                                        : 'bg-white border-zinc-100 text-zinc-300 hover:text-red-400 hover:border-red-100 hover:bg-red-50'
                                }`}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={isBookmarked ? 'filled' : 'outline'}
                                        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                        exit={{ scale: 1.5, opacity: 0, rotate: 20 }}
                                        transition={{ 
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 15
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
                                
                                {/* 🌸 Subtle Ripple Effect on Toggle */}
                                {isBookmarked && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0.5 }}
                                        animate={{ scale: 2.5, opacity: 0 }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="absolute inset-0 bg-red-400 rounded-full z-0 pointer-events-none"
                                    />
                                )}
                            </motion.button>
                        </div>
                    )}

                    <div className="flex flex-col gap-6">
                        {/* 📸 Top Row: Image & Primary Stats */}
                        <section className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
                            <div className="relative shrink-0">
                                <div className="h-28 w-28 rounded-[2.2rem] bg-white p-1.5 md:h-36 md:w-36 shadow-2xl shadow-zinc-200 border border-zinc-100 ring-1 ring-white">
                                    <div className="h-full w-full rounded-[1.8rem] overflow-hidden border border-zinc-100/50">
                                        <img 
                                            src={freelancer.profileImageUrl || FALLBACK_IMAGE_URL} 
                                            alt={freelancer.nickname} 
                                            className="h-full w-full object-cover" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="w-full flex-1">
                                <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        {/* 🎖 Grade Badge */}
                                        <div className="flex justify-center md:justify-start">
                                            <span className="rounded-full bg-[#7A4FFF] px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-[0.15em] shadow-lg shadow-purple-200 ring-1 ring-purple-100/20">
                                                {freelancer.gradeName || '일반'}
                                            </span>
                                        </div>
                                        <h1 className="text-3xl font-black tracking-tight text-center md:text-left">{freelancer.nickname}</h1>
                                        
                                        {/* 📍 Secondary Info Bar */}
                                        <div className="mt-1.5 flex flex-wrap justify-center md:justify-start items-center gap-x-3 gap-y-1.5 text-zinc-600 font-medium text-[11px]">
                                            <div className="flex items-center gap-1.5 bg-zinc-50 px-2 py-0.5 rounded-lg border border-zinc-100">
                                                <MapPin size={12} className="text-zinc-400" />
                                                {freelancer.location}
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-zinc-50 px-2 py-0.5 rounded-lg border border-zinc-100">
                                                <Briefcase size={12} className="text-zinc-400" />
                                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter mr-0.5">Work Style:</span>
                                                {freelancer.workStyle || 'HYBRID'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center md:justify-start divide-x divide-zinc-200 font-mono">
                                    <div className="px-5 first:pl-0 text-center md:text-left flex flex-col"><span className="font-black text-xl leading-none">{portfolioList.length}</span><span className="text-zinc-400 text-[9px] uppercase tracking-widest mt-1">Posts</span></div>
                                    <div className="px-5 text-center md:text-left flex flex-col"><span className="font-black text-xl leading-none">{freelancer.completedProjects || 0}</span><span className="text-zinc-400 text-[9px] uppercase tracking-widest mt-1">Projects</span></div>
                                    <div className="px-5 text-center md:text-left flex flex-col"><span className="font-black text-xl text-[#7A4FFF] leading-none">{(freelancer.averageRating || 0).toFixed(1)}</span><span className="text-zinc-400 text-[9px] uppercase tracking-widest mt-1">Rating</span></div>
                                </div>
                            </div>
                        </section>

                        {/* 📝 Full Width Introduction */}
                        <section className="w-full border-t border-zinc-100 pt-6">
                            <div className="p-6 bg-purple-50/20 rounded-[2rem] border border-zinc-100/50">
                                <p className="text-sm font-medium leading-[1.6] text-zinc-600 max-w-4xl">
                                    &quot;{freelancer.introduction}&quot;
                                </p>
                            </div>
                        </section>
                    </div>

                    <div className="mt-8 border-t border-zinc-100 pt-8 flex flex-wrap justify-center gap-3">
                        {freelancer.skills.map((skill) => (
                            <span key={skill.id} className="px-6 py-3 bg-zinc-950 text-white rounded-2xl font-mono text-xs font-black uppercase tracking-wider shadow-xl shadow-zinc-200 hover:bg-[#7A4FFF] hover:scale-105 transition-all cursor-default">{skill.name}</span>
                        ))}
                    </div>
                </div>

                {/* 포트폴리오 그리드 영역 */}
                <div className="bg-white rounded-[3rem] p-10 border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="mb-8 flex justify-center gap-12">
                        <div className="-mt-[34px] flex cursor-pointer items-center gap-1.5 border-t-2 border-[#7A4FFF] pt-3 font-mono text-xs font-black uppercase tracking-widest text-zinc-900"><Grid3X3 size={14} className="text-[#7A4FFF]" /> PORTFOLIOS</div>
                        <div className="-mt-[34px] flex items-center gap-1.5 pt-3 font-mono text-xs font-bold uppercase tracking-widest text-zinc-400"><Briefcase size={14} /> PROJECTS</div>
                    </div>

                    {!portfolioFetchDone ? (
                        <div className="grid animate-pulse grid-cols-3 gap-3 md:gap-4">
                            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="aspect-square rounded-[2rem] border border-zinc-200 bg-zinc-50" />)}
                        </div>
                    ) : portfolioList.length === 0 ? (
                        <div className="flex w-full flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-24 text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-100 bg-white shadow-sm"><Briefcase className="text-zinc-300" size={32} /></div>
                            <p className="font-mono text-sm font-black uppercase tracking-widest text-[#7A4FFF]">&gt; NO_PORTFOLIO_DATA_ATTACHED</p>
                            <p className="mt-3 text-xs font-bold text-zinc-400">이 요원은 아직 설계도를 업로드하지 않았습니다.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                            {portfolioList.map((p) => {
                                const thumb = p.thumbnailUrl || p.portfolioImages?.[0] || FALLBACK_IMAGE_URL;
                                const portSkills = p.skills ?? [];
                                return (
                                    <motion.div
                                        key={p.id}
                                        whileHover={{ y: -12 }}
                                        onClick={() => setSelectedPortfolio(p)}
                                        className="group relative flex flex-col bg-white rounded-[3rem] border border-zinc-100 overflow-hidden hover:border-[#7A4FFF] hover:shadow-[0_30px_60px_-12px_rgba(122,79,255,0.12)] transition-all duration-500 cursor-pointer"
                                    >
                                        {/* Thumbnail: 7:5 Aspect Ratio */}
                                        <div className="w-full aspect-[7/5] bg-zinc-50 overflow-hidden relative">
                                            <img
                                                src={thumb}
                                                alt={p.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms] ease-out"
                                                onError={(e) => {
                                                    if (e.currentTarget.src !== FALLBACK_IMAGE_URL) {
                                                        e.currentTarget.src = FALLBACK_IMAGE_URL;
                                                    }
                                                }}
                                            />
                                            
                                            {/* Action Overlay */}
                                            <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] flex items-center justify-center">
                                                <div className="bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                    <span className="text-zinc-950 text-[10px] font-black font-mono tracking-[0.2em] uppercase">Open_Project</span>
                                                    <ArrowUpRight size={14} className="text-[#7A4FFF]" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Info (Matching MyPage style) */}
                                        <div className="p-7 flex flex-col items-center text-center">
                                            <h3 className="font-black text-base leading-tight text-zinc-900 group-hover:text-[#7A4FFF] transition-colors line-clamp-2 min-h-[2.5rem] flex items-center justify-center mb-4">
                                                {p.title}
                                            </h3>
                                            
                                            <div className="flex flex-wrap justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                                                {portSkills.slice(0, 5).map((s, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-zinc-50 text-zinc-700 border border-zinc-100 rounded-lg text-[9px] font-bold uppercase font-mono tracking-tighter group-hover:border-[#7A4FFF]/30">
                                                        #{s.name}
                                                    </span>
                                                ))}
                                                {portSkills.length > 5 && (
                                                    <span className="px-2 py-1 bg-zinc-950 text-white rounded-lg text-[8px] font-black font-mono">
                                                        +{portSkills.length - 5}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* 하단 오퍼 플로팅 바 */}
            {variant === 'client' && (
                <AnimatePresence>
                    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-6 left-1/2 z-[60] w-[90%] max-w-2xl -translate-x-1/2">
                        <div className="flex items-center justify-between rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
                            <div className="border-l-4 border-[#7A4FFF] pl-6">
                                <div className="mb-1 font-mono text-[10px] font-black uppercase tracking-widest text-zinc-500">Estimated Rate</div>
                                <div className="text-2xl font-black tracking-tighter text-white">₩{(freelancer.hourlyRate || 0).toLocaleString()} <span className="font-mono text-xs text-zinc-400">/HR</span></div>
                            </div>
                            <button type="button" onClick={openProposalModal} className="rounded-2xl bg-white px-8 py-3.5 font-mono text-sm font-black uppercase tracking-tighter text-zinc-900 shadow-[0_0_20px_rgba(122,79,255,0.2)] transition-all hover:bg-[#7A4FFF] hover:text-white active:scale-95">Offer_Project</button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}

            {/* 모달 포탈 처리 */}
            {portalReady && selectedPortfolio != null && createPortal(
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

            {portalReady && viewerIsClient && isProposalModalOpen && createPortal(
                <AnimatePresence>
                    <motion.div key="proposal-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }} className="w-full max-w-2xl">
                            <ProposalSendModal
                                open={isProposalModalOpen} mode={proposalMode} onChangeMode={setProposalMode}
                                projects={clientProjects} projectsLoading={projectsLoading}
                                selectedProjectId={selectedProjectId} onChangeProjectId={setSelectedProjectId}
                                offeredPrice={offeredPrice} onChangeOfferedPrice={setOfferedPrice}
                                positionTitle={positionTitle} onChangePositionTitle={setPositionTitle}
                                workScope={workScope} onChangeWorkScope={setWorkScope}
                                workingPeriod={workingPeriod} onChangeWorkingPeriod={setWorkingPeriod}
                                message={message} onChangeMessage={setMessage}
                                sending={isSendingProposal} onClose={closeProposalModal} onSend={handleSendProposal}
                            />
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}