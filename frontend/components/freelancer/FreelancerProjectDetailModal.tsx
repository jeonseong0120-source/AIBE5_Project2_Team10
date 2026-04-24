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
    Sparkles,
    ChevronRight,
    CheckCircle2,
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
                                                className="text-3xl md:text-4xl font-black tracking-tighter text-zinc-950 leading-tight"
                                            >
                                                {project.projectName}
                                            </h2>
                                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-widest font-mono text-zinc-400">
                                                <span className="px-4 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200/50">{project.companyName}</span>
                                                <span className="px-4 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200/50">{project.location || '지역 미정'}</span>
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
                                    <div className="p-5 rounded-[2rem] bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-lg group/stat">
                                        <DollarSign size={18} className="text-[#FF7D00] mb-3" />
                                        <EstimatedBudgetBlock budgetWon={project.budget} size="md" align="left" />
                                    </div>
                                    <div className="p-5 rounded-[2rem] bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-lg group/stat">
                                        <Calendar size={18} className="text-[#7A4FFF] mb-3" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-mono mb-1">마감</p>
                                        <p className="text-lg font-black tracking-tighter text-zinc-950">{project.deadline}</p>
                                    </div>
                                    <div className="p-5 rounded-[2rem] bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-lg group/stat">
                                        <Globe size={18} className="text-blue-500 mb-3" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-mono mb-1">근무형태</p>
                                        <p className="text-lg font-black tracking-tighter text-zinc-950">{project.online && project.offline ? '온/오프 혼합' : project.online ? '원격' : '현장'}</p>
                                    </div>
                                    <div className="p-5 rounded-[2rem] bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-lg group/stat">
                                        <Clock size={18} className="text-emerald-500 mb-3" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-mono mb-1">상태</p>
                                        <p className="text-lg font-black tracking-tighter text-zinc-950">{project.status === 'OPEN' ? '모집 중' : '마감'}</p>
                                    </div>
                                </div>

                                <div className="mb-8" inert={isApplyOpen}>
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">필수 스택</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(project.skills || []).map((skill, idx) => (
                                            <span key={`${getSkillName(skill)}-${idx}`} className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-bold">
                                                #{getSkillName(skill)}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-8" inert={isApplyOpen}>
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">상세 설명</h3>
                                    <div className="p-8 rounded-[2.5rem] border border-zinc-100 bg-zinc-50 text-zinc-800 whitespace-pre-wrap text-lg italic font-bold leading-relaxed relative overflow-hidden group/detail">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7A4FFF]/20 group-hover/detail:bg-[#7A4FFF] transition-colors"></div>
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
                                        {isApplied ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
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
                                                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                                                className="relative z-[230] w-full max-w-lg rounded-[2rem] bg-white border border-zinc-100 p-6"
                                            >
                                                <button
                                                    ref={applyCloseButtonRef}
                                                    type="button"
                                                    onClick={() => setIsApplyOpen(false)}
                                                    className="absolute right-4 top-4 rounded-full bg-zinc-100 p-2 text-zinc-600"
                                                    aria-label="지원서 닫기"
                                                >
                                                    <X size={16} />
                                                </button>
                                                <h4 id="freelancer-apply-panel-title" className="text-2xl font-black mb-5">지원서 작성</h4>
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
                                                            onClick={() => void apply()}
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

