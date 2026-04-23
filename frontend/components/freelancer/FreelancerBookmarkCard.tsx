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
            <div className="relative group/avatar cursor-pointer shrink-0" onClick={() => router.push(`/client/freelancers/${freelancer.profileId}`)}>
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
                    <div className="flex items-center gap-1.5 text-[#FF7D00] font-black text-[10px] font-mono">
                        <Star size={12} fill="#FF7D00" strokeWidth={0} />
                        {(freelancer.averageRating ?? 0).toFixed(1)}
                    </div>
                </div>
            </div>

            {/* 중앙: 정보 및 소개 */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-3xl font-black text-zinc-950 group-hover:text-[#FF7D00] transition-colors tracking-tight">
                        {freelancer.userName}
                    </h3>
                    <span className="px-3 py-1 bg-zinc-950 text-white text-[8px] font-black rounded-lg font-mono uppercase tracking-[0.2em]">
                        {freelancer.gradeName}
                    </span>
                </div>
                <p className="text-xs font-medium text-zinc-400 line-clamp-2 italic leading-relaxed mb-6 border-l-4 border-zinc-100 pl-4 py-1 max-w-2xl">
                    "{freelancer.introduction || "혁신적인 결과물을 만드는 검증된 파트너입니다."}"
                </p>
                <div className="flex gap-10">
                    <div className="flex flex-col">
                        <p className="text-[7px] font-black text-zinc-300 uppercase tracking-widest mb-1">Reviews</p>
                        <p className="text-sm font-black text-zinc-900 font-mono italic">{freelancer.reviewCount || 0}</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-100 self-center" />
                    <div className="flex flex-col">
                        <p className="text-[7px] font-black text-zinc-300 uppercase tracking-widest mb-1">Projects</p>
                        <p className="text-sm font-black text-zinc-900 font-mono italic">24+</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-100 self-center" />
                    <div className="flex flex-col">
                        <p className="text-[7px] font-black text-zinc-300 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-[9px] font-black text-green-500 uppercase font-mono">Verified_Expert</p>
                    </div>
                </div>
            </div>

            {/* 우측: 액션 섹션 */}
            <div className="flex flex-col gap-3 min-w-[260px] w-full xl:w-auto xl:border-l xl:border-zinc-50 xl:pl-10">
                <button 
                    onClick={() => onOpenProposal(freelancer)} 
                    className="w-full py-4 bg-zinc-950 text-white hover:bg-[#FF7D00] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all font-mono shadow-xl shadow-zinc-900/10"
                >
                    Send Partnership Offer
                </button>
                <button 
                    onClick={() => router.push(`/client/freelancers/${freelancer.profileId}`)} 
                    className="w-full py-4 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all font-mono"
                >
                    View Full Identity
                </button>
                <button 
                    onClick={() => onRemoveBookmark(freelancer.profileId)} 
                    className="w-full py-2 text-zinc-300 hover:text-red-500 text-[8px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                    <Trash2 size={12} /> Remove from Library
                </button>
            </div>
        </motion.div>
    );
}
