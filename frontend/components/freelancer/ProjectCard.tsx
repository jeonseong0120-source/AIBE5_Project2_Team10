'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowUpRight, ShieldCheck, Heart, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ProjectCardProps {
    data: any;
    index: number;
}

export default function ProjectCard({ data, index }: ProjectCardProps) {
    const router = useRouter();
    const [isBookmarked, setIsBookmarked] = useState(false);

    // [수정] 백엔드 로그 확인 결과: projectSkills가 아니라 skills로 오고 있음
    const skillList = data.skills || [];

    // D-Day 계산 로직
    const getDDay = (deadlineStr: string) => {
        if (!deadlineStr) return null;
        const today = new Date();
        const deadline = new Date(deadlineStr);
        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'D-Day';
        if (diffDays < 0) return '마감';
        return `D-${diffDays}`;
    };

    const dDay = getDDay(data.deadline);

    const handleViewMission = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.bookmark-btn')) return;

        const id = data.projectId || data.id;
        if (id) {
            router.push(`/freelancer/projects/${id}`);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'OPEN':
                return { text: '모집중', classes: 'bg-[#FF7D00]/10 text-[#FF7D00] border-[#FF7D00]/20' };
            case 'IN_PROGRESS':
                return { text: '진행중', classes: 'bg-blue-50 text-blue-600 border-blue-100' };
            case 'COMPLETED':
                return { text: '완료됨', classes: 'bg-green-50 text-green-600 border-green-100' };
            case 'CLOSED':
                return { text: '마감됨', classes: 'bg-zinc-100 text-zinc-500 border-zinc-200' };
            default:
                return { text: status || '모집중', classes: 'bg-[#FF7D00]/10 text-[#FF7D00] border-[#FF7D00]/20' };
        }
    };

    const statusConfig = getStatusConfig(data.status);

    return (
        <motion.div
            onClick={handleViewMission}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{ y: -6, boxShadow: '0 30px 60px -12px rgba(0,0,0,0.08)' }}
            className="group relative bg-white border border-zinc-100 rounded-[3rem] p-10 transition-all cursor-pointer hover:border-[#7A4FFF]/30 overflow-hidden"
        >
            {/* 배경 데코레이션 */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#7A4FFF]/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10 flex flex-col xl:flex-row gap-12">
                {/* 🎯 개선된 레이아웃: 로고(왼쪽) + 2줄 정보(오른쪽) */}
                <div className="flex-1">
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                        {/* 🏢 Large Client Logo */}
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[2rem] border border-zinc-100 bg-zinc-50 shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:shadow-[#7A4FFF]/10 p-1">
                            <img 
                                src={data.logoUrl || `https://ui-avatars.com/api/?name=${data.companyName || 'C'}&background=F4F4F5&color=A1A1AA`} 
                                alt={data.companyName}
                                className="h-full w-full object-cover rounded-[1.7rem]"
                            />
                        </div>

                        {/* 두 줄 정보: 프로젝트명 & 클라이언트 정보 */}
                        <div className="flex-1 flex flex-col gap-2 text-center md:text-left overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                                <h2 className="text-2xl md:text-3xl font-black group-hover:text-[#7A4FFF] transition-colors tracking-tight leading-tight truncate">
                                    {data.projectName || "제목 없는 프로젝트"}
                                </h2>
                                <div className="flex items-center justify-center md:justify-start gap-2 shrink-0">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase font-mono tracking-tighter border ${statusConfig.classes}`}>
                                        {statusConfig.text}
                                    </span>
                                    {dDay && (
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black font-mono ${
                                            dDay.includes('D-') ? 'bg-zinc-950 text-white' : 'bg-red-50 text-red-500 border border-red-100'
                                        }`}>
                                            {dDay}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2">
                                <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-sm">
                                    <ShieldCheck size={14} className="text-[#7A4FFF]" />
                                    {data.companyName || "개인 클라이언트"}
                                </div>
                                <div className="h-3 w-[1px] bg-zinc-200 hidden sm:block" />
                                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                                    <MapPin size={14} className="text-zinc-300" /> {data.location || "지역 미정"}
                                </div>
                                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                                    <Calendar size={14} className="text-zinc-300" /> {data.deadline}
                                </div>
                            </div>
                        </div>

                        {/* 북마크 버튼 - 최우측 배치 */}
                        <button 
                            type="button"
                            onClick={() => setIsBookmarked(!isBookmarked)}
                            className="bookmark-btn md:self-start p-4 rounded-2xl border border-zinc-100 hover:border-red-100 hover:bg-red-50 text-zinc-200 hover:text-red-500 transition-all active:scale-90 bg-white/50 backdrop-blur-sm shadow-sm"
                        >
                            <Heart size={20} className={isBookmarked ? 'fill-red-500 text-red-500' : ''} />
                        </button>
                    </div>

                    {/* 기술 스택 영역 */}
                    <div className="flex flex-wrap gap-2">
                        {skillList.slice(0, 8).map((skill: any, idx: number) => (
                            <span
                                key={idx}
                                className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-tighter font-mono group-hover:border-[#7A4FFF]/20 group-hover:text-[#7A4FFF] hover:bg-white transition-all shadow-sm"
                            >
                                #{typeof skill === "object" ? skill.name : skill}
                            </span>
                        ))}
                        {skillList.length > 8 && (
                           <span className="px-3 py-2 bg-zinc-950 text-white rounded-xl text-[9px] font-black font-mono">
                               +{skillList.length - 8}
                           </span>
                        )}
                    </div>
                </div>

                {/* 우측 예산 & 액션 영역 */}
                <div className="flex flex-col justify-between items-end xl:w-72 border-t xl:border-t-0 xl:border-l border-zinc-100 pt-10 xl:pt-0 xl:pl-12">
                    <div className="text-right w-full">
                        <div className="mb-4 flex items-center justify-end gap-2">
                             <span className="text-[10px] font-black text-zinc-300 uppercase font-mono tracking-[0.2em]">Estimated_Budget</span>
                             <div className="h-1.5 w-1.5 rounded-full bg-[#FF7D00] animate-pulse" />
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-4xl md:text-5xl font-black text-zinc-950 font-mono tracking-tighter group-hover:text-[#FF7D00] transition-colors duration-500 italic">
                                <span className="text-[#FF7D00] text-xl mr-1 not-italic">₩</span>
                                {((data.budget || 0) / 10000).toLocaleString()}
                                <span className="text-zinc-300 text-base ml-1 not-italic font-sans">만원</span>
                            </p>
                        </div>
                    </div>

                    <div className="w-full space-y-4">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            className="w-full bg-zinc-950 text-white h-16 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 group-hover:bg-[#7A4FFF] transition-all shadow-2xl shadow-zinc-200 group-hover:shadow-purple-500/20"
                        >
                            Open_Mission <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform duration-500" />
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}