'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Image as ImageIcon,
    Trash2,
    X,
} from 'lucide-react';

/** 백엔드 `PortfolioResponse` / 마이페이지 상태와 호환 */
export type PortfolioDetailShape = {
    id: number;
    title: string;
    desc: string;
    thumbnailUrl?: string | null;
    portfolioImages?: string[];
    skills?: { skillId?: number; id?: number; name: string }[];
    createdAt: string;
};

type Props = {
    portfolio: PortfolioDetailShape | null;
    onClose: () => void;
    /** 읽기 전용(클라이언트 메인 등): 하단 편집/삭제 숨김 */
    readOnly?: boolean;
    /** 상세 열 때 강조할 이미지 인덱스 */
    initialImageIndex?: number;
    onEdit?: () => void;
    onDelete?: (id: number) => void;
    /** 읽기 전용일 때 전체 프로필 페이지로 이동할 경로 (예: /client/freelancers/1) */
    fullProfileHref?: string;
};

export default function PortfolioDetailModal({
    portfolio,
    onClose,
    readOnly = true,
    initialImageIndex = 0,
    onEdit,
    onDelete,
    fullProfileHref,
}: Props) {
    const router = useRouter();
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        if (!portfolio) return;
        const imgs = portfolio.portfolioImages ?? [];
        const max = Math.max(0, imgs.length - 1);
        const next = Math.min(Math.max(0, initialImageIndex), max);
        setActiveImageIndex(next);
    }, [portfolio?.id, initialImageIndex]);

    const images = portfolio?.portfolioImages ?? [];
    const mainSrc =
        images[activeImageIndex] ||
        portfolio?.thumbnailUrl ||
        'https://placehold.co/600x400?text=No+Image';
    const showCarousel = images.length > 1;

    return (
        <AnimatePresence>
            {portfolio && (
                <motion.div
                    key={portfolio.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[200] flex h-[100dvh] w-screen flex-col overflow-hidden bg-white md:flex-row md:items-stretch md:overflow-hidden"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="portfolio-detail-title"
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-6 top-6 z-50 rounded-full bg-black/5 p-2.5 text-zinc-900 backdrop-blur-md transition-colors hover:bg-black/10"
                        aria-label="닫기"
                    >
                        <X size={20} className="opacity-70" />
                    </button>

                    <div className="relative flex min-h-[46dvh] w-full shrink-0 flex-col bg-zinc-100 md:h-full md:max-h-[100dvh] md:min-h-0 md:w-[52%]">
                        <div className="flex min-h-0 flex-1 flex-col p-4 pb-3 md:flex-1 md:p-7 md:pb-5">
                            <div className="group relative flex min-h-[38dvh] flex-1 flex-col overflow-hidden rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 md:min-h-0 md:p-4">
                                <div className="relative min-h-[32dvh] flex-1 overflow-hidden rounded-xl bg-zinc-50 md:min-h-0">
                                    <img
                                        src={mainSrc}
                                        alt=""
                                        className="absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] rounded-lg object-cover transition-opacity duration-300 md:inset-3 md:h-[calc(100%-1.5rem)] md:w-[calc(100%-1.5rem)] md:rounded-xl"
                                    />

                                    {showCarousel && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveImageIndex((prev) =>
                                                        prev === 0 ? images.length - 1 : prev - 1
                                                    );
                                                }}
                                                className="absolute left-5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-3 text-zinc-900 shadow-md ring-1 ring-zinc-200/80 backdrop-blur transition-all hover:bg-white md:left-7 md:opacity-0 md:group-hover:opacity-100"
                                                aria-label="이전 이미지"
                                            >
                                                <ChevronLeft size={22} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveImageIndex((prev) =>
                                                        prev === images.length - 1 ? 0 : prev + 1
                                                    );
                                                }}
                                                className="absolute right-5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-3 text-zinc-900 shadow-md ring-1 ring-zinc-200/80 backdrop-blur transition-all hover:bg-white md:right-7 md:opacity-0 md:group-hover:opacity-100"
                                                aria-label="다음 이미지"
                                            >
                                                <ChevronRight size={22} />
                                            </button>
                                            <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-3 py-2 backdrop-blur-md md:bottom-6">
                                                {images.map((_, idx) => (
                                                    <div
                                                        key={`dot-${idx}`}
                                                        className={`h-1.5 rounded-full transition-all ${
                                                            idx === activeImageIndex
                                                                ? 'w-5 bg-white'
                                                                : 'w-1.5 bg-white/60'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        {showCarousel && (
                            <div className="flex shrink-0 justify-center gap-3 overflow-x-auto border-t border-zinc-200/70 bg-zinc-100 px-4 py-4 no-scrollbar md:px-7 md:py-5">
                                {images.map((img: string, idx: number) => (
                                    <button
                                        type="button"
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20 ${
                                            idx === activeImageIndex
                                                ? 'border-zinc-900 shadow-md ring-2 ring-zinc-900 ring-offset-2 ring-offset-zinc-50'
                                                : 'border-transparent bg-white opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={img} alt="" className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-zinc-100 bg-white md:min-h-[100dvh] md:w-[48%] md:border-l md:border-t-0">
                        <div className="flex min-h-0 flex-1 flex-col px-8 py-10 md:min-h-[100dvh] md:px-12 md:py-14">
                            <div className="flex flex-1 flex-col">
                                <h2
                                    id="portfolio-detail-title"
                                    className="mb-6 text-2xl font-black leading-tight tracking-tight text-zinc-900 md:mb-8 md:text-3xl"
                                >
                                    {portfolio.title}
                                </h2>

                                <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-zinc-100 pb-6 text-sm text-zinc-500 md:mb-10 md:gap-6">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-zinc-400" />
                                        <span className="font-medium">
                                            {new Date(portfolio.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ImageIcon size={16} className="text-zinc-400" />
                                        <span className="font-medium">
                                            {images.length || (portfolio.thumbnailUrl ? 1 : 0)} Images
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-8 space-y-4 md:mb-10">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-[#7A4FFF]">
                                        Overview
                                    </h3>
                                    <p className="text-[15px] font-medium leading-relaxed text-zinc-600 whitespace-pre-wrap md:text-base">
                                        {portfolio.desc}
                                    </p>
                                </div>

                                {portfolio.skills && portfolio.skills.length > 0 && (
                                    <div className="space-y-4 pb-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-[#7A4FFF]">
                                            Tech Stack
                                        </h3>
                                        <div className="max-h-52 overflow-y-auto rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3">
                                            <div className="flex flex-wrap gap-2">
                                                {portfolio.skills.map((s, idx) => (
                                                    <span
                                                        key={`port-detail-skill-${s.skillId ?? s.id ?? idx}`}
                                                        className="cursor-default rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-sm transition-colors hover:border-[#7A4FFF]/30 hover:bg-[#7A4FFF]/5 md:px-4 md:py-2 md:text-sm"
                                                    >
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="min-h-[min(28vh,12rem)] flex-1 md:min-h-[10rem]" aria-hidden />
                            </div>

                        {readOnly && fullProfileHref && (
                            <div className="mt-auto shrink-0 border-t border-zinc-100 pt-8 md:pt-10">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        router.push(fullProfileHref);
                                    }}
                                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 text-sm font-black text-zinc-800 transition-colors hover:border-[#7A4FFF] hover:bg-[#7A4FFF]/5 hover:text-[#7A4FFF]"
                                >
                                    프리랜서 프로필 보기
                                </button>
                            </div>
                        )}

                        {!readOnly && (onEdit || onDelete) && (
                            <div className="mt-auto flex shrink-0 flex-col gap-3 border-t border-zinc-100 pt-8 sm:flex-row md:pt-10">
                                {onEdit && (
                                    <button
                                        type="button"
                                        onClick={onEdit}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 text-sm font-black text-white shadow-xl transition-all hover:bg-black hover:shadow-2xl active:translate-y-0 active:shadow-md md:hover:-translate-y-0.5"
                                    >
                                        <Edit3 size={18} /> Edit
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        type="button"
                                        onClick={() => onDelete(portfolio.id)}
                                        className="flex items-center justify-center rounded-2xl bg-red-50 px-6 py-4 text-sm font-black text-red-500 shadow-sm transition-all hover:bg-red-100 active:translate-y-0 active:shadow-sm sm:py-4 md:hover:-translate-y-0.5"
                                        aria-label="삭제"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
