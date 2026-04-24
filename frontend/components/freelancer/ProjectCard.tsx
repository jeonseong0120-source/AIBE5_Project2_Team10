'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowUpRight, ShieldCheck, Heart, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EstimatedBudgetBlock } from '@/components/freelancer/EstimatedBudgetBlock';

interface ProjectCardProps {
    data: any;
    index: number;
    onOpenProject?: (projectId: number) => void;
}

type SkillItem = string | { name: string };

const getSkillName = (skill: SkillItem): string =>
    typeof skill === 'string' ? skill : skill.name;

export default function ProjectCard({ data, index, onOpenProject }: ProjectCardProps) {
    const router = useRouter();
    const [isBookmarked, setIsBookmarked] = useState(false);

    // [수정] 백엔드 로그 확인 결과: projectSkills가 아니라 skills로 오고 있음
    const skillList: SkillItem[] = data.skills || [];

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
            if (onOpenProject) {
                onOpenProject(Number(id));
            } else {
                router.push(`/freelancer/projects/${id}`);
            }
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
            whileHover={{ y: -6, boxShadow: '0 40px 80px -15px rgba(122,79,255,0.12)' }}
            className="group relative bg-white border border-zinc-100 rounded-[3rem] p-8 md:p-12 transition-all cursor-pointer hover:border-[#7A4FFF]/30 overflow-hidden"
        >
            {/* 프리미엄 배경 데코레이션 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#7A4FFF]/[0.03] to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#7A4FFF]/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10 flex flex-col gap-8 md:gap-10">
                {/* 1. 상단 영역: 로고 + 타이틀 + 북마크 */}
                <div className="flex items-start gap-6 md:gap-8">
                    {/* 🏢 Client Logo */}
                    <div className="h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-2xl md:rounded-[1.5rem] border border-zinc-100 bg-zinc-50 shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:shadow-[#7A4FFF]/10 p-1">
                        <img 
                            src={data.logoUrl || `https://ui-avatars.com/api/?name=${data.companyName || 'C'}&background=F4F4F5&color=A1A1AA`} 
                            alt={data.companyName || 'Company logo'}
                            className="h-full w-full object-cover rounded-xl md:rounded-[1.2rem]"
                        />
                    </div>

                    {/* 프로젝트 타이틀 영역 - 대폭 확장 */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl md:text-2xl font-bold group-hover:text-[#7A4FFF] transition-colors tracking-tight leading-tight line-clamp-2 pr-4">
                                {data.projectName || "제목 없는 프로젝트"}
                            </h2>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusConfig.classes}`}>
                                    {statusConfig.text}
                                </span>
                                {dDay && (
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                        dDay.includes('D-') ? 'bg-zinc-950 text-white' : 'bg-red-50 text-red-500 border border-red-100'
                                    }`}>
                                        {dDay}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                            <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-xs md:text-sm">
                                <ShieldCheck size={14} className="text-[#7A4FFF]" />
                                {data.companyName || "개인 클라이언트"}
                            </div>
                            <div className="h-3 w-[1px] bg-zinc-200 hidden sm:block" />
                            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] md:text-xs font-medium">
                                <MapPin size={14} className="text-zinc-300" /> {data.location || "지역 미정"}
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] md:text-xs font-medium">
                                <Calendar size={14} className="text-zinc-300" /> {data.deadline}
                            </div>
                        </div>
                    </div>

                    {/* 북마크 버튼 */}
                    <button 
                        type="button"
                        onClick={() => setIsBookmarked(!isBookmarked)}
                        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                        aria-pressed={isBookmarked}
                        className="bookmark-btn p-3.5 md:p-4 rounded-2xl border border-zinc-100 hover:border-red-100 hover:bg-red-50 text-zinc-200 hover:text-red-500 transition-all active:scale-90 bg-white/50 backdrop-blur-sm shadow-sm shrink-0"
                    >
                        <Heart size={20} className={isBookmarked ? 'fill-red-500 text-red-500' : ''} />
                    </button>
                </div>

                {/* 2. 하단 영역: 기술 스택 + 예산 + 액션 (보더로 구분) */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pt-8 border-t border-zinc-50">
                    {/* 기술 스택 */}
                    <div className="flex flex-wrap gap-2 flex-1">
                        {skillList.slice(0, 8).map((skill, idx: number) => (
                            <span
                                key={`${getSkillName(skill)}-${idx}`}
                                className="px-3.5 py-1.5 bg-zinc-50 border border-zinc-100 rounded-xl text-[11px] font-bold text-zinc-400 uppercase tracking-tight group-hover:border-[#7A4FFF]/20 group-hover:text-[#7A4FFF] hover:bg-white transition-all shadow-sm"
                            >
                                #{getSkillName(skill)}
                            </span>
                        ))}
                        {skillList.length > 8 && (
                           <span className="px-3 py-1.5 bg-zinc-950 text-white rounded-xl text-[9px] font-bold">
                               +{skillList.length - 8}
                           </span>
                        )}
                    </div>

                    {/* 예산 및 액션 버튼 세트 */}
                    <div className="flex items-center gap-6 md:gap-10 shrink-0 w-full md:w-auto justify-between md:justify-end">
                        <EstimatedBudgetBlock budgetWon={data.budget} size="md" align="right" />

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            className="bg-zinc-950 text-white h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl font-bold text-[13px] uppercase tracking-wider flex items-center justify-center gap-3 group-hover:bg-[#7A4FFF] transition-all shadow-xl group-hover:shadow-[#7A4FFF]/20"
                        >
                            상세 정보 확인 <ArrowUpRight size={16} className="group-hover:rotate-45 transition-transform duration-500" />
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
