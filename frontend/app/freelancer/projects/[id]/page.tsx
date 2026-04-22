'use client';

import React, { useEffect, useState } from 'react';
import api from '@/app/lib/axios';
import { getCurrentUserId } from '@/app/lib/auth';
import { createOrGetChatRoom } from '@/app/lib/chatApi';
import { useChatStore } from '@/app/store/chatStore';
import { useParams, useRouter } from 'next/navigation';
import {
    Calendar,
    MapPin,
    DollarSign,
    Globe,
    ArrowLeft,
    Clock,
    ChevronRight,
    Sparkles,
    XCircle,
    X,
    Heart,
    ShieldCheck,
    CheckCircle2,
    MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    latitude: number;
    longitude: number;
    skills: string[];

    clientUserId?: number;
    userId?: number;
    clientId?: number;
    writerId?: number;
    ownerUserId?: number;
}

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const openChat = useChatStore((state) => state.openChat);

    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isApplied, setIsApplied] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bidPrice, setBidPrice] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        const fetchProjectDetail = async () => {
            if (!id) return;

            try {
                const response = await api.get(`/v1/projects/${id}`);
                setProject(response.data);
                setBidPrice(String(response.data.budget));
            } catch (err: any) {
                if (err.response?.status !== 401) {
                    setError('프로젝트 정보를 불러오는데 실패했습니다.');
                }
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const myApps = await api.get('/applications/me');
                    setIsApplied(myApps.data.some((app: any) => app.projectId === Number(id)));
                } catch (e) {
                    console.error('지원 내역을 불러오는데 실패했습니다.', e);
                }

                try {
                    const myBookmarks = await api.get('/v1/bookmarks/projects?size=1000');
                    const bookmarkList = myBookmarks.data.content || [];
                    setIsBookmarked(bookmarkList.some((b: any) => b.projectId === Number(id)));
                } catch (e) {
                    console.error('북마크 내역을 불러오는데 실패했습니다.', e);
                }
            }

            setLoading(false);
        };

        fetchProjectDetail();
    }, [id]);

    const handleBookmarkToggle = async () => {
        if (!project) return;

        try {
            if (isBookmarked) {
                await api.delete(`/v1/bookmarks/projects/${id}`);
                setIsBookmarked(false);
            } else {
                await api.post(`/v1/bookmarks/projects/${id}`);
                setIsBookmarked(true);
            }
        } catch {
            alert('찜하기 처리에 실패했습니다.');
        }
    };

    const handleApplySubmit = async () => {
        if (!bidPrice || !message) return alert('금액과 메시지를 입력해 주세요.');

        setSubmitting(true);
        try {
            await api.post('/applications', {
                projectId: Number(id),
                bidPrice: Number(bidPrice),
                message: message.trim(),
            });

            alert('지원이 완료되었습니다!');
            setIsApplied(true);
            setIsModalOpen(false);
        } catch {
            alert('지원 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
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
            console.error('프로젝트 응답에 작성자 userId가 없습니다.', project);
            alert('채팅 대상 정보가 없습니다.');
            return;
        }

        try {
            setChatLoading(true);
            const response = await createOrGetChatRoom(targetUserId);
            openChat(response.roomId);
        } catch (error) {
            console.error('채팅방 생성/조회 실패:', error);
            alert('문의하기를 열지 못했습니다.');
        } finally {
            setChatLoading(false);
        }
    };

    const formatBudget = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-[#7A4FFF] font-black text-xl animate-pulse font-mono uppercase">
                Loading_Project...
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center p-12 bg-white rounded-[3rem] shadow-2xl border border-zinc-100">
                    <XCircle size={60} className="text-red-400 mx-auto mb-6" />
                    <p className="text-zinc-900 text-2xl font-black mb-6 tracking-tighter">
                        {error || '프로젝트를 찾을 수 없습니다.'}
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="px-8 py-4 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#7A4FFF] transition-all"
                    >
                        목록으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    const isProjectOpen = project.status === 'OPEN';
    const disableApplication = isApplied || !isProjectOpen;

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-32 relative overflow-x-hidden font-sans">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage:
                            'radial-gradient(#000 0.5px, transparent 0.5px), linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)',
                        backgroundSize: '20px 20px, 100px 100px, 100px 100px',
                    }}
                />
            </div>

            <nav className="sticky top-0 z-50 max-w-6xl mx-auto py-6 px-8 flex items-center justify-between bg-zinc-50/85 backdrop-blur-md border-b border-zinc-200/70">
                <button
                    onClick={() => router.back()}
                    className="group flex items-center gap-3 text-zinc-400 hover:text-zinc-950 transition-all font-black text-xs uppercase tracking-widest font-mono"
                >
                    <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:bg-zinc-950 group-hover:text-white transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    뒤로
                </button>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] font-mono">
                        미션 번호: {project.projectId}
                    </span>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-8 relative z-10">
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16"
                >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span
                                    className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase font-mono tracking-widest border ${
                                        project.status === 'OPEN'
                                            ? 'bg-[#7A4FFF]/10 text-[#7A4FFF] border-[#7A4FFF]/20'
                                            : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                                    }`}
                                >
                                    {project.status === 'OPEN' ? '모집 중' : '모집 마감'}
                                </span>

                                <div className="flex items-center gap-1.5 text-[#7A4FFF] text-[10px] font-black uppercase font-mono bg-white px-4 py-1.5 rounded-full shadow-sm border border-zinc-100">
                                    <Sparkles size={12} /> 프리미엄 미션
                                </div>
                            </div>

                            <h1 className="text-5xl md:text-6xl font-black text-zinc-950 tracking-tighter leading-[1.1] mb-8">
                                {project.projectName}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-zinc-400 font-bold uppercase text-[11px] font-mono tracking-widest">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-zinc-100 shadow-sm transition-all hover:border-[#7A4FFF]/30">
                                    <ShieldCheck size={16} className="text-[#7A4FFF]" />
                                    {project.companyName}
                                </div>

                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-zinc-100 shadow-sm transition-all hover:border-[#7A4FFF]/30">
                                    <MapPin size={16} className="text-[#7A4FFF]" />
                                    {project.location}
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={handleStartChat}
                                    disabled={chatLoading}
                                    className="px-6 py-3 rounded-2xl bg-[#7A4FFF] text-white font-bold shadow-lg hover:bg-[#6840e0] transition disabled:opacity-60"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <MessageCircle size={18} />
                                        {chatLoading ? '문의 여는 중...' : '문의하기'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleBookmarkToggle}
                            aria-label={isBookmarked ? '북마크 해제' : '북마크 추가'}
                            aria-pressed={isBookmarked}
                            className={`p-6 rounded-[2rem] shadow-xl transition-all border-2 flex items-center justify-center ${
                                isBookmarked
                                    ? 'bg-white border-red-100 text-red-500'
                                    : 'bg-zinc-950 border-zinc-950 text-white hover:bg-white hover:text-zinc-950 hover:border-zinc-100'
                            }`}
                        >
                            <Heart size={28} className={isBookmarked ? 'fill-red-500' : ''} />
                        </motion.button>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16"
                >
                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all group">
                        <DollarSign className="w-6 h-6 text-[#FF7D00] mb-4" />
                        <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest mb-1 font-mono">
                            예상 예산
                        </p>
                        <p className="text-xl font-black text-zinc-950 font-mono tracking-tighter">
                            {formatBudget(project.budget)}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all">
                        <Calendar className="w-6 h-6 text-[#7A4FFF] mb-4" />
                        <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest mb-1 font-mono">
                            마감 일자
                        </p>
                        <p className="text-xl font-black text-zinc-950 font-mono tracking-tighter">
                            {project.deadline}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all">
                        <Globe className="w-6 h-6 text-blue-500 mb-4" />
                        <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest mb-1 font-mono">
                            근무 형태
                        </p>
                        <p className="text-xl font-black text-zinc-950 font-mono tracking-tighter">
                            {project.online && project.offline
                                ? '온/오프 혼합'
                                : project.online
                                    ? '원격 근무'
                                    : '현장 근무'}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all">
                        <Clock className="w-6 h-6 text-emerald-500 mb-4" />
                        <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest mb-1 font-mono">
                            활동 지역
                        </p>
                        <p className="text-xl font-black text-zinc-950 font-mono tracking-tighter">
                            {project.location ? project.location.split(' ')[0] : '전국'}
                        </p>
                    </div>
                </motion.section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
                    <div className="lg:col-span-1">
                        <h3 className="text-sm font-black text-zinc-400 mb-8 uppercase tracking-[0.3em] font-mono flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-zinc-200"></span> 필수 스택
                        </h3>
                        <div className="max-h-80 overflow-y-auto rounded-2xl border border-zinc-100 bg-zinc-50/40 p-3">
                            <div className="flex flex-wrap gap-2">
                                {project.skills?.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="cursor-default rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-950 shadow-sm transition-all hover:border-[#7A4FFF] font-mono"
                                    >
                                        #{skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <h3 className="text-sm font-black text-zinc-400 mb-8 uppercase tracking-[0.3em] font-mono flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-zinc-200"></span> 상세 미션 브리핑
                        </h3>
                        <div className="bg-white border border-zinc-100 p-12 rounded-[3.5rem] shadow-2xl shadow-zinc-100 leading-relaxed text-zinc-700 whitespace-pre-wrap text-lg italic font-medium relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-[#7A4FFF] opacity-20 group-hover:opacity-100 transition-opacity"></div>
                            "{project.detail}"
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-10 flex justify-center w-full px-4">
                    <motion.button
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !disableApplication && setIsModalOpen(true)}
                        disabled={disableApplication}
                        className={`w-full max-w-2xl bg-zinc-950 text-white font-black py-7 rounded-[2rem] transition-all shadow-[0_25px_50px_rgba(0,0,0,0.2)] flex items-center justify-center gap-4 group ${
                            disableApplication
                                ? 'opacity-50 cursor-not-allowed grayscale'
                                : 'hover:bg-[#7A4FFF]'
                        }`}
                    >
                        {isApplied ? (
                            <>
                                <CheckCircle2 size={24} className="text-emerald-400" />
                                이미 지원한 프로젝트입니다
                            </>
                        ) : !isProjectOpen ? (
                            '모집이 마감된 프로젝트입니다'
                        ) : (
                            <>
                                <Sparkles size={24} />
                                이 미션에 지금 참가하기
                                <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                            </>
                        )}
                    </motion.button>
                </div>
            </main>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl border border-zinc-100"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                aria-label="지원서 닫기"
                                className="absolute top-8 right-8 text-zinc-300 hover:text-zinc-950 transition-all p-2 bg-zinc-50 rounded-full"
                            >
                                <X size={24} />
                            </button>

                            <h2 className="text-4xl font-black text-zinc-950 mb-3 tracking-tighter">
                                지원서 작성
                            </h2>
                            <p className="text-zinc-400 mb-10 font-bold text-xs uppercase tracking-widest font-mono">
                                지원서 양식
                            </p>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 ml-1 font-mono">
                                        입찰 제안 금액 (KRW)
                                    </label>
                                    <div className="relative">
                                        <DollarSign
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A4FFF]"
                                            size={20}
                                        />
                                        <input
                                            type="number"
                                            className="w-full p-5 pl-12 bg-zinc-50 border border-zinc-100 rounded-2xl font-black text-zinc-900 focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all text-xl font-mono"
                                            value={bidPrice}
                                            onChange={(e) => setBidPrice(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 ml-1 font-mono">
                                        협업 제안 메시지
                                    </label>
                                    <textarea
                                        className="w-full p-6 bg-zinc-50 border border-zinc-100 rounded-[2rem] font-medium text-zinc-700 h-48 focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all resize-none italic"
                                        placeholder="본 미션에 기여할 수 있는 마스터님의 강점을 적어주세요."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handleApplySubmit}
                                    disabled={submitting}
                                    className="w-full bg-zinc-950 text-white font-black py-6 rounded-2xl shadow-xl hover:bg-[#7A4FFF] transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs font-mono"
                                >
                                    {submitting ? '제출 중...' : '지원 확정하기'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}