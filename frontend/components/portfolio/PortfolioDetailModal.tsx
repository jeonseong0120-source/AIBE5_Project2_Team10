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
    Star,
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
    authorNickname?: string;
    authorProfileImage?: string;
    authorRating?: number;
    authorGradeName?: string;
};

export default function PortfolioDetailModal({
    portfolio,
    onClose,
    readOnly = true,
    initialImageIndex = 0,
    onEdit,
    onDelete,
    fullProfileHref,
    authorNickname,
    authorProfileImage,
    authorRating,
    authorGradeName,
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
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
                    {/* 🎭 Backdrop - Click to close */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm"
                    />

                    <motion.div
                        key={portfolio.id}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ 
                            type: 'spring',
                            damping: 25,
                            stiffness: 300
                        }}
                        className="relative z-[210] flex h-full max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl md:flex-row"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="portfolio-detail-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-6 top-6 z-[220] rounded-full bg-white/80 p-2.5 text-zinc-900 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:scale-110 active:scale-95"
                            aria-label="닫기"
                        >
                            <X size={20} className="stroke-[2.5px] opacity-80" />
                        </button>

                        {/* LEFT: Image Section - Expanded for landscape feel */}
                        <div className="relative flex min-h-[45%] w-full shrink-0 flex-col bg-zinc-100 md:h-full md:w-[62%]">
                            <div className="flex flex-1 flex-col p-4 pb-3 md:p-6 md:pb-5">
                                <div className="group relative flex flex-1 flex-col overflow-hidden rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60">
                                    <div className="relative flex-1 overflow-hidden rounded-xl bg-zinc-50/50">
                                        <AnimatePresence mode="wait">
                                            <motion.img
                                                key={images[activeImageIndex] || 'fallback'}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.3 }}
                                                src={mainSrc}
                                                alt=""
                                                className="absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] rounded-lg object-cover md:inset-4 md:h-[calc(100%-2rem)] md:w-[calc(100%-2rem)] md:rounded-2xl"
                                            />
                                        </AnimatePresence>

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
                                                    className="absolute left-6 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/40 bg-white/60 p-3 text-zinc-900 shadow-xl backdrop-blur-xl transition-all hover:bg-white hover:scale-110 active:scale-90 md:opacity-0 md:group-hover:opacity-100"
                                                    aria-label="이전 이미지"
                                                >
                                                    <ChevronLeft size={22} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveImageIndex((prev) =>
                                                            prev === images.length - 1 ? 0 : prev + 1
                                                        );
                                                    }}
                                                    className="absolute right-6 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/40 bg-white/60 p-3 text-zinc-900 shadow-xl backdrop-blur-xl transition-all hover:bg-white hover:scale-110 active:scale-90 md:opacity-0 md:group-hover:opacity-100"
                                                    aria-label="다음 이미지"
                                                >
                                                    <ChevronRight size={22} strokeWidth={2.5} />
                                                </button>
                                                <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-black/40 px-4 py-2.5 backdrop-blur-md">
                                                    {images.map((_, idx) => (
                                                        <button
                                                            key={`dot-${idx}`}
                                                            onClick={() => setActiveImageIndex(idx)}
                                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                                idx === activeImageIndex
                                                                    ? 'w-6 bg-white'
                                                                    : 'w-1.5 bg-white/40 hover:bg-white/60'
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
                                <div className="flex shrink-0 justify-center gap-3 overflow-x-auto border-t border-zinc-200/50 bg-zinc-50/80 px-6 py-5 no-scrollbar">
                                    {images.map((img: string, idx: number) => (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${
                                                idx === activeImageIndex
                                                    ? 'ring-2 ring-[#7A4FFF] ring-offset-4 ring-offset-zinc-50 scale-105'
                                                    : 'opacity-50 hover:opacity-100 hover:scale-105'
                                            }`}
                                        >
                                            <img src={img} alt="" className="h-full w-full object-cover" />
                                            {idx === activeImageIndex && (
                                                <div className="absolute inset-0 bg-[#7A4FFF]/10" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Content Section */}
                        <div className="flex flex-1 flex-col overflow-y-auto bg-white thin-scrollbar">
                            <div className="flex flex-1 flex-col px-8 py-10 md:px-12 md:py-12">
                                <div className="flex flex-1 flex-col">
                                    {/* 👤 Author Info */}
                                    {(authorNickname || authorProfileImage) && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mb-8 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* 📸 Profile Image (Interactive) */}
                                                <button
                                                    onClick={() => {
                                                        if (readOnly && fullProfileHref) {
                                                            onClose();
                                                            router.push(fullProfileHref);
                                                        }
                                                    }}
                                                    className={`group relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-zinc-100 shadow-lg ring-1 ring-zinc-100 transition-all duration-500 ${readOnly && fullProfileHref ? 'cursor-pointer hover:scale-105 hover:shadow-purple-100 hover:ring-[#7A4FFF]/30' : 'cursor-default'}`}
                                                >
                                                    <img 
                                                        src={authorProfileImage || 'https://ui-avatars.com/api/?name=User&background=F4F4F5&color=A1A1AA'} 
                                                        alt={authorNickname}
                                                        className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-[#7A4FFF]/0 transition-colors duration-500 group-hover:bg-[#7A4FFF]/5" />
                                                </button>

                                                <div className="flex flex-col gap-1.5">
                                                    {/* 🎖 Grade Badge (Static) */}
                                                    <div className="flex items-center">
                                                        <span className="rounded-full bg-[#7A4FFF] px-2.5 py-1 text-[9px] font-black text-white uppercase tracking-[0.15em] shadow-lg shadow-purple-200/50 ring-1 ring-purple-100/20">
                                                            {authorGradeName || 'EXPERT'}
                                                        </span>
                                                    </div>

                                                    {/* 👤 Nickname (Interactive) */}
                                                    <button
                                                        onClick={() => {
                                                            if (readOnly && fullProfileHref) {
                                                                onClose();
                                                                router.push(fullProfileHref);
                                                            }
                                                        }}
                                                        className={`flex items-center gap-2.5 transition-all duration-300 ${readOnly && fullProfileHref ? 'cursor-pointer hover:text-[#7A4FFF] active:scale-95' : 'cursor-default'}`}
                                                    >
                                                        <p className="text-base font-black text-zinc-900 tracking-tight transition-colors">{authorNickname || 'Unknown Artist'}</p>
                                                        {authorRating != null && (
                                                            <div className="flex items-center gap-1">
                                                                <Star size={12} fill="#7A4FFF" className="text-[#7A4FFF]" />
                                                                <span className="text-sm font-black text-[#7A4FFF] font-mono">{authorRating.toFixed(1)}</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    <h2
                                        id="portfolio-detail-title"
                                        className="mb-6 text-2xl font-black leading-tight tracking-tight text-zinc-950 md:mb-8 md:text-3xl"
                                    >
                                        {portfolio.title}
                                    </h2>



                                    <div className="mb-10 space-y-4 md:mb-12">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-[2px] w-8 bg-[#7A4FFF]" />
                                            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-[#7A4FFF] font-mono">
                                                Project_Overview
                                            </h3>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-zinc-100 group-hover:bg-[#7A4FFF]/20 transition-colors rounded-full" />
                                            <p className="text-[15px] md:text-base font-medium leading-relaxed text-zinc-600 whitespace-pre-wrap pl-2">
                                                {portfolio.desc}
                                            </p>
                                        </div>
                                    </div>

                                    {portfolio.skills && portfolio.skills.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="h-[2px] w-8 bg-[#7A4FFF]" />
                                                <h3 className="text-xs font-black uppercase tracking-[0.25em] text-[#7A4FFF] font-mono">
                                                    Tech_Implementation
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {portfolio.skills.map((s, idx) => (
                                                    <span
                                                        key={`port-detail-skill-${s.skillId ?? s.id ?? idx}`}
                                                        className="cursor-default rounded-xl border border-zinc-200/60 bg-white px-3.5 py-2 text-[12px] font-black text-zinc-600 uppercase font-mono shadow-sm transition-all hover:bg-[#7A4FFF] hover:text-white hover:border-[#7A4FFF] hover:-translate-y-0.5"
                                                    >
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 📦 Minified Metadata at the bottom */}
                                    <div className="flex flex-wrap items-center gap-4 pt-8 mt-4 border-t border-zinc-100/50 text-[11px] text-zinc-400">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={12} className="text-zinc-300" />
                                            <span className="font-bold font-mono text-zinc-400">
                                                {new Date(portfolio.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="w-px h-2.5 bg-zinc-200" />
                                        <div className="flex items-center gap-1.5">
                                            <ImageIcon size={12} className="text-zinc-300" />
                                            <span className="font-bold font-mono text-zinc-400 uppercase">
                                                {images.length || (portfolio.thumbnailUrl ? 1 : 0)} FILES
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 md:mt-16">


                                    {!readOnly && (onEdit || onDelete) && (
                                        <div className="flex flex-col gap-2.5 border-t border-zinc-100 pt-8 sm:flex-row">
                                            {onEdit && (
                                                <button
                                                    type="button"
                                                    onClick={onEdit}
                                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-4 text-xs font-black text-white uppercase tracking-widest shadow-lg transition-all hover:bg-black hover:-translate-y-0.5 active:translate-y-0"
                                                >
                                                    <Edit3 size={14} /> Edit Project
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() => onDelete(portfolio.id)}
                                                    className="flex items-center justify-center rounded-xl bg-red-50 px-6 py-4 text-xs font-black text-red-500 uppercase tracking-widest shadow-sm transition-all hover:bg-red-100 active:scale-95"
                                                    aria-label="삭제"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

    );
}
