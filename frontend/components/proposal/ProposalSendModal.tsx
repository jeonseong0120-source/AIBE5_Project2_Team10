'use client';

import { XCircle, Briefcase, FileText, DollarSign, Clock, MessageSquare, Target, Send, Sparkles } from 'lucide-react';

type ProposalMode = 'PROJECT' | 'FORM';

export type ProjectOption = {
    projectId: number;
    projectName: string;
};

/**
 * Maps API project list payloads to `ProjectOption[]`, excluding completed projects.
 */
export function mapProjectsForProposalPicker(list: unknown): ProjectOption[] {
    if (!Array.isArray(list)) return [];
    return list
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .filter((item) => item.status !== 'COMPLETED')
        .map((item) => ({
            projectId: Number(item.projectId),
            projectName: String(item.projectName ?? ''),
        }))
        .filter((p) => Number.isFinite(p.projectId));
}

type Props = {
    open: boolean;
    targetName?: string;
    mode: ProposalMode;
    onChangeMode: (mode: ProposalMode) => void;
    projects: ProjectOption[];
    projectsLoading: boolean;
    selectedProjectId: number | null;
    onChangeProjectId: (projectId: number) => void;
    offeredPrice: string;
    onChangeOfferedPrice: (value: string) => void;
    positionTitle: string;
    onChangePositionTitle: (value: string) => void;
    workScope: string;
    onChangeWorkScope: (value: string) => void;
    workingPeriod: string;
    onChangeWorkingPeriod: (value: string) => void;
    message: string;
    onChangeMessage: (value: string) => void;
    sending: boolean;
    onClose: () => void;
    onSend: () => void;
};

export default function ProposalSendModal({
    open,
    targetName,
    mode,
    onChangeMode,
    projects,
    projectsLoading,
    selectedProjectId,
    onChangeProjectId,
    offeredPrice,
    onChangeOfferedPrice,
    positionTitle,
    onChangePositionTitle,
    workScope,
    onChangeWorkScope,
    workingPeriod,
    onChangeWorkingPeriod,
    message,
    onChangeMessage,
    sending,
    onClose,
    onSend,
}: Props) {
    if (!open) return null;

    return (
        <div className="relative flex flex-col w-full max-w-xl max-h-[90vh] overflow-hidden rounded-[2rem] border border-zinc-200 bg-white/95 shadow-2xl backdrop-blur-xl">
            {/* Top Accent Bar */}
            <div className="h-1.5 w-full flex-none bg-gradient-to-r from-[#7A4FFF] via-[#FF7D00] to-[#7A4FFF]" />

            {/* Header section - Fixed */}
            <div className="p-6 md:p-8 pb-4 flex-none">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 bg-purple-50 rounded-lg text-[#7A4FFF]">
                                <Send size={16} strokeWidth={2.5} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#7A4FFF] font-mono">프로젝트_제안서</span>
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter text-zinc-950">
                            프로젝트 <span className="text-zinc-400">제안 보내기</span>
                        </h3>
                        {targetName && (
                            <div className="mt-2 flex items-center gap-2 px-2.5 py-1 bg-zinc-50 border border-zinc-100 rounded-xl w-fit">
                                <Sparkles size={12} className="text-[#FF7D00]" />
                                <p className="text-[11px] font-bold text-zinc-600">
                                    대상 요원: <span className="text-zinc-950 font-black">{targetName}</span>
                                </p>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="닫기"
                        className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 transition-all hover:bg-zinc-900 hover:text-white"
                    >
                        <XCircle size={20} />
                    </button>
                </div>

                {/* Mode Selector */}
                <div className="mt-6 grid grid-cols-2 gap-1.5 rounded-xl bg-zinc-100 p-1">
                    <button
                        type="button"
                        onClick={() => onChangeMode('PROJECT')}
                        className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                            mode === 'PROJECT'
                                ? 'bg-white text-zinc-950 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                    >
                        <Briefcase size={12} />
                        프로젝트 선택
                    </button>
                    <button
                        type="button"
                        onClick={() => onChangeMode('FORM')}
                        className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                            mode === 'FORM'
                                ? 'bg-white text-zinc-950 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                    >
                        <FileText size={12} />
                        제안서 직접 작성
                    </button>
                </div>
            </div>

            {/* Scrollable Content section */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 pt-0 space-y-5">
                {/* Project Selection or Info */}
                <div>
                    <div className="mb-1.5 flex items-center gap-2">
                        <Target size={12} className="text-[#7A4FFF]" />
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">연결_프로젝트</label>
                    </div>
                    {mode === 'PROJECT' ? (
                        <div className="relative">
                            {projectsLoading ? (
                                <div className="flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 animate-pulse font-mono">
                                    진행_중인_프로젝트_조회_중...
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center">
                                    <Briefcase size={20} className="mb-2 text-zinc-200" />
                                    <p className="text-[10px] font-bold text-zinc-400 leading-relaxed">
                                        연결할 수 있는 프로젝트가 없습니다.<br />
                                        '제안서 직접 작성' 모드를 이용해 주세요.
                                    </p>
                                </div>
                            ) : (
                                <select
                                    value={selectedProjectId ?? ''}
                                    onChange={(e) => onChangeProjectId(Number(e.target.value))}
                                    className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-900 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white focus:ring-4 focus:ring-purple-50"
                                >
                                    <option value="" disabled>제안할 프로젝트를 선택해 주세요</option>
                                    {projects.map((p) => (
                                        <option key={p.projectId} value={p.projectId}>
                                            {p.projectName}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-3">
                            <Sparkles size={16} className="text-[#FF7D00]" />
                            <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">
                                제안 전송 시 입력하신 정보를 기반으로 <br />
                                <span className="text-[#FF7D00]">전용 프로젝트가 자동으로 생성</span>됩니다.
                            </p>
                        </div>
                    )}
                </div>

                {/* Offered Price */}
                <div>
                    <div className="mb-1.5 flex items-center gap-2">
                        <DollarSign size={12} className="text-[#FF7D00]" />
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">제안_금액</label>
                    </div>
                    <div className="group relative">
                        <input
                            type="number"
                            min={1}
                            value={offeredPrice}
                            onChange={(e) => onChangeOfferedPrice(e.target.value)}
                            placeholder="예: 3,000,000"
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 pr-12 text-base font-black text-zinc-950 outline-none transition-all placeholder:text-zinc-300 focus:border-[#FF7D00] focus:bg-white focus:ring-4 focus:ring-orange-50"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">원</span>
                    </div>
                </div>

                {/* Mode Specific Fields */}
                {mode === 'FORM' && (
                    <div className="grid gap-5">
                        <div>
                            <div className="mb-1.5 flex items-center gap-2">
                                <Target size={12} className="text-zinc-400" />
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">모집_포지션</label>
                            </div>
                            <input
                                type="text"
                                value={positionTitle}
                                onChange={(e) => onChangePositionTitle(e.target.value)}
                                placeholder="예: 프론트엔드 리드 개발자"
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-950 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="mb-1.5 flex items-center gap-2">
                                    <Clock size={12} className="text-zinc-400" />
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">예상_작업_기간</label>
                                </div>
                                <input
                                    type="text"
                                    value={workingPeriod}
                                    onChange={(e) => onChangeWorkingPeriod(e.target.value)}
                                    placeholder="예: 6주"
                                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-950 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white"
                                />
                            </div>
                            <div>
                                <div className="mb-1.5 flex items-center gap-2">
                                    <FileText size={12} className="text-zinc-400" />
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">주요_업무_범위</label>
                                </div>
                                <textarea
                                    value={workScope}
                                    onChange={(e) => onChangeWorkScope(e.target.value)}
                                    rows={1}
                                    placeholder="주요 업무 내용 요약"
                                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-950 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white resize-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Message */}
                <div>
                    <div className="mb-1.5 flex items-center gap-2">
                        <MessageSquare size={12} className="text-zinc-400" />
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">
                            {mode === 'PROJECT' ? '상세_제안_내용' : '상세_문의_사항'}
                        </label>
                    </div>
                    <textarea
                        value={message}
                        onChange={(e) => onChangeMessage(e.target.value)}
                        rows={3}
                        placeholder="프리랜서에게 전달할 구체적인 제안 내용을 입력해 주세요."
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-950 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white resize-none"
                    />
                </div>
            </div>

            {/* Actions - Fixed Footer */}
            <div className="p-6 md:p-8 flex-none border-t border-zinc-100 bg-zinc-50/50 backdrop-blur-sm">
                <div className="flex flex-col-reverse md:flex-row justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-6 py-3 text-xs font-black text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-600 font-mono uppercase tracking-widest"
                    >
                        취소하기
                    </button>
                    <button
                        type="button"
                        onClick={onSend}
                        disabled={
                            sending ||
                            (mode === 'PROJECT' &&
                                (projectsLoading || projects.length === 0 || selectedProjectId == null))
                        }
                        className="group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-zinc-950 px-8 py-3.5 text-xs font-black text-white transition-all hover:bg-[#7A4FFF] hover:shadow-[0_8px_25px_rgba(122,79,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {sending ? (
                            <>
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                <span>전송 중...</span>
                            </>
                        ) : (
                            <>
                                <Send size={14} strokeWidth={2.5} />
                                <span>제안 전송하기</span>
                            </>
                        )}
                        
                        {/* Shimmer effect on hover */}
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shimmer" />
                    </button>
                </div>
            </div>
        </div>
    );
}

