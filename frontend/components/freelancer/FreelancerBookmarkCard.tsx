import { motion } from 'framer-motion';
import { User, Star, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FreelancerBookmarkCardProps {
    freelancer: any;
    idx: number;
    onOpenProposal: (freelancer: any) => void;
    onRemoveBookmark: (profileId: number) => void;
}

export default function FreelancerBookmarkCard({
    freelancer,
    idx,
    onOpenProposal,
    onRemoveBookmark
}: FreelancerBookmarkCardProps) {
    const router = useRouter();

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.05 }} 
            key={freelancer.profileId} 
            className="group bg-white p-8 rounded-[3rem] border border-zinc-100 hover:border-[#FF7D00] hover:shadow-2xl transition-all relative flex flex-col xl:flex-row items-center gap-10"
        >
            {/* 좌측: 아바타 섹션 */}
            <div className="relative group/avatar cursor-pointer shrink-0" onClick={() => router.push(`/client/freelancers/${freelancer.profileId}?bm=1`)}>
                <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-100 border-4 border-white overflow-hidden shadow-xl transition-transform duration-500 group-hover/avatar:scale-105">
                    {freelancer.profileImageUrl ? (
                        <img src={freelancer.profileImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300 bg-zinc-50">
                            <User size={48} />
                        </div>
                    )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-zinc-950 px-3 py-1.5 rounded-xl shadow-lg border-2 border-white">
                    <div className="flex items-center gap-1.5 text-[#FF7D00] font-bold text-[10px]">
                        <Star size={12} fill="#FF7D00" strokeWidth={0} />
                        {(freelancer.averageRating ?? 0).toFixed(1)}
                    </div>
                </div>
            </div>

            {/* 중앙: 정보 및 소개 */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-3xl font-bold text-zinc-950 group-hover:text-[#FF7D00] transition-colors tracking-tight">
                        {freelancer.userName}
                    </h3>
                    <span className="px-3 py-1 bg-zinc-950 text-white text-[9px] font-bold rounded-lg tracking-widest">
                        {freelancer.gradeName}
                    </span>
                </div>
                <p className="text-[13px] font-medium text-zinc-400 line-clamp-2 leading-relaxed mb-6 border-l-4 border-zinc-100 pl-4 py-1 max-w-2xl">
                    "{freelancer.introduction || "혁신적인 결과물을 만드는 검증된 파트너입니다."}"
                </p>
                <div className="flex gap-10">
                     <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-zinc-300 tracking-widest mb-1">리뷰 수</p>
                        <p className="text-sm font-bold text-zinc-900">{freelancer.reviewCount || 0}</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-100 self-center" />
                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-zinc-300 tracking-widest mb-1">완료 프로젝트</p>
                        <p className="text-sm font-bold text-zinc-900">{freelancer.completedProjects || 0}+</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-100 self-center" />
                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-zinc-300 tracking-widest mb-1">상태</p>
                        <p className="text-[10px] font-bold text-green-500">인증된 전문가</p>
                    </div>
                </div>
            </div>

            {/* 우측: 액션 섹션 */}
            <div className="flex flex-col gap-3 min-w-[260px] w-full xl:w-auto xl:border-l xl:border-zinc-50 xl:pl-10">
                <button 
                    onClick={() => onOpenProposal(freelancer)} 
                    className="w-full py-4 bg-zinc-950 text-white hover:bg-[#FF7D00] rounded-2xl text-[13px] font-bold tracking-wider transition-all shadow-xl shadow-zinc-900/10"
                >
                    파트너십 제안하기
                </button>
                <button 
                    onClick={() => router.push(`/client/freelancers/${freelancer.profileId}?bm=1`)} 
                    className="w-full py-4 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 rounded-2xl text-[13px] font-bold tracking-wider transition-all"
                >
                    프로필 상세보기
                </button>
                <button 
                    onClick={() => onRemoveBookmark(freelancer.profileId)} 
                    className="w-full py-2 text-zinc-300 hover:text-red-500 text-[8px] font-bold tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                    <Trash2 size={12} /> 관심 목록에서 제거
                </button>
            </div>
        </motion.div>
    );
}
