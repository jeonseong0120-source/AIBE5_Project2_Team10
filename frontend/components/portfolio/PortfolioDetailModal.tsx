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
    Sparkles,
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
    const mainSrc = images[activeImageIndex] || portfolio?.thumbnailUrl || 'https://placehold.co/600x400?text=No+Image';
    const showCarousel = images.length > 1;

    return (
        <AnimatePresence>
            {portfolio && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
                    {/* 🎭 Deep Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
                    />

                    <motion.div
                        key={portfolio.id}
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        className="relative z-[210] flex h-full max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[3rem] bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] md:flex-row"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="portfolio-detail-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ❌ Premium Close Button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-8 top-8 z-[230] rounded-full bg-white/90 p-3 text-zinc-900 shadow-2xl backdrop-blur-xl transition-all hover:bg-white hover:scale-110 active:scale-95 group"
                            aria-label="닫기"
                        >
                            <X size={20} className="stroke-[3px] opacity-80 group-hover:rotate-90 transition-transform duration-500" />
                        </button>

                        {/* 🖼️ Left: Showcase Gallery */}
                        <div className="relative flex min-h-[45%] w-full shrink-0 flex-col bg-zinc-50 md:h-full md:w-[62%]">
                            <div className="flex flex-1 flex-col p-4 md:p-8">
                                <div className="group relative flex flex-1 flex-col overflow-hidden rounded-[2rem] bg-zinc-900 shadow-2xl ring-1 ring-zinc-200/20">
                                    <div className="relative flex-1 overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            <motion.img
                                                key={images[activeImageIndex] || 'fallback'}
                                                initial={{ opacity: 0, scale: 1.05 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                                                src={mainSrc}
                                                alt={portfolio.title}
                                                className="h-full w-full object-contain"
                                            />
                                        </AnimatePresence>

                                        {showCarousel && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1); }}
                                                    className="absolute left-6 top-1/2 z-10 -translate-y-1/2 rounded-2xl bg-white/10 p-4 text-white shadow-2xl backdrop-blur-xl transition-all hover:bg-white hover:text-zinc-950 active:scale-90 md:opacity-0 md:group-hover:opacity-100"
                                                >
                                                    <ChevronLeft size={24} strokeWidth={3} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => prev === images.length - 1 ? 0 : prev + 1); }}
                                                    className="absolute right-6 top-1/2 z-10 -translate-y-1/2 rounded-2xl bg-white/10 p-4 text-white shadow-2xl backdrop-blur-xl transition-all hover:bg-white hover:text-zinc-950 active:scale-90 md:opacity-0 md:group-hover:opacity-100"
                                                >
                                                    <ChevronRight size={24} strokeWidth={3} />
                                                </button>
                                                
                                                {/* Indicators */}
                                                <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2.5 rounded-full bg-black/30 px-5 py-3 backdrop-blur-xl">
                                                    {images.map((_, idx) => (
                                                        <button
                                                            key={`dot-${idx}`}
                                                            onClick={() => setActiveImageIndex(idx)}
                                                            className={`h-1 rounded-full transition-all duration-500 ${idx === activeImageIndex ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Thumbnail Strip */}
                            {showCarousel && (
                                <div className="flex shrink-0 justify-center gap-4 overflow-x-auto border-t border-zinc-100/50 bg-zinc-50/80 px-8 py-6 no-scrollbar">
                                    {images.map((img: string, idx: number) => (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`group relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl transition-all duration-500 ${idx === activeImageIndex ? 'ring-[3px] ring-[#7A4FFF] ring-offset-4 ring-offset-zinc-50 scale-110 shadow-lg' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
                                        >
                                            <img src={img} alt="" className="h-full w-full object-cover" />
                                            <div className={`absolute inset-0 transition-colors ${idx === activeImageIndex ? 'bg-[#7A4FFF]/5' : 'bg-transparent'}`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 📝 Right: Content & Author */}
                        <div className="flex flex-1 flex-col overflow-y-auto bg-white thin-scrollbar relative">
                            <div className="flex flex-1 flex-col px-10 py-12 md:px-14 md:py-16">
                                {/* 👤 Creator Profile Badge (Reverted to Original Style) */}
                                {(authorNickname || authorProfileImage) && (
                                    <div className="mb-10 flex items-center gap-5">
                                        <button
                                            onClick={() => { if (readOnly && fullProfileHref) { onClose(); router.push(fullProfileHref); } }}
                                            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-[1.2rem] bg-zinc-100 shadow-sm transition-transform duration-500 ${readOnly && fullProfileHref ? 'hover:scale-105' : 'cursor-default'}`}
                                        >
                                            <img 
                                                src={authorProfileImage || 'https://ui-avatars.com/api/?name=User&background=F4F4F5&color=A1A1AA'} 
                                                alt={authorNickname}
                                                className="h-full w-full object-cover"
                                            />
                                        </button>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <span className="px-3 py-1 bg-[#7A4FFF] text-[10px] font-black text-white uppercase tracking-widest rounded-lg shadow-lg shadow-purple-100">
                                                    {authorGradeName || '일반'}
                                                </span>
                                                {authorRating != null && (
                                                    <div className="flex items-center gap-1">
                                                        <Star size={12} fill="#7A4FFF" className="text-[#7A4FFF]" />
                                                        <span className="text-[13px] font-black text-[#7A4FFF] font-mono">{authorRating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => { if (readOnly && fullProfileHref) { onClose(); router.push(fullProfileHref); } }}
                                                className={`text-2xl font-black text-zinc-950 tracking-tight transition-colors text-left ${readOnly && fullProfileHref ? 'hover:text-[#7A4FFF]' : 'cursor-default'}`}
                                            >
                                                {authorNickname || '크리에이터'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-12">
                                    {/* Title Section */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] font-mono">Project Case Study</p>
                                        <h2 id="portfolio-detail-title" className="text-4xl font-black leading-[1.1] tracking-tighter text-zinc-950">
                                            {portfolio.title}
                                        </h2>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <p className="text-sm font-black text-[#7A4FFF] tracking-[0.1em] uppercase">프로젝트 핵심 소개</p>
                                            <div className="flex-1 h-px bg-zinc-100" />
                                        </div>
                                        <div className="relative pl-6 border-l-2 border-zinc-100 group">
                                            <div className="absolute -left-[2px] top-0 h-0 w-[2px] bg-[#7A4FFF] transition-all duration-1000 group-hover:h-full" />
                                            <p className="text-[16px] md:text-[17px] font-medium leading-[1.8] text-zinc-700 whitespace-pre-wrap">
                                                {portfolio.desc}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tech Stack */}
                                    {portfolio.skills && portfolio.skills.length > 0 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <p className="text-sm font-black text-[#7A4FFF] tracking-[0.1em] uppercase">적용 기술 역량</p>
                                                <div className="flex-1 h-px bg-zinc-100" />
                                            </div>
                                            <div className="flex flex-wrap gap-2.5">
                                                {portfolio.skills.map((s, idx) => (
                                                    <span
                                                        key={`port-detail-skill-${s.skillId ?? s.id ?? idx}`}
                                                        className="px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-[11px] font-black text-zinc-600 uppercase font-mono shadow-sm transition-all hover:bg-zinc-950 hover:text-white hover:-translate-y-1 active:scale-95"
                                                    >
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer Metadata */}
                                    <div className="flex items-center gap-8 pt-10 border-t border-zinc-50">
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">제작 일자</span>
                                            <div className="flex items-center gap-2 text-zinc-950 font-black font-mono text-sm">
                                                <Calendar size={14} className="text-zinc-300" />
                                                {new Date(portfolio.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">콘텐츠 구성</span>
                                            <div className="flex items-center gap-2 text-zinc-950 font-black font-mono text-sm">
                                                <ImageIcon size={14} className="text-zinc-300" />
                                                {images.length || (portfolio.thumbnailUrl ? 1 : 0)} FILES
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Management Actions */}
                                {!readOnly && (onEdit || onDelete) && (
                                    <div className="mt-20 flex gap-3">
                                        {onEdit && (
                                            <button
                                                type="button"
                                                onClick={onEdit}
                                                className="flex-1 py-5 bg-zinc-900 hover:bg-[#7A4FFF] text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-2xl shadow-zinc-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                                            >
                                                <Edit3 size={16} /> 프로젝트 수정하기
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                type="button"
                                                onClick={() => onDelete(portfolio.id)}
                                                className="w-20 py-5 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl transition-all flex items-center justify-center active:scale-90"
                                                aria-label="삭제"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
