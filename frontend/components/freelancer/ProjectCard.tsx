'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProjectCardProps {
    data: any;
    index: number;
}

export default function ProjectCard({ data, index }: ProjectCardProps) {
    const router = useRouter();

    // [수정] 백엔드 로그 확인 결과: projectSkills가 아니라 skills로 오고 있음
    const skillList = data.skills || [];

    const handleViewMission = () => {
        // [수정] 로그 확인 결과 projectId 필드가 존재함
        const id = data.projectId || data.id;
        if (id) {
            router.push(`/freelancer/projects/${id}`);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'OPEN':
                return { text: '모집중', classes: 'bg-[#FF7D00]/10 text-[#FF7D00]' };
            case 'IN_PROGRESS':
                return { text: '진행중', classes: 'bg-blue-50 text-blue-600' };
            case 'COMPLETED':
                return { text: '완료됨', classes: 'bg-green-50 text-green-600' };
            case 'CLOSED':
                return { text: '마감됨', classes: 'bg-zinc-100 text-zinc-500' };
            default:
                return { text: status || '모집중', classes: 'bg-[#FF7D00]/10 text-[#FF7D00]' };
        }
    };

    const statusConfig = getStatusConfig(data.status);

    return (
        <motion.div
            onClick={handleViewMission}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.04)' }}
            className="group bg-white border border-zinc-200 rounded-[2.5rem] p-8 transition-all cursor-pointer hover:border-[#7A4FFF]/30"
        >
            <div className="flex flex-col md:flex-row gap-8">
                {/* 좌측 정보 영역 */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase font-mono tracking-tighter ${statusConfig.classes}`}>
                            {statusConfig.text}
                        </span>
                        <span className="text-zinc-300 font-mono text-[10px] tracking-[0.2em]">
                            {data.createdAt?.split('T')[0] || data.deadline}
                        </span>
                    </div>

                    <h2 className="text-2xl font-black mb-3 group-hover:text-[#7A4FFF] transition-colors tracking-tight">
                        {data.projectName || "제목 없는 프로젝트"}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold">
                            <ShieldCheck size={14} className="text-[#7A4FFF]" />
                            {data.companyName || "개인 클라이언트"}
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono font-bold">
                            <MapPin size={14} /> {data.location || "지역 미정"}
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono font-bold">
                            <Calendar size={14} /> 마감: {data.deadline}
                        </div>
                    </div>

                    <div className="max-h-36 overflow-y-auto pr-1">
                        <div className="flex flex-wrap gap-2">
                            {skillList.length > 0 ? (
                                skillList.map((skill: any, idx: number) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-bold text-zinc-400 uppercase tracking-tighter font-mono group-hover:border-[#7A4FFF]/20 group-hover:text-[#7A4FFF] transition-colors"
                                    >
                                        {typeof skill === "object" ? skill.name : skill}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[10px] font-mono text-zinc-300 italic tracking-widest">
                                    [ NO_SKILLS_MAPPED ]
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 우측 예산 및 액션 버튼 */}
                <div className="flex flex-col justify-between items-end md:w-52 border-t md:border-t-0 md:border-l border-zinc-100 pt-6 md:pt-0 md:pl-8">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-widest mb-2 text-right">예상 금액</p>
                        <p className="text-3xl font-black text-zinc-900 font-mono tracking-tighter">
                            <span className="text-[#FF7D00] text-lg mr-1">₩</span>
                            {((data.budget || 0) / 10000).toLocaleString()}만
                        </p>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        className="w-full mt-6 bg-zinc-950 text-white py-4 rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 group-hover:bg-[#7A4FFF] transition-all shadow-lg shadow-zinc-200 group-hover:shadow-[#7A4FFF]/20"
                    >
                        상세 보기 <ArrowUpRight size={16} />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}