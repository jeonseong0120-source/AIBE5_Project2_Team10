'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Calendar,
    DollarSign,
    Globe,
    Clock,
    X,
    Heart,
    MessageCircle,
    Plus,
    Activity,
    ChevronRight,
    CheckCircle2,
    Building2,
    MapPin,
} from 'lucide-react';
import { SkillItem, useProjectDetail } from '@/app/hooks/useProjectDetail';
import { EstimatedBudgetBlock } from '@/components/freelancer/EstimatedBudgetBlock';

type Props = {
    projectId: number | null;
    open: boolean;
    onClose: () => void;
};

const getSkillName = (skill: SkillItem): string =>
    typeof skill === 'string' ? skill : skill.name;

const DIALOG_TITLE_ID = 'freelancer-project-detail-dialog-title';

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
        if (el.closest('[inert]')) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

export default function FreelancerProjectDetailModal({ projectId, open, onClose }: Props) {
    const router = useRouter();
    const {
        project,
        loading,
        error,
        isApplied,
        isBookmarked,
        chatLoading,
        isApplyOpen,
        bidPrice,
        message,
        submitting,
        setIsApplyOpen,
        setBidPrice,
        setMessage,
        toggleBookmark,
        startChat,
        apply,
    } = useProjectDetail(open ? projectId : null);

    const isProjectOpen = project?.status === 'OPEN';
    const disableApplication = isApplied || !isProjectOpen;
    const normalizedError = useMemo(
        () => error || '프로젝트를 찾을 수 없습니다.',
        [error]
    );

    const dialogRef = useRef<HTMLDivElement>(null);
    const applyPanelRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const applyCloseButtonRef = useRef<HTMLButtonElement>(null);
    const previousActiveElementRef = useRef<HTMLElement | null>(null);
    const previousBodyOverflowRef = useRef<string | null>(null);

    useEffect(() => {
        if (!open) return;
        previousBodyOverflowRef.current = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousBodyOverflowRef.current ?? '';
            previousBodyOverflowRef.current = null;
        };
    }, [open]);

    useLayoutEffect(() => {
        if (!open) return;
        const active = document.activeElement;
        previousActiveElementRef.current = active instanceof HTMLElement ? active : null;
        return () => {
            const toRestore = previousActiveElementRef.current;
            previousActiveElementRef.current = null;
            if (toRestore?.isConnected) {
                toRestore.focus();
            }
        };
    }, [open]);

    useLayoutEffect(() => {
        if (!open || isApplyOpen) return;
        closeButtonRef.current?.focus();
    }, [open, isApplyOpen]);

    useLayoutEffect(() => {
        if (!open || !isApplyOpen) return;
        applyCloseButtonRef.current?.focus();
    }, [open, isApplyOpen]);

    const handleDocumentKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!open) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                if (isApplyOpen) {
                    setIsApplyOpen(false);
                } else {
                    onClose();
                }
                return;
            }
            if (e.key !== 'Tab') return;

            const root = isApplyOpen ? applyPanelRef.current : dialogRef.current;
            if (!root) return;

            const list = getFocusableElements(root);
            if (list.length === 0) return;

            const active = document.activeElement as HTMLElement | null;
            if (active && !root.contains(active)) {
                e.preventDefault();
                list[e.shiftKey ? list.length - 1 : 0]?.focus();
                return;
            }

            const first = list[0];
            const last = list[list.length - 1];
            if (e.shiftKey) {
                if (active === first || !root.contains(active!)) {
                    e.preventDefault();
                    last.focus();
                }
            } else if (active === last) {
                e.preventDefault();
                first.focus();
            }
        },
        [open, isApplyOpen, onClose, setIsApplyOpen]
    );

    useEffect(() => {
        if (!open) return;
        document.addEventListener('keydown', handleDocumentKeyDown);
        return () => document.removeEventListener('keydown', handleDocumentKeyDown);
    }, [open, handleDocumentKeyDown]);

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
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={DIALOG_TITLE_ID}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        className="relative z-[210] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white border border-zinc-100 shadow-2xl p-6 md:p-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            ref={closeButtonRef}
                            type="button"
                            onClick={onClose}
                            inert={isApplyOpen}
                            className="absolute right-5 top-5 rounded-full bg-zinc-100 p-2 text-zinc-600 hover:text-zinc-900"
                            aria-label="닫기"
                        >
                            <X size={18} />
                        </button>

                        {loading ? (
                            <h2
                                id={DIALOG_TITLE_ID}
                                className="py-24 text-center text-zinc-400 font-black"
                            >
                                로딩 중...
                            </h2>
                        ) : error || !project ? (
                            <h2 id={DIALOG_TITLE_ID} className="py-24 text-center text-red-500 font-black">
                                {normalizedError}
                            </h2>
                        ) : (
                            <>
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8" inert={isApplyOpen}>
                                    <div className="flex items-start gap-5">
                                        <button
                                            type="button"
                                            onClick={() => router.push(`/freelancer/projects/${project.projectId}`)}
                                            aria-label={`${project.companyName || '기업'} 상세 프로필 보기`}
                                            className="h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 p-1 shadow-sm transition-transform hover:scale-105 active:scale-95 group/logo"
                                        >
                                            <img
                                                src={project.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.companyName || 'C')}&background=F4F4F5&color=A1A1AA`}
                                                alt={project.companyName || 'Company logo'}
                                                className="h-full w-full object-cover rounded-xl"
                                            />
                                        </button>
                                        <div>
                                            <h2
                                                id={DIALOG_TITLE_ID}
                                                className="text-2xl md:text-3xl font-black tracking-tighter text-zinc-950 leading-[1.1] mb-2"
                                            >
                                                {project.projectName}
                                            </h2>
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50/50 border border-[#7A4FFF]/10 shadow-sm transition-all hover:border-[#7A4FFF]/30">
                                                    <Building2 size={13} className="text-[#7A4FFF]" />
                                                    <span className="text-[12px] font-bold text-zinc-600">{project.companyName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50/50 border border-[#7A4FFF]/10 shadow-sm transition-all hover:border-[#7A4FFF]/30">
                                                    <MapPin size={13} className="text-[#7A4FFF]" />
                                                    <span className="text-[12px] font-bold text-zinc-600">{project.location || '지역 미정'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={toggleBookmark}
                                        className={`mr-12 p-3 rounded-xl border ${isBookmarked ? 'text-red-500 border-red-100 bg-red-50' : 'text-zinc-500 border-zinc-200'}`}
                                    >
                                        <Heart size={18} className={isBookmarked ? 'fill-red-500' : ''} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8" inert={isApplyOpen}>
                                    <div className="p-6 rounded-[2.2rem] bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-xl group/stat flex flex-col justify-between">
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div className="p-2 rounded-lg bg-purple-50 text-[#7A4FFF]">
                                                <DollarSign size={14} />
                                            </div>
                                            <p className="text-[11px] font-bold text-zinc-500">예상 예산</p>
                                        </div>
                                        <EstimatedBudgetBlock budgetWon={project.budget} size="lg" align="left" showLabel={false} />
                                    </div>
                                    <div className="p-6 rounded-[2.2rem] bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-xl group/stat flex flex-col justify-between">
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div className="p-2 rounded-lg bg-purple-50 text-[#7A4FFF]">
                                                <Calendar size={14} />
                                            </div>
                                            <p className="text-[11px] font-bold text-zinc-500">모집 마감</p>
                                        </div>
                                        <p className="text-xl font-black tracking-tighter text-zinc-950">{project.deadline}</p>
                                    </div>
                                    <div className="p-6 rounded-[2.2rem] bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-xl group/stat flex flex-col justify-between">
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div className="p-2 rounded-lg bg-purple-50 text-[#7A4FFF]">
                                                <Globe size={14} />
                                            </div>
                                            <p className="text-[11px] font-bold text-zinc-500">근무 형태</p>
                                        </div>
                                        <p className="text-xl font-black tracking-tighter text-zinc-950">{project.online && project.offline ? '온/오프 혼합' : project.online ? '원격 근무' : '현장 출근'}</p>
                                    </div>
                                    <div className="p-6 rounded-[2.2rem] bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-xl group/stat flex flex-col justify-between">
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div className="p-2 rounded-lg bg-purple-50 text-[#7A4FFF]">
                                                <Clock size={14} />
                                            </div>
                                            <p className="text-[11px] font-bold text-zinc-500">현재 상태</p>
                                        </div>
                                        <p className="text-xl font-black tracking-tighter text-zinc-950">{project.status === 'OPEN' ? '모집 중' : '마감됨'}</p>
                                    </div>
                                </div>

                                <div className="mb-8" inert={isApplyOpen}>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="h-5 w-1 rounded-full bg-[#7A4FFF]"></div>
                                        <h3 className="text-[14px] font-black text-zinc-900 tracking-tight">요구 기술 스택</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(project.skills || []).map((skill, idx) => (
                                            <span key={`${getSkillName(skill)}-${idx}`} className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-bold">
                                                #{getSkillName(skill)}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-8" inert={isApplyOpen}>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="h-5 w-1 rounded-full bg-[#7A4FFF]"></div>
                                        <h3 className="text-[14px] font-black text-zinc-900 tracking-tight">프로젝트 상세 내용</h3>
                                    </div>
                                    <div className="p-10 rounded-[2.5rem] border border-zinc-100 bg-zinc-50/50 text-zinc-800 whitespace-pre-wrap text-[17px] font-medium leading-[1.8] relative overflow-hidden group/detail shadow-inner">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#7A4FFF] to-[#A78BFF] opacity-40 group-hover/detail:opacity-100 transition-opacity"></div>
                                        {project.detail}
                                    </div>
                                </div>

                                <div className="grid grid-cols-10 gap-3" inert={isApplyOpen}>
                                    <button
                                        type="button"
                                        onClick={() => !disableApplication && setIsApplyOpen(true)}
                                        disabled={disableApplication}
                                        className={`col-span-7 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 ${
                                            disableApplication ? 'bg-zinc-300 cursor-not-allowed' : 'bg-zinc-950 hover:bg-[#7A4FFF]'
                                        }`}
                                    >
                                        {isApplied ? '이미 지원한 프로젝트입니다' : !isProjectOpen ? '모집이 마감된 프로젝트입니다' : '프로젝트 지원하기'}
                                        {!disableApplication && <ChevronRight size={18} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void startChat(onClose)}
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
                                                ref={applyPanelRef}
                                                role="dialog"
                                                aria-modal="true"
                                                aria-labelledby="freelancer-apply-panel-title"
                                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                                className="relative bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl border border-zinc-100 overflow-hidden"
                                            >
                                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#7A4FFF] to-[#A78BFF]"></div>
                                                
                                                <button
                                                    onClick={() => setIsApplyOpen(false)}
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
                                                            <DollarSign size={14} className="text-[#7A4FFF]" />
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
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

