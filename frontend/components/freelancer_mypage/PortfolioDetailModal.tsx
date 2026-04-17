'use client';

import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Calendar, Image as ImageIcon, Edit3, Trash2 } from 'lucide-react';

interface PortfolioDetailModalProps {
    selectedPortfolio: any;
    setSelectedPortfolio: (p: any) => void;
    activeImageIndex: number;
    setActiveImageIndex: (idx: any) => void;
    handleDeletePortfolio: (id: number) => void;
    setIsPortfolioModalOpen: (val: boolean) => void;
    setPortfolioForm: (form: any) => void;
}

export default function PortfolioDetailModal({
    selectedPortfolio,
    setSelectedPortfolio,
    activeImageIndex,
    setActiveImageIndex,
    handleDeletePortfolio,
    setIsPortfolioModalOpen,
    setPortfolioForm
}: PortfolioDetailModalProps) {
    if (!selectedPortfolio) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-[2rem] w-full max-w-[1200px] h-full max-h-[90vh] shadow-2xl relative flex flex-col md:flex-row overflow-hidden"
            >
                {/* 우측 상단 닫기 버튼 */}
                <button onClick={() => { setSelectedPortfolio(null); setActiveImageIndex(0); }} className="absolute top-6 right-6 z-50 p-2.5 bg-black/5 hover:bg-black/10 rounded-full text-zinc-900 transition-colors backdrop-blur-md">
                    <X size={20} className="opacity-70" />
                </button>

                {/* 왼쪽: 이미지 영역 (비율 약 55%) */}
                <div className="w-full md:w-[55%] bg-zinc-50 flex flex-col relative group shrink-0">
                    <div className="flex-1 relative flex items-center justify-center p-8 min-h-[300px]">
                        <img 
                            src={selectedPortfolio.portfolioImages?.[activeImageIndex] || selectedPortfolio.thumbnailUrl || "https://placehold.co/600x400?text=No+Image"} 
                            alt="main_portfolio" 
                            className="max-w-full max-h-full object-contain drop-shadow-sm transition-opacity duration-300" 
                        />
                        
                        {/* 슬라이더 컨트롤 */}
                        {selectedPortfolio.portfolioImages && selectedPortfolio.portfolioImages.length > 1 && (
                            <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev: number) => prev === 0 ? selectedPortfolio.portfolioImages.length - 1 : prev - 1); }} 
                                    className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white backdrop-blur rounded-full text-zinc-900 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev: number) => prev === selectedPortfolio.portfolioImages.length - 1 ? 0 : prev + 1); }} 
                                    className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white backdrop-blur rounded-full text-zinc-900 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 p-2 bg-black/20 backdrop-blur-md rounded-full">
                                    {selectedPortfolio.portfolioImages.map((_: any, idx: number) => (
                                        <div key={`dot-${idx}`} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeImageIndex ? 'bg-white w-4' : 'bg-white/50'}`} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    {selectedPortfolio.portfolioImages && selectedPortfolio.portfolioImages.length > 1 && (
                        <div className="flex gap-3 px-8 pb-8 pt-4 overflow-x-auto no-scrollbar justify-center">
                            {selectedPortfolio.portfolioImages.map((img: string, idx: number) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setActiveImageIndex(idx)} 
                                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${idx === activeImageIndex ? 'border-zinc-900 shadow-md ring-2 ring-zinc-900 ring-offset-2' : 'border-transparent opacity-50 hover:opacity-100 bg-white'}`}
                                >
                                    <img src={img} alt="sub_portfolio" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 오른쪽: 정보 영역 (비율 약 45%) */}
                <div className="w-full md:w-[45%] p-10 md:p-12 flex flex-col border-l border-zinc-100 bg-white overflow-y-auto">
                    <div className="flex-1">
                        <h2 className="text-3xl font-black text-zinc-900 mb-6 leading-tight tracking-tight">{selectedPortfolio.title}</h2>
                        
                        <div className="flex items-center gap-6 text-sm text-zinc-500 mb-10 border-b border-zinc-100 pb-6">
                            <div className="flex items-center gap-2"><Calendar size={16} className="text-zinc-400" /> <span className="font-medium">{new Date(selectedPortfolio.createdAt).toLocaleDateString()}</span></div>
                            <div className="flex items-center gap-2"><ImageIcon size={16} className="text-zinc-400" /> <span className="font-medium">{selectedPortfolio.portfolioImages?.length || 0} Images</span></div>
                        </div>
                        
                        <div className="space-y-4 mb-10">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#7A4FFF]">Overview</h3>
                            <p className="text-[15px] text-zinc-600 leading-relaxed whitespace-pre-wrap font-medium">{selectedPortfolio.desc}</p>
                        </div>

                        {selectedPortfolio.skills && selectedPortfolio.skills.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#7A4FFF]">Tech Stack</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedPortfolio.skills.map((s: any, idx: number) => (
                                        <span 
                                            key={`port-detail-skill-${s.skillId || s.id || idx}`} 
                                            className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-sm font-bold text-zinc-700 hover:border-[#7A4FFF]/30 hover:bg-[#7A4FFF]/5 transition-colors cursor-default shadow-sm"
                                        >
                                            {s.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-12 pt-6 border-t border-zinc-100 flex gap-3">
                        <button onClick={() => {
                            setPortfolioForm({
                                id: selectedPortfolio.id,
                                title: selectedPortfolio.title,
                                desc: selectedPortfolio.desc,
                                thumbnailUrl: selectedPortfolio.thumbnailUrl || '',
                                portfolioImages: selectedPortfolio.portfolioImages || [],
                                skills: selectedPortfolio.skills ? selectedPortfolio.skills.map((s: any) => s.skillId || s.id) : []
                            });
                            setSelectedPortfolio(null);
                            setIsPortfolioModalOpen(true);
                        }} className="flex-1 py-4 bg-zinc-900 hover:bg-black text-white rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md">
                            <Edit3 size={18} /> Edit
                        </button>
                        <button onClick={() => handleDeletePortfolio(selectedPortfolio.id)} className="py-4 px-6 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl text-sm font-black transition-all flex items-center justify-center shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
