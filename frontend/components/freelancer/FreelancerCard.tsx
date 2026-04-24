'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
// 🎯 Heart 아이콘 추가
import { ChevronLeft, ChevronRight, Loader2, MapPin, Star, Heart } from 'lucide-react';
import { FreelancerProfile } from '@/types/freelancer';
import api from '@/app/lib/axios';
import PortfolioDetailModal, {
    type PortfolioDetailShape,
} from '@/components/portfolio/PortfolioDetailModal';

interface Props {
    data: FreelancerProfile;
    initialIsBookmarked?: boolean;
}

export default function FreelancerCard({ data, initialIsBookmarked = false }: Props) {
    const FALLBACK_IMAGE_URL =
        'https://ui-avatars.com/api/?name=Agent&background=F4F4F5&color=A1A1AA&size=150';

    /** 목록 API: 포트폴리오별 대표 썸네일(또는 첫 상세 이미지) URL 배열 — 갤러리 전체가 아님 */
    const slides = useMemo(() => {
        const fromPortfolio = (data.portfolioImageUrls ?? []).filter(Boolean);
        if (fromPortfolio.length > 0) return fromPortfolio;
        return [data.profileImageUrl || FALLBACK_IMAGE_URL];
    }, [data.portfolioImageUrls, data.profileImageUrl]);

    const [slideIndex, setSlideIndex] = useState(0);

    const [portfolioModal, setPortfolioModal] = useState<PortfolioDetailShape | null>(null);
    const [portfolioModalImageIndex, setPortfolioModalImageIndex] = useState(0);
    const [portfolioLoading, setPortfolioLoading] = useState(false);
    const portfolioFetchLock = useRef(false);
    const [portalReady, setPortalReady] = useState(false);

    // 🎯 [개선] 부모로부터 전달받은 초기 상태 사용
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);

    useEffect(() => {
        setPortalReady(true);
    }, []);

    // prop 변화 시 동기화 (필요시)
    useEffect(() => {
        setIsBookmarked(initialIsBookmarked);
    }, [initialIsBookmarked]);

    useEffect(() => {
        setSlideIndex(0);
    }, [data.id]);

    // 🎯 [추가] 북마크 토글 핸들러
    const handleBookmarkToggle = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation(); // 카드 클릭 이벤트(상세 이동) 방지

        if (bookmarkLoading) return;
        setBookmarkLoading(true);

        try {
            if (isBookmarked) {
                await api.delete(`/v1/bookmarks/freelancers/${data.id}`);
                setIsBookmarked(false);
            } else {
                await api.post(`/v1/bookmarks/freelancers/${data.id}`);
                setIsBookmarked(true);
            }
        } catch (err: any) {
            if (err.response?.status === 409) {
                setIsBookmarked(true);
            } else {
                alert("찜 처리 중 에러가 발생했습니다.");
            }
        } finally {
            setBookmarkLoading(false);
        }
    };

    const goPrev = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
        },
        [slides.length]
    );

    const goNext = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setSlideIndex((i) => (i + 1) % slides.length);
        },
        [slides.length]
    );

    const openPortfolioDetail = useCallback(async () => {
        if (portfolioFetchLock.current) return;
        portfolioFetchLock.current = true;

        const uid = data.userId;
        if (uid == null) {
            portfolioFetchLock.current = false;
            alert('포트폴리오 정보를 불러올 수 없습니다.');
            return;
        }

        const slideUrl = slides[slideIndex];
        setPortfolioLoading(true);
        try {
            const { data: list } = await api.get<PortfolioDetailShape[]>('/portfolios', {
                params: { userId: uid },
            });
            const portfolios = list || [];

            if (portfolios.length === 0) {
                const isOnlyProfile =
                    slideUrl === (data.profileImageUrl || FALLBACK_IMAGE_URL) ||
                    slideUrl === FALLBACK_IMAGE_URL;
                if (isOnlyProfile) {
                    alert('등록된 포트폴리오가 없습니다.');
                    return;
                }
                alert('등록된 포트폴리오가 없습니다.');
                return;
            }

            let chosen: PortfolioDetailShape = portfolios[0];
            let initialIdx = 0;

            for (const p of portfolios) {
                if (p.thumbnailUrl && p.thumbnailUrl === slideUrl) {
                    chosen = p;
                    initialIdx = 0;
                    break;
                }
                const imgs = p.portfolioImages ?? [];
                const idx = imgs.indexOf(slideUrl);
                if (idx >= 0) {
                    chosen = p;
                    initialIdx = idx;
                    break;
                }
            }

            setPortfolioModalImageIndex(initialIdx);
            setPortfolioModal(chosen);
        } catch {
            alert('포트폴리오를 불러오지 못했습니다.');
        } finally {
            setPortfolioLoading(false);
            portfolioFetchLock.current = false;
        }
    }, [data.userId, data.profileImageUrl, slides, slideIndex]);

    const showArrows = slides.length > 1;
    const currentSrc = slides[slideIndex] ?? FALLBACK_IMAGE_URL;

    return (
        <>
            <div className="relative group">
                {/* ✨ Decorative background glow on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF7D00] to-[#7A4FFF] rounded-[1.5rem] opacity-0 group-hover:opacity-20 blur transition duration-500" />
                
                <motion.div
                    whileHover={{ y: -8 }}
                    className="relative overflow-hidden rounded-[1.4rem] border border-zinc-200/80 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-2xl hover:border-zinc-300"
                >
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void openPortfolioDetail();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                void openPortfolioDetail();
                            }
                        }}
                        className="group/carousel relative block h-[12rem] w-full cursor-pointer overflow-hidden bg-zinc-100 text-left outline-none"
                        aria-label="포트폴리오 상세 보기"
                    >
                        <img
                            src={currentSrc}
                            alt={data.nickname}
                            onError={(e) => {
                                if (e.currentTarget.src !== FALLBACK_IMAGE_URL) {
                                    e.currentTarget.src = FALLBACK_IMAGE_URL;
                                }
                            }}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />

                        {/* 🛠 Work Style Badge */}
                        <div className="absolute left-3 top-3 z-20 flex gap-1.5">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase backdrop-blur-md border shadow-sm flex items-center gap-1 ${
                                data.workStyle === 'ONLINE' ? 'bg-zinc-950/80 text-white border-white/20' : 
                                data.workStyle === 'OFFLINE' ? 'bg-white/90 text-zinc-900 border-zinc-200' : 
                                'bg-[#FF7D00]/90 text-white border-[#FF7D00]/20'
                            }`}>
                                <span className="text-[8px] opacity-60 font-bold">작업 형태:</span>
                                {data.workStyle === 'ONLINE' ? '온라인' : data.workStyle === 'OFFLINE' ? '오프라인' : '하이브리드'}
                            </span>
                        </div>

                        {/* 🎯 Heart Button */}
                        <button
                            type="button"
                            onClick={handleBookmarkToggle}
                            disabled={bookmarkLoading}
                            aria-label={isBookmarked ? "관심 프리랜서 해제" : "관심 프리랜서 추가"}
                            aria-pressed={isBookmarked}
                            className={`absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border shadow-xl transition-all active:scale-90 ${
                                isBookmarked
                                    ? 'bg-white border-red-50 text-red-500'
                                    : 'bg-zinc-950/60 backdrop-blur-md border-white/20 text-white hover:bg-white hover:text-red-500'
                            }`}
                        >
                            <Heart size={18} className={isBookmarked ? "fill-current" : ""} />
                        </button>

                        {portfolioLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px] z-40">
                                <Loader2 className="h-8 w-8 animate-spin text-[#FF7D00]" />
                            </div>
                        )}

                        {showArrows && (
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-20">
                                <button
                                    onClick={goPrev}
                                    className="h-8 w-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-zinc-200 shadow-md hover:bg-white transition-colors"
                                >
                                    <ChevronLeft size={16} strokeWidth={3} />
                                </button>
                                <button
                                    onClick={goNext}
                                    className="h-8 w-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-zinc-200 shadow-md hover:bg-white transition-colors"
                                >
                                    <ChevronRight size={16} strokeWidth={3} />
                                </button>
                            </div>
                        )}

                        {/* 👁️ VIEW PROFILE Overlay (Hover) */}
                        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300">
                             <motion.div 
                                 initial={{ scale: 0.9, opacity: 0 }}
                                 animate={{ scale: 1, opacity: 1 }}
                                 whileHover={{ scale: 1.05 }}
                                 className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 shadow-2xl flex items-center gap-2 group/btn"
                             >
                                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white drop-shadow-md">프로필 상세보기</span>
                                 <div className="bg-[#7A4FFF] p-1 rounded-full text-white shadow-lg group-hover/btn:translate-x-0.5 transition-transform">
                                     <ChevronRight size={12} strokeWidth={3} />
                                 </div>
                             </motion.div>
                        </div>

                        {/* Image overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none opacity-60" />
                    </div>

                    <Link href={`/client/freelancers/${data.id}`} className="block">
                        <div className="p-5">
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* 👤 Small Profile Avatar */}
                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 shadow-sm">
                                        <img 
                                            src={data.profileImageUrl || FALLBACK_IMAGE_URL} 
                                            alt={data.nickname} 
                                            className="h-full w-full object-cover shadow-inner"
                                        />
                                    </div>

                                    <div className="min-w-0 flex flex-col items-start">
                                        <div className="mb-1 flex items-center gap-2">
                                            <div className="flex items-center text-[11px] font-bold text-[#FF7D00] bg-orange-50 px-1.5 py-0.5 rounded-md">
                                                <Star size={11} fill="currentColor" className="mr-1" />
                                                <span className="font-sans">{(Math.round((data.averageRating || 0) * 10) / 10).toFixed(1)}</span>
                                            </div>
                                            <span className="shrink-0 rounded-md bg-[#7A4FFF]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#7A4FFF] ring-1 ring-[#7A4FFF]/20">
                                                {data.gradeName || '일반 요원'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 max-w-full">
                                            <h3 className="truncate text-[18px] font-bold tracking-tight text-zinc-900 group-hover:text-[#FF7D00] transition-colors">
                                                {data.nickname}
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="mb-5 line-clamp-2 text-[13px] font-medium leading-[1.6] text-zinc-500 h-[2.6rem]">
                                {data.introduction}
                            </p>

                            <div className="flex flex-wrap gap-1.5 mb-6">
                                {data.skills.slice(0, 5).map((skill) => (
                                    <span
                                        key={skill.id}
                                        className="px-2 py-1 rounded-md bg-zinc-50 border border-zinc-100 text-[11px] font-bold uppercase text-zinc-500 tracking-tight hover:bg-zinc-100 transition-colors"
                                    >
                                        {skill.name}
                                    </span>
                                ))}
                                {data.skills.length > 5 && (
                                    <span className="px-2 py-1 rounded-md bg-zinc-50 border border-zinc-100 text-[11px] font-bold uppercase text-zinc-300">
                                        +{data.skills.length - 5}
                                    </span>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-start mb-3 text-[11px] font-black text-[#7A4FFF]">
                                    <span className="text-[9px] opacity-60 mr-1.5 uppercase font-mono tracking-widest text-zinc-400">희망시급:</span>
                                    {data.hourlyRate != null ? `₩${data.hourlyRate.toLocaleString()}` : "—"}
                                </div>
                                <div className="flex items-center text-[11px] font-bold text-zinc-400 group-hover:text-zinc-600 transition-colors">
                                    <MapPin size={12} className="mr-1.5 text-zinc-300" />
                                    {data.location}
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            </div>
            {portalReady &&
                portfolioModal != null &&
                createPortal(
                    <PortfolioDetailModal
                        portfolio={portfolioModal}
                        initialImageIndex={portfolioModalImageIndex}
                        onClose={() => setPortfolioModal(null)}
                        readOnly
                        fullProfileHref={`/client/freelancers/${data.id}`}
                        authorNickname={data.nickname}
                        authorProfileImage={data.profileImageUrl}
                        authorRating={data.averageRating}
                        authorGradeName={data.gradeName}
                    />,
                    document.body
                )}
        </>
    );
}