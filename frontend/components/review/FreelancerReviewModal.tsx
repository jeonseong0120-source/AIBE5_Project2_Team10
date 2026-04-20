'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, Award } from 'lucide-react';
import api from '@/app/lib/axios';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
    freelancerId: number;
    freelancerNickname: string;
}

export default function FreelancerReviewModal({ isOpen, onClose, projectId, freelancerId, freelancerNickname }: Props) {
    const [comment, setComment] = useState("");
    const [scores, setScores] = useState({
        workQuality: 5,
        deadline: 5,
        communication: 5,
        expertise: 5
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!comment.trim()) return alert("리뷰 내용을 입력해주세요.");

        // 🎯 [마스터 확인용] 서버 전송 데이터
        const payload = {
            projectId: Number(projectId),
            freelancerId: Number(freelancerId),
            ...scores,
            comment
        };

        console.log("🚩 [최종 전송 데이터]:", payload);

        setSubmitting(true);
        try {
            // Swagger: POST /api/reviews/freelancers
            await api.post('/reviews/freelancers', payload);
            alert("리뷰가 성공적으로 등록되었습니다!");
            onClose();
        } catch (err: any) {
            console.error("❌ 리뷰 등록 실패:", err.response?.data);
            alert(err.response?.data?.message || "리뷰 등록 실패");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />
                    <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
                                className="relative bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl border border-zinc-100 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8">
                            <button onClick={onClose} className="text-zinc-300 hover:text-zinc-950 transition-colors"><X size={24}/></button>
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF7D00]"><Award size={24}/></div>
                            <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase font-mono">Expert_Review</h2>
                        </div>
                        <p className="text-zinc-400 text-sm mb-8 font-medium italic">"{freelancerNickname}" 요원과의 협업은 어떠셨나요?</p>

                        <div className="space-y-5">
                            {[{ id: 'workQuality', label: '작업 품질' }, { id: 'deadline', label: '마감 기한' }, { id: 'communication', label: '의사소통' }, { id: 'expertise', label: '전문성' }].map((item) => (
                                <div key={item.id} className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                                    <span className="text-xs font-black text-zinc-600 uppercase font-mono">{item.label}</span>
                                    {/* 🎯 [수정된 부분] 숫자 대신 별 아이콘 적용 */}
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => setScores({...scores, [item.id]: num})}
                                                className="transition-transform focus:outline-none hover:scale-110 active:scale-95 p-0.5"
                                            >
                                                <Star
                                                    size={22}
                                                    className={`transition-all duration-300 ${
                                                        scores[item.id as keyof typeof scores] >= num
                                                            ? 'fill-[#FF7D00] text-[#FF7D00] drop-shadow-[0_2px_6px_rgba(255,125,0,0.3)]'
                                                            : 'fill-transparent text-zinc-300 hover:text-zinc-400'
                                                    }`}
                                                    strokeWidth={1.5}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="pt-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 font-mono flex items-center gap-1.5"><MessageSquare size={12}/> Detailed_Comment</label>
                                <textarea className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-sm outline-none focus:border-[#FF7D00] transition-all resize-none h-28 font-medium" placeholder="상세한 후기를 남겨주세요..." value={comment} onChange={(e) => setComment(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={onClose} className="flex-1 py-4 bg-zinc-100 text-zinc-500 rounded-2xl font-black text-xs uppercase tracking-widest font-mono hover:bg-zinc-200 transition-colors">나중에</button>
                            <button onClick={handleSubmit} disabled={submitting} className="flex-[2] py-4 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest font-mono hover:bg-[#FF7D00] transition-all shadow-xl shadow-orange-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                {submitting ? "제출 중..." : "리뷰 제출하기"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}