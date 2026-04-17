'use client';

import { Plus, Image as ImageIcon } from 'lucide-react';

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
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black tracking-tighter">포트폴리오</h2>
                    <p className="text-[10px] text-zinc-400 font-mono uppercase mt-1">SHOWCASE_YOUR_MISSIONS</p>
                </div>
                <button 
                    onClick={() => { 
                        setPortfolioForm(emptyPortfolioForm); 
                        setPortfolioSkillSearchQuery(''); 
                        setIsPortfolioModalOpen(true); 
                    }} 
                    className="h-10 px-5 bg-[#7A4FFF] hover:bg-purple-600 shadow-md text-white rounded-xl text-[10px] font-black transition-colors font-mono tracking-widest uppercase flex items-center gap-2"
                >
                    <Plus size={14} /> 새 작업물 등록
                </button>
            </div>

            {portfolios.length === 0 ? (
                <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    <ImageIcon className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-zinc-500 font-black text-sm mb-2">등록된 포트폴리오(작업물)가 없습니다.</h3>
                    <p className="text-zinc-400 text-xs font-mono">강점을 어필할 프로젝트 결과물을 등록하세요.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portfolios.map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => { setActiveImageIndex(0); setSelectedPortfolio(p); }} 
                            className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white group cursor-pointer hover:border-[#FF7D00] hover:shadow-xl transition-all flex flex-col"
                        >
                            <div className="w-full aspect-[4/3] bg-zinc-100 overflow-hidden relative border-b border-zinc-100">
                                <img
                                    src={p.thumbnailUrl || p.portfolioImages?.[0] || "https://placehold.co/400x300?text=No+Image"}
                                    alt="thumb"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => { e.currentTarget.src = "https://placehold.co/400x300?text=No+Image" }}
                                />
                            </div>
                            <div className="p-4 flex flex-col flex-1 bg-white">
                                <h3 className="font-black text-sm mb-1 leading-tight text-zinc-900 group-hover:text-[#FF7D00] transition-colors line-clamp-1">{p.title}</h3>
                                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-2 flex-1">{p.desc}</p>
                                {p.skills && p.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-2 border-t border-zinc-100">
                                        {p.skills.slice(0, 2).map((s: any, idx: number) => {
                                            const sId = s.skillId || s.id;
                                            return (
                                                <span key={`p-skill-${sId || idx}-${idx}`} className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-bold">#{s.name}</span>
                                            );
                                        })}
                                        {p.skills.length > 2 && <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-bold">+{p.skills.length - 2}</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
