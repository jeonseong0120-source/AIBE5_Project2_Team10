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
    MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalNavbar, { type UserData, type ProfileData } from '@/components/common/GlobalNavbar';
import { SkillItem, useProjectDetail } from '@/app/hooks/useProjectDetail';

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

                                <div className="flex items-center gap-1.5 text-[#7A4FFF] text-[10px] font-black uppercase font-mono bg-white px-4 py-1.5 rounded-full shadow-sm border border-zinc-100">
                                    <Sparkles size={12} /> 프리미엄 미션
                                </div>
                            </div>

                            <h1 className="text-5xl md:text-6xl font-black text-zinc-950 tracking-tighter leading-[1.1] mb-8">
                                {project.projectName}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-zinc-400 font-black uppercase text-[11px] font-mono tracking-widest">
                                <div className="flex items-center gap-2.5 px-5 py-3 bg-white rounded-2xl border border-zinc-100 shadow-sm transition-all hover:border-[#7A4FFF]/30 hover:shadow-md">
                                    <ShieldCheck size={18} className="text-[#7A4FFF]" />
                                    <span className="text-zinc-900">{project.companyName}</span>
                                </div>

                                <div className="flex items-center gap-2.5 px-5 py-3 bg-white rounded-2xl border border-zinc-100 shadow-sm transition-all hover:border-[#7A4FFF]/30 hover:shadow-md">
                                    <MapPin size={18} className="text-[#7A4FFF]" />
                                    <span className="text-zinc-900">{project.location || '전국'}</span>
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
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
                >
                    <div className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all group hover:-translate-y-1">
                        <DollarSign className="w-6 h-6 text-[#FF7D00] mb-4" />
                        <p className="text-zinc-400 text-[11px] font-black uppercase tracking-[0.1em] mb-2 font-mono">
                            예상 예산
                        </p>
                        <p className="text-2xl font-black text-zinc-950 font-mono tracking-tighter whitespace-nowrap">
                            {formatBudget(project.budget)}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                        <Calendar className="w-6 h-6 text-[#7A4FFF] mb-4" />
                        <p className="text-zinc-400 text-[11px] font-black uppercase tracking-[0.1em] mb-2 font-mono">
                            마감 일자
                        </p>
                        <p className="text-2xl font-black text-zinc-950 font-mono tracking-tighter whitespace-nowrap">
                            {project.deadline}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                        <Globe className="w-6 h-6 text-blue-500 mb-4" />
                        <p className="text-zinc-400 text-[11px] font-black uppercase tracking-[0.1em] mb-2 font-mono">
                            근무 형태
                        </p>
                        <p className="text-2xl font-black text-zinc-950 tracking-tighter whitespace-nowrap">
                            {project.online && project.offline
                                ? '온/오프 혼합'
                                : project.online
                                    ? '원격 근무'
                                    : '현장 근무'}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                        <Clock className="w-6 h-6 text-emerald-500 mb-4" />
                        <p className="text-zinc-400 text-[11px] font-black uppercase tracking-[0.1em] mb-2 font-mono">
                            활동 지역
                        </p>
                        <p className="text-2xl font-black text-zinc-950 tracking-tighter whitespace-nowrap">
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
                        <h3 className="text-sm font-black text-zinc-400 mb-8 uppercase tracking-[0.3em] font-mono flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-zinc-200"></span> 상세 미션 브리핑
                        </h3>
                         <div className="bg-white border border-zinc-100 p-12 rounded-[3.5rem] shadow-2xl shadow-zinc-100 leading-relaxed text-zinc-800 whitespace-pre-wrap text-xl italic font-bold relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-[#7A4FFF] opacity-20 group-hover:opacity-100 transition-opacity"></div>
                            <span className="text-[#7A4FFF] text-4xl font-serif absolute top-4 left-4 opacity-10" aria-hidden="true">"</span>
                            {project.detail}
                            <span className="text-[#7A4FFF] text-4xl font-serif absolute bottom-4 right-4 opacity-10" aria-hidden="true">"</span>
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
                                    onClick={() => void apply()}
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