'use client';

import React, { useState, useEffect } from 'react';
import api from '@/app/lib/axios';
import { Bookmark, MapPin, DollarSign, Calendar, ChevronRight, Loader2, Sparkles, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface BookmarkedProject {
    projectId: number;
    projectName: string;
    companyName: string;
    budget: number;
    deadline: string;
    location: string;
}

export default function MypageBookmarksTab() {
    const router = useRouter();
    const [bookmarks, setBookmarks] = useState<BookmarkedProject[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBookmarks = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/v1/bookmarks/projects?size=1000');
            setBookmarks(data.content || []);
        } catch (error) {
            console.error("Failed to fetch bookmarks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveBookmark = async (projectId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.delete(`/v1/bookmarks/projects/${projectId}`);
            setBookmarks(prev => prev.filter(b => b.projectId !== projectId));
        } catch (error) {
            alert("북마크 해제에 실패했습니다.");
        }
    };

    useEffect(() => {
        fetchBookmarks();
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(val);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="animate-spin text-[#7A4FFF]" size={32} />
                <p className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest">Accessing_Bookmarks...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div>
                <h2 className="text-sm font-black uppercase font-mono tracking-[0.3em] text-zinc-400">Bookmarked_Projects</h2>
                <p className="text-[10px] text-zinc-400 font-mono uppercase mt-1 italic">Missions you have saved for later</p>
            </div>

            {bookmarks.length === 0 ? (
                <div className="bg-zinc-50 rounded-[3rem] p-20 border border-zinc-100 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="p-6 bg-white rounded-full shadow-sm text-zinc-200">
                        <Bookmark size={48} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-2">북마크한 프로젝트가 없습니다.</h3>
                        <p className="text-sm text-zinc-500 font-medium">탐색 페이지에서 관심 있는 프로젝트를 찜해보세요!</p>
                    </div>
                    <button 
                        onClick={() => router.push('/freelancer/explore')}
                        className="px-8 py-4 bg-zinc-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7A4FFF] transition-all font-mono"
                    >
                        Explore_Missions
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {bookmarks.map((project) => (
                            <motion.div
                                key={project.projectId}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => router.push(`/freelancer/projects/${project.projectId}`)}
                                className="group bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm hover:shadow-2xl hover:shadow-purple-200/20 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7A4FFF] opacity-0 group-hover:opacity-[0.03] rounded-full -mr-16 -mt-16 transition-opacity" />
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-50 rounded-full border border-zinc-100 text-[10px] font-black font-mono text-zinc-400 uppercase tracking-widest group-hover:border-[#7A4FFF]/20 group-hover:text-[#7A4FFF] transition-colors">
                                        <Sparkles size={12} /> Mission_{project.projectId}
                                    </div>
                                    <button
                                        onClick={(e) => handleRemoveBookmark(project.projectId, e)}
                                        className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        title="북마크 삭제"
                                    >
                                        <Heart size={16} className="fill-current" />
                                    </button>
                                </div>

                                <h3 className="text-xl font-black text-zinc-900 tracking-tighter mb-4 line-clamp-1 group-hover:text-[#7A4FFF] transition-colors">
                                    {project.projectName}
                                </h3>

                                <p className="text-xs text-zinc-400 font-bold uppercase font-mono tracking-widest italic mb-8">
                                    {project.companyName}
                                </p>

                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-50">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-300 uppercase font-mono">
                                            <DollarSign size={12} /> Budget
                                        </div>
                                        <p className="text-sm font-black text-zinc-900 font-mono tracking-tight">{formatCurrency(project.budget)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-300 uppercase font-mono">
                                            <Calendar size={12} /> Deadline
                                        </div>
                                        <p className="text-sm font-black text-zinc-900 font-mono tracking-tight">{project.deadline}</p>
                                    </div>
                                    <div className="space-y-1 mt-2">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-300 uppercase font-mono">
                                            <MapPin size={12} /> Location
                                        </div>
                                        <p className="text-sm font-black text-zinc-900 font-mono tracking-tight">{project.location?.split(' ')[0] || 'Remote'}</p>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-end text-[#7A4FFF] opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <span className="text-[10px] font-black uppercase font-mono tracking-widest flex items-center gap-2">
                                        View_Details <ChevronRight size={14} />
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
