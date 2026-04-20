'use client';

import { useState, useEffect } from 'react';
import api from '@/app/lib/axios';
import { User, ChevronRight, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BookmarkedFreelancers() {
    const router = useRouter();
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                // 🎯 [수정] 프리랜서 전용 북마크 엔드포인트로 변경 및 size 확장
                const res = await api.get('/v1/bookmarks/freelancers?size=1000');

                // Swagger 규격에 따라 res.data.content 내의 배열을 가져옵니다.
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
        <div className="h-40 flex items-center justify-center text-xs font-black font-mono text-[#FF7D00] animate-pulse uppercase tracking-widest">
            Scanning_Saved_Agents...
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarks.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-zinc-50/50 rounded-[2.5rem] border-2 border-dashed border-zinc-200">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-zinc-100">
                        <Heart className="w-6 h-6 text-zinc-200" />
                    </div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] font-mono">No_Bookmarked_Agents_Found</p>
                    <button
                        onClick={() => router.push('/client/mainpage')}
                        className="mt-4 text-[10px] font-black text-[#FF7D00] underline underline-offset-4 uppercase tracking-widest"
                    >
                        Go_Find_New_Agents
                    </button>
                </div>
            ) : (
                bookmarks.map((bookmark) => {
                    // 🎯 [중요] 서버 응답 필드명 profileId를 사용합니다.
                    const targetId = bookmark.profileId || bookmark.freelancerId;

                    return (
                        <div
                            key={targetId}
                            onClick={() => router.push(`/client/freelancers/${targetId}`)}
                            className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-zinc-100 hover:border-[#FF7D00]/40 hover:shadow-xl hover:shadow-orange-100/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-[#FF7D00] border border-zinc-100 shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
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
                                        <User size={24} />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-black text-zinc-900 group-hover:text-[#FF7D00] transition-colors">
                                            {bookmark.nickname}
                                        </p>
                                        <span className="w-1 h-1 rounded-full bg-zinc-200"></span>
                                        <span className="text-[9px] font-black text-[#FF7D00] bg-orange-50 px-1.5 py-0.5 rounded uppercase font-mono">
                                            Agent
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter line-clamp-1">
                                        {bookmark.introduction || 'Professional Freelancer Dossier'}
                                    </p>
                                </div>
                            </div>
                            <div className="p-2.5 bg-zinc-50 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}