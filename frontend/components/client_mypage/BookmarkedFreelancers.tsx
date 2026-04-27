'use client';

import { useState, useEffect } from 'react';
import api from '@/app/lib/axios';
import { User, ChevronRight, Heart, Star, Briefcase, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function BookmarkedFreelancers() {
    const router = useRouter();
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                const res = await api.get('/v1/bookmarks/freelancers?size=1000');
                const data = res.data.content || res.data || [];
                setBookmarks(data);
            } catch (err) {
                console.error("북마크 로드 실패:", err);
                setBookmarks([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBookmarks();
    }, []);

    if (loading) return (
        <div className="h-60 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-[3px] border-orange-100 border-t-[#FF7D00] rounded-full animate-spin" />
            <p className="text-[13px] font-bold text-zinc-400 animate-pulse">
                목록을 불러오는 중…
            </p>
        </div>
    );

    return (
        <div className="flex flex-col gap-4"> {/* 🎯 세로로 쌓이되 가로로 넓게 */}
            {bookmarks.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-zinc-100 shadow-inner">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-6 h-6 text-zinc-200" />
                    </div>
                    <p className="text-[13px] font-bold text-zinc-400 tracking-tight">아직 찜한 프리랜서가 없습니다</p>
                </div>
            ) : (
                bookmarks.map((bookmark, idx) => {
                    const targetId = bookmark.profileId || bookmark.freelancerId;

                    return (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            key={targetId}
                            onClick={() => router.push(`/client/freelancers/${targetId}?bm=1`)}
                            className="group relative flex flex-col md:flex-row items-center gap-6 p-5 bg-white rounded-[2rem] border border-zinc-100 hover:border-[#FF7D00]/30 hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)] transition-all cursor-pointer overflow-hidden"
                        >
                            {/* 1. 프로필 이미지 영역 (왼쪽 고정) */}
                            <div className="relative shrink-0">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.8rem] bg-zinc-50 p-1 border border-zinc-100 shadow-sm group-hover:scale-105 transition-transform duration-500">
                                    <div className="w-full h-full rounded-[1.5rem] overflow-hidden">
                                        {bookmark.profileImageUrl ? (
                                            <img
                                                src={bookmark.profileImageUrl}
                                                alt={bookmark.nickname}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://ui-avatars.com/api/?background=F4F4F5&color=A1A1AA';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                                <User size={32} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* 찜 배지 */}
                                <div className="absolute -top-1 -left-1 w-7 h-7 bg-[#FF7D00] rounded-full shadow-lg flex items-center justify-center border-2 border-white">
                                    <Heart size={12} className="fill-white text-white" />
                                </div>
                            </div>

                            {/* 2. 정보 요약 영역 (가운데 유동적) */}
                            <div className="flex-1 min-w-0 text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                    <h4 className="text-xl font-black text-zinc-900 group-hover:text-[#FF7D00] transition-colors tracking-tighter">
                                        {bookmark.nickname}
                                    </h4>
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <span className="px-3 py-1 bg-zinc-950 text-white text-[11px] font-bold rounded-lg">
                                            인증된 전문가
                                        </span>
                                        <div className="flex items-center text-[#FF7D00] text-sm font-black">
                                            <Star size={14} className="fill-current mr-1" />
                                            {bookmark.averageRating?.toFixed(1) || '0.0'}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm font-medium text-zinc-500 line-clamp-1 italic pr-4">
                                    &quot;{bookmark.introduction || '전략적인 파트너십을 위한 준비된 전문가 요원입니다.'}&quot;
                                </p>

                                <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className="flex items-center text-[12px] font-bold text-zinc-400 tracking-tight">
                                        <Target size={14} className="mr-2 text-zinc-300" /> ID: #{targetId}
                                    </div>
                                    <div className="flex items-center text-[12px] font-bold text-zinc-400 tracking-tight">
                                        <Briefcase size={14} className="mr-2 text-zinc-300" /> {bookmark.completedProjects || 0}건의 프로젝트 완료
                                    </div>
                                </div>
                            </div>

                            {/* 3. 액션 버튼 영역 (오른쪽 고정) */}
                            <div className="shrink-0 flex items-center gap-3">
                                <div className="hidden md:block h-10 w-[1px] bg-zinc-100 mx-2" />
                                <div className="p-4 bg-zinc-50 rounded-[1.5rem] group-hover:bg-[#FF7D00] group-hover:text-white transition-all shadow-sm group-hover:shadow-orange-200">
                                    <ChevronRight size={24} strokeWidth={3} />
                                </div>
                            </div>

                            {/* 배경 장식 선 */}
                            <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-[#FF7D00] transition-all duration-500 group-hover:w-full opacity-30" />
                        </motion.div>
                    );
                })
            )}
        </div>
    );
}