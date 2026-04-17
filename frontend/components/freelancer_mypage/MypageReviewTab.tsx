'use client';

import { Star } from 'lucide-react';

interface MypageReviewTabProps {
    reviews: any[];
    profile: any;
}

export default function MypageReviewTab({ reviews, profile }: MypageReviewTabProps) {
    // 리뷰 상세 점수 평균 계산
    const aggr = reviews.length > 0
        ? reviews.reduce(
            (acc, r) => ({
                workQuality: acc.workQuality + (Number(r.workQuality) || 0),
                deadline: acc.deadline + (Number(r.deadline) || 0),
                communication: acc.communication + (Number(r.communication) || 0),
                expertise: acc.expertise + (Number(r.expertise) || 0),
            }),
            { workQuality: 0, deadline: 0, communication: 0, expertise: 0 }
        )
        : { workQuality: 0, deadline: 0, communication: 0, expertise: 0 };
    
    const count = reviews.length || 1; // 0으로 나누기 방지
    const avgWorkQuality = reviews.length > 0 ? (aggr.workQuality / count) : 0;
    const avgDeadline = reviews.length > 0 ? (aggr.deadline / count) : 0;
    const avgCommunication = reviews.length > 0 ? (aggr.communication / count) : 0;
    const avgExpertise = reviews.length > 0 ? (aggr.expertise / count) : 0;

    return (
        <div className="space-y-8">
            <div className="bg-zinc-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
                <div className="absolute right-0 top-0 opacity-10"><Star size={200} /></div>
                <h3 className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 mb-2">Total_Performance_Score</h3>
                <div className="flex items-end gap-4 mb-2">
                    <span className="text-5xl font-black">{profile?.averageRating?.toFixed(1) || '0.0'}</span>
                    <div className="flex pb-2 text-[#FF7D00]">
                        {[...Array(5)].map((_, idx) => (
                            <Star key={idx} size={20} fill={idx < Math.floor(profile?.averageRating || 0) ? "currentColor" : "none"} />
                        ))}
                    </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase">Based on <strong className="text-white">{profile?.reviewCount || 0}</strong> completed missions</p>
                <div className="flex gap-4 mt-8 pt-6 border-t border-zinc-800 flex-wrap">
                    <div className="flex-1 min-w-[70px]"><p className="text-[10px] text-zinc-500 font-bold mb-1 line-clamp-1">작업 품질</p>
                        <div className="h-1.5 bg-zinc-800 rounded-full"><div className="h-full bg-[#7A4FFF] rounded-full transition-all duration-1000" style={{ width: `${(avgWorkQuality / 5) * 100}%` }}></div></div>
                    </div>
                    <div className="flex-1 min-w-[70px]"><p className="text-[10px] text-zinc-500 font-bold mb-1 line-clamp-1">일정 준수</p>
                        <div className="h-1.5 bg-zinc-800 rounded-full"><div className="h-full bg-[#FF7D00] rounded-full transition-all duration-1000" style={{ width: `${(avgDeadline / 5) * 100}%` }}></div></div>
                    </div>
                    <div className="flex-1 min-w-[70px]"><p className="text-[10px] text-zinc-500 font-bold mb-1 line-clamp-1">의사 소통</p>
                        <div className="h-1.5 bg-zinc-800 rounded-full"><div className="h-full bg-[#34d399] rounded-full transition-all duration-1000" style={{ width: `${(avgCommunication / 5) * 100}%` }}></div></div>
                    </div>
                    <div className="flex-1 min-w-[70px]"><p className="text-[10px] text-zinc-500 font-bold mb-1 line-clamp-1">전문성</p>
                        <div className="h-1.5 bg-zinc-800 rounded-full"><div className="h-full bg-[#ec4899] rounded-full transition-all duration-1000" style={{ width: `${(avgExpertise / 5) * 100}%` }}></div></div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="font-black text-sm text-zinc-900 mb-4 flex items-center gap-2">최근 리뷰 <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full text-[10px]">{reviews.length}</span></h3>
                {reviews.length === 0 ? (
                    <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                        <p className="text-zinc-400 text-xs font-mono font-bold tracking-widest uppercase">No_Feedback_Yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((r, i) => (
                            <div key={r.id || i} className="p-6 border border-zinc-100 bg-zinc-50 rounded-2xl hover:bg-white hover:border-zinc-200 transition-colors shadow-sm">
                                <div className="flex items-center gap-1 text-[#FF7D00] mb-3">
                                    {[...Array(5)].map((_, idx) => (
                                        <Star key={idx} size={14} fill={idx < Math.floor(r.averageScore) ? "currentColor" : "none"} strokeWidth={1.5} />
                                    ))}
                                    <span className="font-black text-sm text-zinc-900 ml-2">{r.averageScore}</span>
                                </div>
                                <p className="text-sm text-zinc-600 leading-relaxed font-medium">{r.comment}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
