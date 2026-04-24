'use client';

import React, { useEffect, useState } from 'react';
import api from '@/app/lib/axios';
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
    MessageCircle,
    Building2,
    Plus,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalNavbar, { type UserData, type ProfileData } from '@/components/common/GlobalNavbar';
import { SkillItem, useProjectDetail } from '@/app/hooks/useProjectDetail';
import { EstimatedBudgetBlock } from '@/components/freelancer/EstimatedBudgetBlock';

const getSkillName = (skill: SkillItem): string =>
    typeof skill === 'string' ? skill : skill.name;

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [user, setUser] = useState<UserData | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const numericProjectId = Number(id);
    const {
        project,
        loading,
        error,
        isApplied,
        isBookmarked,
        chatLoading,
        isApplyOpen: isModalOpen,
        bidPrice,
        message,
        submitting,
        setIsApplyOpen: setIsModalOpen,
        setBidPrice,
        setMessage,
        toggleBookmark,
        startChat,
        apply,
    } = useProjectDetail(Number.isFinite(numericProjectId) ? numericProjectId : null);

    useEffect(() => {
        const fetchNavbarData = async () => {
            try {
                const meRes = await api.get('/v1/users/me');
                const role = meRes.data.role?.replace('ROLE_', '') || 'FREELANCER';
                setUser({ ...meRes.data, role: role as UserData['role'] });
            } catch {
                setUser(null);
            }

            try {
                const profileRes = await api.get('/v1/freelancers/me');
                setProfile(profileRes.data);
            } catch {
                setProfile(null);
            }
        };

        void fetchNavbarData();
    }, [id]);

    const formatBudget = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950">
                <GlobalNavbar user={user} profile={profile} />
                <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center text-[#7A4FFF] font-black text-xl animate-pulse font-mono uppercase">
                    Loading_Project...
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-zinc-50">
                <GlobalNavbar user={user} profile={profile} />
                <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
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
            </div>
        );
    }

    const isProjectOpen = project.status === 'OPEN';
    const disableApplication = isApplied || !isProjectOpen;

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-32 relative overflow-x-hidden font-sans">
            <GlobalNavbar user={user} profile={profile} />
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

            <nav className="sticky top-24 z-40 max-w-6xl mx-auto py-6 px-8 flex items-center justify-between bg-zinc-50/85 backdrop-blur-md">
                <button
                    onClick={() => router.back()}
                    className="group flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white/50 px-5 py-2.5 font-mono text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 shadow-sm backdrop-blur-md transition-all hover:border-[#7A4FFF]/30 hover:bg-white hover:text-zinc-950 hover:shadow-md active:scale-95"
                >
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-50 transition-colors group-hover:bg-[#7A4FFF]/10">
                        <ArrowLeft
                            size={14}
                            className="text-zinc-400 transition-transform group-hover:-translate-x-0.5 group-hover:text-[#7A4FFF]"
                        />
                    </div>
                    <span>뒤로 가기</span>
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


                            </div>

                            <h1 className="text-5xl md:text-6xl font-black text-zinc-950 tracking-tighter leading-[1.1] mb-8">
                                {project.projectName}
                            </h1>

                            <div className="flex flex-wrap gap-3 mt-4">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-100 shadow-sm transition-all hover:border-[#7A4FFF]/30 hover:shadow-md">
                                    <Building2 size={14} className="text-[#7A4FFF]" />
                                    <span className="text-[13px] font-bold text-zinc-600">{project.companyName}</span>
                                </div>

                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-100 shadow-sm transition-all hover:border-blue-500/30 hover:shadow-md">
                                    <MapPin size={14} className="text-blue-500" />
                                    <span className="text-[13px] font-bold text-zinc-600">{project.location || '전국'}</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => void startChat()}
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
                            onClick={toggleBookmark}
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
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20"
                >
                    <div className="p-8 rounded-[2.5rem] bg-white border border-zinc-100 transition-all hover:shadow-xl group/stat flex flex-col justify-between min-h-[160px]">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-2 rounded-xl bg-orange-50 text-[#FF7D00]">
                                <DollarSign size={16} />
                            </div>
                            <p className="text-[12px] font-bold text-zinc-500">예상 예산</p>
                        </div>
                        <EstimatedBudgetBlock budgetWon={project.budget} size="lg" align="left" showLabel={false} />
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-white border border-zinc-100 transition-all hover:shadow-xl group/stat flex flex-col justify-between min-h-[160px]">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-2 rounded-xl bg-purple-50 text-[#7A4FFF]">
                                <Calendar size={16} />
                            </div>
                            <p className="text-[12px] font-bold text-zinc-500">모집 마감</p>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-zinc-950 font-mono">
                            {project.deadline}
                        </p>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-white border border-zinc-100 transition-all hover:shadow-xl group/stat flex flex-col justify-between min-h-[160px]">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-500">
                                <Globe size={16} />
                            </div>
                            <p className="text-[12px] font-bold text-zinc-500">근무 형태</p>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-zinc-950">
                            {project.online && project.offline
                                ? '온/오프 혼합'
                                : project.online
                                    ? '원격 근무'
                                    : '현장 근무'}
                        </p>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-white border border-zinc-100 transition-all hover:shadow-xl group/stat flex flex-col justify-between min-h-[160px]">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-500">
                                <Clock size={16} />
                            </div>
                            <p className="text-[12px] font-bold text-zinc-500">현재 상태</p>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-zinc-950">
                            {project.status === 'OPEN' ? '모집 중' : '마감됨'}
                        </p>
                    </div>
                </motion.section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
                    <div className="lg:col-span-1">
                        <h3 className="text-sm font-black text-zinc-400 mb-8 uppercase tracking-[0.1em] flex items-center gap-3">
                            <span className="w-8 h-[2px] bg-[#7A4FFF]"></span> 요구 기술 스택
                        </h3>
                        <div className="max-h-80 overflow-y-auto rounded-2xl border border-zinc-100 bg-zinc-50/40 p-3">
                            <div className="flex flex-wrap gap-2">
                                {project.skills?.map((skill, index) => (
                                    <span
                                        key={`${getSkillName(skill)}-${index}`}
                                        className="cursor-default rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-950 shadow-sm transition-all hover:border-[#7A4FFF] font-mono"
                                    >
                                        #{getSkillName(skill)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <h3 className="text-sm font-black text-zinc-400 mb-8 uppercase tracking-[0.1em] flex items-center gap-3">
                            <span className="w-8 h-[2px] bg-[#7A4FFF]"></span> 프로젝트 상세 내용
                        </h3>
                         <div className="bg-white border border-zinc-100 p-12 rounded-[3.5rem] shadow-2xl shadow-zinc-100 leading-[1.8] text-zinc-800 whitespace-pre-wrap text-[17px] font-medium relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#7A4FFF] to-[#A78BFF] opacity-20 group-hover:opacity-100 transition-opacity"></div>
                            {project.detail}
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
                                <Plus size={24} />
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
                            className="relative bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl border border-zinc-100 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#7A4FFF] to-[#FF7D00]"></div>
                            
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-950 transition-all p-2 bg-zinc-50 rounded-full"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-10">
                                <h2 className="text-3xl font-black text-zinc-950 mb-2 tracking-tighter">
                                    미션 지원하기
                                </h2>
                                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">APPLICATION FORM</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                        <DollarSign size={14} className="text-[#FF7D00]" />
                                        입찰 제안 금액 (KRW)
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-2xl font-black text-zinc-950 focus:bg-white focus:ring-2 focus:ring-[#7A4FFF]/20 focus:border-[#7A4FFF] outline-none transition-all text-2xl font-mono tabular-nums"
                                            value={bidPrice}
                                            onChange={(e) => setBidPrice(e.target.value)}
                                            placeholder="0"
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">원</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                        <MessageCircle size={14} className="text-[#7A4FFF]" />
                                        협업 제안 메시지
                                    </label>
                                    <textarea
                                        className="w-full p-6 bg-zinc-50 border border-zinc-100 rounded-2xl font-medium text-zinc-800 h-40 focus:bg-white focus:ring-2 focus:ring-[#7A4FFF]/20 focus:border-[#7A4FFF] outline-none transition-all resize-none leading-relaxed"
                                        placeholder="마스터님의 프로젝트 기여 방안을 자유롭게 적어주세요."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => void apply()}
                                    disabled={submitting}
                                    className="w-full bg-zinc-950 text-white font-black py-6 rounded-2xl shadow-xl hover:bg-[#7A4FFF] transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
                                >
                                    {submitting ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>지원서 제출하기</span>
                                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}