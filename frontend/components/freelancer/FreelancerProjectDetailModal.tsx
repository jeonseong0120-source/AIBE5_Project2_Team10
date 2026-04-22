'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Calendar,
    MapPin,
    DollarSign,
    Globe,
    Clock,
    X,
    Heart,
    MessageCircle,
    Sparkles,
    ChevronRight,
    CheckCircle2,
} from 'lucide-react';
import api from '@/app/lib/axios';
import { getCurrentUserId } from '@/app/lib/auth';
import { createOrGetChatRoom } from '@/app/lib/chatApi';
import { useChatStore } from '@/app/store/chatStore';

interface ProjectDetail {
    projectId: number;
    companyName: string;
    projectName: string;
    budget: number;
    deadline: string;
    detail: string;
    status: string;
    online: boolean;
    offline: boolean;
    location: string;
    skills: string[];
    clientUserId?: number;
    userId?: number;
    clientId?: number;
    writerId?: number;
    ownerUserId?: number;
}

type Props = {
    projectId: number | null;
    open: boolean;
    onClose: () => void;
};

export default function FreelancerProjectDetailModal({ projectId, open, onClose }: Props) {
    const openChat = useChatStore((state) => state.openChat);
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isApplied, setIsApplied] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [isApplyOpen, setIsApplyOpen] = useState(false);
    const [bidPrice, setBidPrice] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open || !projectId) return;

        const fetchDetail = async () => {
            setLoading(true);
            setError(null);
            setIsApplyOpen(false);
            setMessage('');
            try {
                const response = await api.get(`/v1/projects/${projectId}`);
                setProject(response.data);
                setBidPrice(String(response.data.budget ?? ''));
            } catch {
                setError('프로젝트 정보를 불러오지 못했습니다.');
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const myApps = await api.get('/applications/me');
                    setIsApplied(myApps.data.some((app: any) => app.projectId === Number(projectId)));
                } catch {
                    setIsApplied(false);
                }

                try {
                    const myBookmarks = await api.get('/v1/bookmarks/projects?size=1000');
                    const bookmarkList = myBookmarks.data.content || [];
                    setIsBookmarked(bookmarkList.some((b: any) => b.projectId === Number(projectId)));
                } catch {
                    setIsBookmarked(false);
                }
            }
            setLoading(false);
        };

        void fetchDetail();
    }, [open, projectId]);

    const handleBookmarkToggle = async () => {
        if (!projectId) return;
        try {
            if (isBookmarked) {
                await api.delete(`/v1/bookmarks/projects/${projectId}`);
                setIsBookmarked(false);
            } else {
                await api.post(`/v1/bookmarks/projects/${projectId}`);
                setIsBookmarked(true);
            }
        } catch {
            alert('찜하기 처리에 실패했습니다.');
        }
    };

    const handleStartChat = async () => {
        if (!project || chatLoading) return;
        const targetUserId =
            project.clientUserId ??
            project.userId ??
            project.clientId ??
            project.writerId ??
            project.ownerUserId ??
            null;

        const currentUserId = getCurrentUserId();
        if (currentUserId !== null && targetUserId === currentUserId) {
            alert('본인에게는 문의할 수 없습니다.');
            return;
        }

        if (!targetUserId) {
            alert('채팅 대상 정보가 없습니다.');
            return;
        }

        try {
            setChatLoading(true);
            const response = await createOrGetChatRoom(targetUserId);
            openChat(response.roomId);
            onClose();
        } catch {
            alert('문의하기를 열지 못했습니다.');
        } finally {
            setChatLoading(false);
        }
    };

    const handleApplySubmit = async () => {
        if (!projectId) return;
        if (!bidPrice || !message.trim()) {
            alert('금액과 메시지를 입력해 주세요.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/applications', {
                projectId,
                bidPrice: Number(bidPrice),
                message: message.trim(),
            });
            setIsApplied(true);
            setIsApplyOpen(false);
            alert('지원이 완료되었습니다.');
        } catch {
            alert('지원 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatBudget = (amount: number) =>
        new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

    const isProjectOpen = project?.status === 'OPEN';
    const disableApplication = isApplied || !isProjectOpen;

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        className="relative z-[210] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white border border-zinc-100 shadow-2xl p-6 md:p-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-5 top-5 rounded-full bg-zinc-100 p-2 text-zinc-600 hover:text-zinc-900"
                            aria-label="닫기"
                        >
                            <X size={18} />
                        </button>

                        {loading ? (
                            <div className="py-24 text-center text-zinc-400 font-black">로딩 중...</div>
                        ) : error || !project ? (
                            <div className="py-24 text-center text-red-500 font-black">{error || '프로젝트를 찾을 수 없습니다.'}</div>
                        ) : (
                            <>
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight text-zinc-950">{project.projectName}</h2>
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-zinc-500">
                                            <span className="px-3 py-1 rounded-full bg-zinc-100">{project.companyName}</span>
                                            <span className="px-3 py-1 rounded-full bg-zinc-100">{project.location || '지역 미정'}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleBookmarkToggle}
                                        className={`mr-12 p-3 rounded-xl border ${isBookmarked ? 'text-red-500 border-red-100 bg-red-50' : 'text-zinc-500 border-zinc-200'}`}
                                    >
                                        <Heart size={18} className={isBookmarked ? 'fill-red-500' : ''} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
                                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                        <DollarSign size={16} className="text-[#FF7D00] mb-2" />
                                        <p className="text-xs text-zinc-400">예산</p>
                                        <p className="font-black">{formatBudget(project.budget)}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                        <Calendar size={16} className="text-[#7A4FFF] mb-2" />
                                        <p className="text-xs text-zinc-400">마감</p>
                                        <p className="font-black">{project.deadline}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                        <Globe size={16} className="text-blue-500 mb-2" />
                                        <p className="text-xs text-zinc-400">근무형태</p>
                                        <p className="font-black">{project.online && project.offline ? '온/오프 혼합' : project.online ? '원격' : '현장'}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                        <Clock size={16} className="text-emerald-500 mb-2" />
                                        <p className="text-xs text-zinc-400">상태</p>
                                        <p className="font-black">{project.status === 'OPEN' ? '모집 중' : '마감'}</p>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">필수 스택</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(project.skills || []).map((skill, idx) => (
                                            <span key={`${skill}-${idx}`} className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-bold">
                                                #{typeof skill === 'string' ? skill : (skill as any).name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">상세 설명</h3>
                                    <div className="p-5 rounded-2xl border border-zinc-100 bg-zinc-50 text-zinc-700 whitespace-pre-wrap">
                                        {project.detail}
                                    </div>
                                </div>

                                <div className="grid grid-cols-10 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => !disableApplication && setIsApplyOpen(true)}
                                        disabled={disableApplication}
                                        className={`col-span-7 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 ${
                                            disableApplication ? 'bg-zinc-300 cursor-not-allowed' : 'bg-zinc-950 hover:bg-[#7A4FFF]'
                                        }`}
                                    >
                                        {isApplied ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
                                        {isApplied ? '이미 지원한 프로젝트입니다' : !isProjectOpen ? '모집이 마감된 프로젝트입니다' : '프로젝트 지원하기'}
                                        {!disableApplication && <ChevronRight size={18} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleStartChat}
                                        disabled={chatLoading}
                                        className="col-span-3 py-4 rounded-2xl bg-[#7A4FFF] text-white font-black flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        <MessageCircle size={16} />
                                        {chatLoading ? '문의 중...' : '문의하기'}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isApplyOpen && (
                                        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 bg-zinc-950/60"
                                                onClick={() => setIsApplyOpen(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                                                className="relative z-[230] w-full max-w-lg rounded-[2rem] bg-white border border-zinc-100 p-6"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setIsApplyOpen(false)}
                                                    className="absolute right-4 top-4 rounded-full bg-zinc-100 p-2 text-zinc-600"
                                                >
                                                    <X size={16} />
                                                </button>
                                                <h4 className="text-2xl font-black mb-5">지원서 작성</h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-zinc-500">입찰 금액</label>
                                                        <input
                                                            type="number"
                                                            value={bidPrice}
                                                            onChange={(e) => setBidPrice(e.target.value)}
                                                            className="w-full mt-1 p-3 rounded-xl border border-zinc-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-zinc-500">메시지</label>
                                                        <textarea
                                                            value={message}
                                                            onChange={(e) => setMessage(e.target.value)}
                                                            className="w-full mt-1 p-3 rounded-xl border border-zinc-200 min-h-[130px]"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleApplySubmit}
                                                        disabled={submitting}
                                                        className="w-full py-3 rounded-xl bg-zinc-950 text-white font-bold disabled:opacity-60"
                                                    >
                                                        {submitting ? '제출 중...' : '지원 확정하기'}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

