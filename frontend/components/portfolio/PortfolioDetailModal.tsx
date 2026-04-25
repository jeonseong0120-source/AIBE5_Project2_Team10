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
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
                    {/* 🎭 Backdrop - Deep Glassmorphism */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
                    />

                    <motion.div
                        key={portfolio.id}
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        transition={{ 
                            type: 'spring',
                            damping: 20,
                            stiffness: 150
                        }}
                        className="relative z-[210] flex h-full max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-[3rem] bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] md:flex-row"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="portfolio-detail-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ❌ Close Button - High Contrast */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-8 top-8 z-[250] rounded-full bg-zinc-950 p-3 text-white shadow-2xl transition-all hover:bg-[#7A4FFF] hover:scale-110 active:scale-95"
                            aria-label="닫기"
                        >
                            <X size={20} className="stroke-[3px]" />
                        </button>

                        {/* LEFT: Visual Showcase Section */}
                        <div className="relative flex min-h-[40%] w-full shrink-0 flex-col bg-zinc-50 md:h-full md:w-[60%] border-r border-zinc-100">
                            <div className="flex flex-1 flex-col p-4 md:p-10">
                                <div className="relative flex flex-1 flex-col overflow-hidden rounded-[2.5rem] bg-zinc-900 shadow-2xl group">
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={images[activeImageIndex] || 'fallback'}
                                            initial={{ opacity: 0, scale: 1.1 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                            src={mainSrc}
                                            alt=""
                                            className="h-full w-full object-contain"
                                        />
                                    </AnimatePresence>

                                    {showCarousel && (
                                        <>
                                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex((p) => p === 0 ? images.length - 1 : p - 1); }}
                                                    className="h-14 w-14 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-xl border border-white/20 text-white shadow-2xl hover:bg-white hover:text-zinc-900 transition-all"
                                                >
                                                    <ChevronLeft size={24} strokeWidth={3} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex((p) => p === images.length - 1 ? 0 : p + 1); }}
                                                    className="h-14 w-14 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-xl border border-white/20 text-white shadow-2xl hover:bg-white hover:text-zinc-900 transition-all"
                                                >
                                                    <ChevronRight size={24} strokeWidth={3} />
                                                </button>
                                            </div>
                                            
                                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/10">
                                                {images.map((_, idx) => (
                                                    <div
                                                        key={`dot-${idx}`}
                                                        className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeImageIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/20'}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {showCarousel && (
                                <div className="flex shrink-0 justify-center gap-4 overflow-x-auto bg-white/50 border-t border-zinc-100 px-10 py-8 no-scrollbar">
                                    {images.map((img: string, idx: number) => (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl transition-all duration-500 ${idx === activeImageIndex ? 'ring-4 ring-[#7A4FFF] ring-offset-4 ring-offset-white scale-110' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
                                        >
                                            <img src={img} alt="" className="h-full w-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Detailed Content Section */}
                        <div className="flex flex-1 flex-col overflow-y-auto bg-white">
                            <div className="flex flex-1 flex-col px-10 py-12 md:px-16 md:py-16">
                                
                                {/* 👤 Premium Author Card */}
                                {(authorNickname || authorProfileImage) && (
                                    <div className="mb-12 p-6 rounded-[2rem] bg-zinc-50 border border-zinc-100 flex items-center justify-between group/author">
                                        <div className="flex items-center gap-5">
                                            <button
                                                onClick={() => { if (readOnly && fullProfileHref) { onClose(); router.push(fullProfileHref); } }}
                                                className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-xl ring-2 ring-white group-hover/author:scale-105 transition-transform duration-500"
                                            >
                                                <img src={authorProfileImage || 'https://ui-avatars.com/api/?name=User&background=F4F4F5&color=A1A1AA'} alt={authorNickname} className="h-full w-full object-cover" />
                                            </button>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-white bg-[#7A4FFF] px-2 py-0.5 rounded-md tracking-widest uppercase">
                                                        {authorGradeName || 'NORMAL'}
                                                    </span>
                                                    {authorRating != null && (
                                                        <div className="flex items-center gap-1 text-[#7A4FFF]">
                                                            <Star size={12} fill="currentColor" />
                                                            <span className="text-xs font-black">{authorRating.toFixed(1)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => { if (readOnly && fullProfileHref) { onClose(); router.push(fullProfileHref); } }}
                                                    className="text-lg font-black text-zinc-900 tracking-tight hover:text-[#7A4FFF] transition-colors"
                                                >
                                                    {authorNickname}
                                                </button>
                                            </div>
                                        </div>
                                        {readOnly && fullProfileHref && (
                                            <button
                                                onClick={() => { onClose(); router.push(fullProfileHref); }}
                                                className="h-12 w-12 flex items-center justify-center rounded-full bg-white text-zinc-400 hover:text-[#7A4FFF] hover:shadow-lg transition-all"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-12">
                                    <div className="space-y-4">
                                        <h1 id="portfolio-detail-title" className="text-4xl font-black text-zinc-950 tracking-tighter leading-tight">
                                            {portfolio.title}
                                        </h1>
                                        <div className="flex items-center gap-6 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-zinc-300" /> {new Date(portfolio.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ImageIcon size={14} className="text-zinc-300" /> {images.length || 1} ASSETS
                                            </div>
                                        </div>
                                    </div>

                                    {/* 📝 Core Overview */}
                                    <div className="space-y-6">
                                        <p className="text-sm font-black text-[#7A4FFF] tracking-[0.1em] uppercase border-b border-zinc-100 pb-4">
                                            핵심 프로젝트 설명
                                        </p>
                                        <div className="text-base text-zinc-600 leading-[1.8] font-medium whitespace-pre-wrap pl-1">
                                            {portfolio.desc}
                                        </div>
                                    </div>

                                    {/* 🛠️ Tech Stack */}
                                    {portfolio.skills && portfolio.skills.length > 0 && (
                                        <div className="space-y-6">
                                            <p className="text-sm font-black text-[#7A4FFF] tracking-[0.1em] uppercase border-b border-zinc-100 pb-4">
                                                핵심 기술 스택
                                            </p>
                                            <div className="flex flex-wrap gap-2.5">
                                                {portfolio.skills.map((s, idx) => (
                                                    <span
                                                        key={`port-detail-skill-${s.skillId ?? s.id ?? idx}`}
                                                        className="px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-[11px] font-black text-zinc-600 uppercase tracking-wider hover:bg-[#7A4FFF] hover:text-white hover:border-[#7A4FFF] transition-all"
                                                    >
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 🕹️ Actions */}
                                    {!readOnly && (onEdit || onDelete) && (
                                        <div className="flex flex-col sm:flex-row gap-3 pt-8 border-t border-zinc-100">
                                            {onEdit && (
                                                <button
                                                    onClick={onEdit}
                                                    className="flex-1 h-16 flex items-center justify-center gap-3 rounded-[1.5rem] bg-zinc-950 text-white text-sm font-black uppercase tracking-widest hover:bg-[#7A4FFF] transition-all active:scale-95 shadow-xl"
                                                >
                                                    <Edit3 size={18} /> 프로젝트 수정
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(portfolio.id)}
                                                    className="h-16 w-16 flex items-center justify-center rounded-[1.5rem] bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                                >
                                                    <Trash2 size={20} />
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
