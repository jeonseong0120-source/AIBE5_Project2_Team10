'use client';

import { Star, MessageSquare, Award, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface MypageReviewTabProps {
    reviews: any[];
    profile: any;
}

export default function MypageReviewTab({ reviews, profile }: MypageReviewTabProps) {
    const reviewCount = reviews?.length || 0;

    // 🎯 평균 점수 계산 (데이터가 없을 때를 대비한 0 처리)
    const aggr = reviews?.length > 0
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

    const divisor = reviewCount || 1;
    const avgWorkQuality = (aggr.workQuality / divisor).toFixed(1);
    const avgDeadline = (aggr.deadline / divisor).toFixed(1);
    const avgCommunication = (aggr.communication / divisor).toFixed(1);
    const avgExpertise = (aggr.expertise / divisor).toFixed(1);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 📊 성적표 카드 */}
            <div className="bg-zinc-950 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border border-zinc-800">
                <div className="absolute right-[-30px] top-[-30px] opacity-10 text-[#7A4FFF] rotate-12">
                    <Award size={300} strokeWidth={1} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-10">
                        <span className="w-12 h-[3px] bg-[#7A4FFF] rounded-full"></span>
                        <h3 className="text-[13px] font-bold tracking-widest uppercase text-zinc-500">성과 지표</h3>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end gap-8 mb-12">
                        <div className="flex flex-col">
                            <span className="text-7xl md:text-8xl font-black tracking-tighter leading-none text-[#7A4FFF]">
                                {profile?.averageRating?.toFixed(1) || '0.0'}
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex text-[#FF7D00] gap-1">
                                {[...Array(5)].map((_, idx) => (
                                    <Star
                                        key={idx}
                                        size={24}
                                        fill={idx < Math.floor(profile?.averageRating || 0) ? "#FF7D00" : "none"}
                                        className={idx < Math.floor(profile?.averageRating || 0) ? "drop-shadow-[0_0_8px_rgba(255,125,0,0.5)]" : "text-zinc-700"}
                                        strokeWidth={2}
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-zinc-500 font-medium tracking-tight">
                                총 <strong className="text-white text-base">{profile?.reviewCount || 0}</strong>건의 프로젝트를 성공적으로 완료했습니다
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-10 border-t border-zinc-800/50">
                        {[
                            { label: '작업 품질', val: avgWorkQuality, color: 'bg-[#7A4FFF]' },
                            { label: '마감 엄수', val: avgDeadline, color: 'bg-[#FF7D00]' },
                            { label: '커뮤니케이션', val: avgCommunication, color: 'bg-[#34d399]' },
                            { label: '전문 지식', val: avgExpertise, color: 'bg-[#ec4899]' }
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-[12px] text-zinc-500 font-bold tracking-tight">{item.label}</p>
                                    <span className="text-sm text-white font-black">{item.val}</span>
                                </div>
                                <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-[1px]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(Number(item.val) / 5) * 100}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                                        className={`h-full ${item.color} rounded-full`}
                                    ></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 💬 후기 리스트 */}
            <div>
                <div className="flex items-center justify-between mb-8 px-2">
                    <h3 className="font-black text-2xl text-zinc-900 flex items-center gap-4 tracking-tight">
                        <MessageSquare size={24} className="text-[#7A4FFF]" />
                        최근 후기
                    </h3>
                    <div className="h-[1px] flex-1 mx-8 bg-zinc-100 hidden md:block"></div>
                    <span className="px-5 py-2 bg-zinc-950 text-[#7A4FFF] rounded-2xl text-[12px] font-bold tracking-tight">
                        전체 {reviewCount}건
                    </span>
                </div>

                {reviewCount === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100 shadow-inner">
                        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star size={32} className="text-zinc-200" />
                        </div>
                        <p className="text-zinc-400 text-base font-bold tracking-tight">첫 번째 영광을 기다리고 있습니다</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {reviews.map((r, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={r.id || i}
                                className="group p-10 bg-white border border-zinc-100 rounded-[2.5rem] hover:border-[#7A4FFF]/30 hover:shadow-[0_20px_50px_rgba(122,79,255,0.1)] transition-all duration-500 relative"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-1.5 text-[#FF7D00]">
                                        {[...Array(5)].map((_, idx) => (
                                            <Star
                                                key={idx}
                                                size={16}
                                                fill={idx < Math.floor(r.averageScore || 0) ? "#FF7D00" : "none"}
                                                strokeWidth={2}
                                            />
                                        ))}
                                        <span className="font-black text-lg text-zinc-900 ml-4 tracking-tight">
                                            {(r.averageScore || 0).toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-300">
                                        <CheckCircle2 size={16} />
                                        <span className="text-[12px] font-bold text-zinc-400">인증된 클라이언트</span>
                                    </div>
                                </div>

                                <p className="text-base text-zinc-600 leading-relaxed font-medium italic relative">
                                    <span className="text-4xl absolute -left-6 -top-4 text-zinc-100 font-serif">"</span>
                                    {r.comment || "작성된 상세 후기가 없습니다."}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}