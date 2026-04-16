'use client';

import { useState, useEffect } from 'react';
import api from '@/app/lib/axios';
import { User, ChevronRight, Heart, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BookmarkedFreelancers() {
    const router = useRouter();
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                const res = await api.get('/v1/bookmarks');
                setBookmarks(res.data.content || res.data || []);
            } catch (err) {
                setBookmarks([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBookmarks();
    }, []);

    if (loading) return <div className="h-40 flex items-center justify-center text-xs font-bold text-zinc-400 animate-pulse">데이터 로드 중...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarks.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-zinc-50/50 rounded-3xl border border-dashed border-zinc-200">
                    <Heart className="w-6 h-6 text-zinc-200 mx-auto mb-3" />
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No_Bookmarks_Found</p>
                </div>
            ) : (
                bookmarks.map((bookmark) => (
                    <div
                        key={bookmark.freelancerId}
                        onClick={() => router.push(`/freelancer/${bookmark.freelancerId}`)}
                        className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-zinc-100 hover:border-[#FF7D00]/40 hover:shadow-xl hover:shadow-orange-100/30 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-[#FF7D00] border border-zinc-100 shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                                {bookmark.profileImageUrl ? (
                                    <img src={bookmark.profileImageUrl} className="w-full h-full object-cover" />
                                ) : <User size={20} />}
                            </div>
                            <div>
                                <p className="text-sm font-black text-zinc-900 group-hover:text-[#FF7D00] transition-colors">{bookmark.nickname}</p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{bookmark.mainSkill || 'Professional Developer'}</p>
                            </div>
                        </div>
                        <div className="p-2 bg-zinc-50 rounded-full group-hover:bg-orange-50 transition-colors">
                            <ChevronRight size={16} className="text-zinc-300 group-hover:text-[#FF7D00]" />
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}