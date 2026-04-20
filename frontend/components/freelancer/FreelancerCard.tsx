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
}

export default function FreelancerCard({ data }: Props) {
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

    // 🎯 [추가] 북마크 상태 및 로딩 (상세 페이지와 동일한 로직)
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);

    useEffect(() => {
        setPortalReady(true);
    }, []);

    // 🎯 [핵심] 카드 로드 시 찜 목록을 가져와서 현재 프리랜서가 있는지 대조 (배신 방지 로직)
    useEffect(() => {
        setSlideIndex(0);

        const checkBookmarkStatus = async () => {
            const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;
            if (!token) return;

            try {
                // 상세 페이지와 동일하게 size=1000으로 전체 목록 확인
                const res = await api.get('/v1/bookmarks/freelancers?size=1000');
                const bookmarkList = res.data.content || [];
                // 현재 카드 데이터의 id(profileId)가 목록에 있는지 확인
                const isMarked = bookmarkList.some((b: any) => Number(b.profileId) === Number(data.id));
                setIsBookmarked(isMarked);
            } catch (e) {
                console.error("Card Bookmark Check Failed:", e);
            }
        };

        checkBookmarkStatus();
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
            <div className="relative p-0.5">
                <motion.div
                    whileHover={{ y: -6 }}
                    className="group relative overflow-hidden rounded-[1.25rem] border border-zinc-200/90 bg-white p-3 shadow-sm transition-shadow duration-300 hover:shadow-xl"
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
                        className="group/carousel relative block h-[11.7rem] w-full cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 text-left outline-none ring-1 ring-zinc-200/60 focus-visible:ring-2 focus-visible:ring-[#7A4FFF] focus-visible:ring-offset-2 sm:h-[12.6rem] md:h-[13.5rem]"
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
                            className="pointer-events-none h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        />

                        {/* 🎯 [리뷰 반영] 북마크 버튼 - 접근성 속성 추가 */}
                        <button
                            type="button"
                            onClick={handleBookmarkToggle}
                            disabled={bookmarkLoading}
                            aria-label={isBookmarked ? 'Unbookmark freelancer' : 'Bookmark freelancer'}
                            aria-pressed={isBookmarked}
                            className={`absolute right-2.5 top-2.5 z-30 flex h-9 w-9 items-center justify-center rounded-full border shadow-lg transition-all active:scale-90 ${
                                isBookmarked
                                    ? 'bg-white border-red-100 text-red-500'
                                    : 'bg-zinc-950/80 border-white/20 text-white hover:bg-white hover:text-red-500'
                            }`}
                        >
                            <Heart
                                size={18}
                                className={isBookmarked ? "fill-current" : ""}
                            />
                        </button>

                        {portfolioLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
                                <Loader2 className="h-8 w-8 animate-spin text-[#7A4FFF]" aria-hidden />
                            </div>
                        )}

                        {showArrows && (
                            <>
                                <button
                                    type="button"
                                    aria-label="이전 포트폴리오"
                                    onClick={goPrev}
                                    className="pointer-events-auto absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200/80 bg-white/95 text-zinc-800 shadow-md opacity-0 group-hover/carousel:opacity-95 transition-opacity hover:bg-white hover:opacity-100"
                                >
                                    <ChevronLeft size={20} strokeWidth={2.5} />
                                </button>
                                <button
                                    type="button"
                                    aria-label="다음 포트폴리오"
                                    onClick={goNext}
                                    className="pointer-events-auto absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200/80 bg-white/95 text-zinc-800 shadow-md opacity-0 group-hover/carousel:opacity-95 transition-opacity hover:bg-white hover:opacity-100"
                                >
                                    <ChevronRight size={20} strokeWidth={2.5} />
                                </button>
                            </>
                        )}
                    </div>

                    <Link href={`/client/freelancers/${data.id}`} className="mt-1 block cursor-pointer">
                        <div className="flex min-h-[12.5rem] flex-col px-2 pb-6 pt-5 sm:min-h-[13rem] md:min-h-[13.5rem]">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="font-bold tracking-tight text-zinc-900">{data.nickname}</h3>

                                <div className="flex items-center text-sm font-bold text-[#FF7D00]">
                                    <Star size={14} fill="currentColor" />
                                    <span className="ml-1 font-mono">{data.averageRating.toFixed(1)}</span>
                                </div>
                            </div>

                            <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-zinc-500">{data.introduction}</p>

                            <div className="mb-4 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                                {data.skills.slice(0, 8).map((skill) => (
                                    <span
                                        key={skill.id}
                                        className="rounded-md border border-orange-100 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold font-mono uppercase text-[#FF7D00]"
                                    >
                                    {skill.name}
                                </span>
                                ))}
                                {data.skills.length > 8 && (
                                    <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-black font-mono text-zinc-500">
                                    +{data.skills.length - 8}
                                </span>
                                )}
                            </div>

                            <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4 text-xs font-mono font-bold text-zinc-500">
                                <div className="flex items-center">
                                    <MapPin size={12} className="mr-1 text-zinc-400" />
                                    {data.location}
                                </div>

                                <div className="text-[#7A4FFF]">₩{data.hourlyRate.toLocaleString()}</div>
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
                    />,
                    document.body
                )}
        </>
    );
}