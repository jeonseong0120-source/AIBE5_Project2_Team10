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
    const skillList = data.skills || [];

    const handleViewMission = () => {
        const id = data.projectId || data.id;
        if (id) {
            router.push(`/projects/${id}`);
        }
    };

    // [수정] 봇 리뷰 반영: 백엔드 ProjectStatus Enum 값에 맞춘 동적 배지 스타일 및 텍스트 렌더링
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'OPEN':
                return { text: '모집중', classes: 'bg-dn-orange/10 text-dn-orange' };
            case 'IN_PROGRESS':
                return { text: '진행중', classes: 'bg-blue-50 text-blue-600' };
            case 'COMPLETED':
                return { text: '완료됨', classes: 'bg-green-50 text-green-600' };
            case 'CLOSED':
                return { text: '마감됨', classes: 'bg-zinc-100 text-zinc-500' };
            default:
                return { text: status || 'OPEN', classes: 'bg-dn-orange/10 text-dn-orange' };
        }
    };

    const statusConfig = getStatusConfig(data.status);

    return (
        <motion.div
            onClick={handleViewMission}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)' }}
            className="group bg-white border border-zinc-200 rounded-4xl p-6 transition-all cursor-pointer hover:border-dn-purple/30"
        >
            <div className="flex flex-col md:flex-row gap-6">
                {/* 좌측 정보 */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-tighter ${statusConfig.classes}`}>
                            {statusConfig.text}
                        </span>
                        <span className="text-zinc-300 font-mono text-[10px] tracking-widest">{data.createdAt || data.deadline}</span>
                    </div>

                    <h2 className="text-xl font-black mb-2 group-hover:text-dn-purple transition-colors">{data.projectName || data.title}</h2>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                        <div className="flex items-center gap-1 text-zinc-500 text-xs font-bold">
                            <ShieldCheck size={14} className="text-dn-purple" /> {data.companyName || data.company || 'Private Client'}
                        </div>
                        <div className="flex items-center gap-1 text-zinc-400 text-xs font-mono font-bold">
                            <MapPin size={14} /> {data.location || "Remote"}
                        </div>
                        <div className="flex items-center gap-1 text-zinc-400 text-xs font-mono font-bold">
                            <Calendar size={14} /> ~ {data.deadline || data.period}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {skillList.length > 0 ? (
                            skillList.map((skillName: string, idx: number) => (
                                <span
                                    key={idx}
                                    className="px-2.5 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-[10px] font-bold text-zinc-400 uppercase tracking-tighter font-mono group-hover:border-dn-purple/30 group-hover:text-zinc-600 transition-colors"
                                >
                                    #{skillName}
                                </span>
                            ))
                        ) : (
                            <span className="text-[10px] font-mono text-zinc-300 italic">No_Skills_Attached</span>
                        )}
                    </div>
                </div>

                {/* 우측 금액 및 액션 */}
                <div className="flex flex-col justify-between items-end md:w-48 border-t md:border-t-0 md:border-l border-zinc-100 pt-4 md:pt-0 md:pl-6">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-widest mb-1">Estimated_Budget</p>
                        <p className="text-2xl font-black text-zinc-900 font-mono tracking-tighter">
                            <span className="text-dn-orange text-sm mr-1">₩</span>
                            {((data.budget || 0) / 10000).toLocaleString()}만
                        </p>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="w-full mt-4 bg-zinc-900 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-dn-purple transition-all"
                    >
                        VIEW_MISSION <ArrowUpRight size={14} />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
