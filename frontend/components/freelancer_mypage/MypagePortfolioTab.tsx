'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Image as ImageIcon, ChevronLeft, ChevronRight, Hash, Code2, ArrowUpRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MypagePortfolioTabProps {
    portfolios: any[];
    setIsPortfolioModalOpen: (val: boolean) => void;
    setPortfolioForm: (form: any) => void;
    setPortfolioSkillSearchQuery: (val: string) => void;
    setSelectedPortfolio: (p: any) => void;
    setActiveImageIndex: (idx: number) => void;
    emptyPortfolioForm: any;
}

export default function MypagePortfolioTab({
    portfolios,
    setIsPortfolioModalOpen,
    setPortfolioForm,
    setPortfolioSkillSearchQuery,
    setSelectedPortfolio,
    setActiveImageIndex,
    emptyPortfolioForm
}: MypagePortfolioTabProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [isChangingPage, setIsChangingPage] = useState(false);
    const scrollTargetRef = useRef<HTMLDivElement>(null);
    const ITEMS_PER_PAGE = 9;

    useEffect(() => { setCurrentPage(1); }, [portfolios.length]);

    useEffect(() => {
        if (currentPage > 1 || isChangingPage) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    const totalPages = Math.ceil(portfolios.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedPortfolios = portfolios.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        if (page === currentPage) return;
        setIsChangingPage(true);
        setCurrentPage(page);
        setTimeout(() => setIsChangingPage(false), 300);
    };

    return (
        <div className="space-y-8" ref={scrollTargetRef}>
            {/* 🏷 Portfolio Header: Premium Dashboard Style */}
            <div className="flex justify-between items-center bg-white/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-zinc-950 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-zinc-200">
                        <ImageIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-zinc-900">나의 포트폴리오</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[12px] text-[#7A4FFF] font-bold tracking-tight flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#7A4FFF] animate-pulse"></span>
                                {portfolios.length}개의 작품 보관됨
                            </span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => { 
                        setPortfolioForm(emptyPortfolioForm); 
                        setPortfolioSkillSearchQuery(''); 
                        setIsPortfolioModalOpen(true); 
                    }} 
                    className="h-12 px-7 bg-zinc-950 hover:bg-[#7A4FFF] shadow-xl shadow-zinc-200 text-white rounded-2xl text-xs font-black transition-all font-mono tracking-widest uppercase flex items-center gap-3 group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" /> 새 프로젝트 추가
                </button>
            </div>

            {portfolios.length === 0 ? (
                <div className="text-center py-28 bg-zinc-50 rounded-[3.5rem] border-2 border-dashed border-zinc-200">
                    <ImageIcon className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                    <h3 className="text-zinc-400 font-black text-sm mb-1 italic tracking-widest font-mono uppercase">등록된 포트폴리오가 없습니다</h3>
                    <p className="text-zinc-300 text-[10px] font-mono">가장 멋진 프로젝트 결과물을 업로드하세요.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={currentPage}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {paginatedPortfolios.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => { setActiveImageIndex(0); setSelectedPortfolio(p); }} 
                                    className="group relative flex flex-col bg-white rounded-[3rem] border border-zinc-100 overflow-hidden hover:border-[#7A4FFF] hover:shadow-[0_30px_60px_-12px_rgba(122,79,255,0.12)] transition-all duration-500 transform hover:-translate-y-3"
                                >
                                    {/* Thumbnail: 7:5 Aspect Ratio */}
                                    <div className="w-full aspect-[7/5] bg-zinc-50 overflow-hidden relative">
                                        <img
                                            src={p.thumbnailUrl || p.portfolioImages?.[0] || "https://placehold.co/800x800?text=No+Image"}
                                            alt={p.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms] ease-out"
                                            onError={(e) => { e.currentTarget.src = "https://placehold.co/800x800?text=Load+Error" }}
                                        />
                                        
                                        {/* Action Overlay */}
                                        <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] flex items-center justify-center">
                                            <div className="bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                <span className="text-zinc-950 text-[10px] font-black font-mono tracking-[0.2em] uppercase">상세 보기</span>
                                                <ArrowUpRight size={14} className="text-[#7A4FFF]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Info (Compact but high visibility) */}
                                    <div className="p-7 flex flex-col items-center text-center">
                                        <h3 className="font-black text-xl leading-tight text-zinc-900 group-hover:text-[#7A4FFF] transition-colors line-clamp-2 max-w-[220px] mb-6 min-h-[3.5rem] flex items-center justify-center tracking-tight">
                                            {p.title}
                                        </h3>
                                        
                                        <div className="flex flex-wrap justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                                            {p.skills && p.skills.slice(0, 8).map((s: any, idx: number) => {
                                                const sId = s.skillId || s.id;
                                                return (
                                                    <span key={`p-skill-${sId || idx}-${idx}`} className="px-3.5 py-1.5 bg-zinc-50 text-zinc-700 border border-zinc-100 rounded-xl text-[10px] font-bold tracking-tight group-hover:border-[#7A4FFF]/30">
                                                        #{s.name}
                                                    </span>
                                                );
                                            })}
                                            {p.skills && p.skills.length > 8 && (
                                                <span className="px-3 py-1.5 bg-zinc-950 text-white rounded-xl text-[10px] font-black">
                                                    +{p.skills.length - 8}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* 🔢 Pagination: Polished Style */}
                    {totalPages >= 1 && (
                        <div className="flex justify-center items-center gap-6 pt-6">
                            <button
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${
                                    currentPage === 1 ? 'text-zinc-200 border-zinc-100' : 'text-zinc-400 border-zinc-200 hover:text-zinc-950 shadow-sm'
                                }`}
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <div className="flex gap-3">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => handlePageChange(i + 1)}
                                        className={`w-12 h-12 rounded-2xl text-[11px] font-black transition-all font-mono tracking-widest ${
                                            currentPage === i + 1 
                                                ? 'bg-zinc-950 text-white shadow-xl scale-110' 
                                                : 'text-zinc-400 hover:text-zinc-950'
                                        }`}
                                    >
                                        {(i + 1).toString().padStart(2, '0')}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${
                                    currentPage === totalPages ? 'text-zinc-200 border-zinc-100' : 'text-zinc-400 border-zinc-200 hover:text-zinc-950 shadow-sm'
                                }`}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
