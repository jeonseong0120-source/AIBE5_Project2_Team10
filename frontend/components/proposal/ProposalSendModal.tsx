'use client';

import { XCircle } from 'lucide-react';

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
        <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 md:p-8">
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h3 className="text-2xl font-black text-zinc-900">프리랜서 제안 보내기</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                        {targetName
                            ? `대상: ${targetName}`
                            : '프로젝트를 선택하거나 제안서 전용 프로젝트를 만들어 전송하세요.'}
                    </p>
                </div>
                <button type="button" onClick={onClose} className="rounded-full p-1 text-zinc-400 transition hover:text-zinc-800">
                    <XCircle size={28} />
                </button>
            </div>

            <div className="mb-5 flex gap-2 rounded-2xl bg-zinc-100 p-1">
                <button
                    type="button"
                    onClick={() => onChangeMode('PROJECT')}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider ${mode === 'PROJECT' ? 'bg-zinc-950 text-white' : 'text-zinc-500'}`}
                >
                    프로젝트 선택
                </button>
                <button
                    type="button"
                    onClick={() => onChangeMode('FORM')}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider ${mode === 'FORM' ? 'bg-zinc-950 text-white' : 'text-zinc-500'}`}
                >
                    제안서 양식 작성
                </button>
            </div>

            <div className="space-y-4">
                {mode === 'PROJECT' ? (
                    <div>
                        <label className="mb-1 block text-xs font-bold text-zinc-600">연결할 프로젝트</label>
                        {projectsLoading ? (
                            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-400">
                                프로젝트 목록을 불러오는 중...
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                                등록된 프로젝트가 없습니다. 프로젝트 선택 모드에서는 프로젝트가 필요합니다.
                            </div>
                        ) : (
                            <select
                                value={selectedProjectId ?? ''}
                                onChange={(e) => onChangeProjectId(Number(e.target.value))}
                                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#FF7D00]"
                            >
                                <option value="" disabled>
                                    프로젝트를 선택하세요
                                </option>
                                {projects.map((p) => (
                                    <option key={p.projectId} value={p.projectId}>
                                        {p.projectName}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                        양식 기반 제안서는 전송 시 전용 프로젝트가 자동 생성됩니다.
                    </div>
                )}

                <div>
                    <label className="mb-1 block text-xs font-bold text-zinc-600">제안 금액 (원, 1원 이상)</label>
                    <input
                        type="number"
                        min={1}
                        value={offeredPrice}
                        onChange={(e) => onChangeOfferedPrice(e.target.value)}
                        placeholder="예: 3000000"
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#FF7D00]"
                    />
                </div>

                {mode === 'FORM' && (
                    <>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-zinc-600">포지션명</label>
                            <input
                                type="text"
                                value={positionTitle}
                                onChange={(e) => onChangePositionTitle(e.target.value)}
                                placeholder="예: 프론트엔드 리드 개발자"
                                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#FF7D00]"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-zinc-600">업무 범위</label>
                            <textarea
                                value={workScope}
                                onChange={(e) => onChangeWorkScope(e.target.value)}
                                rows={3}
                                placeholder="예: 대시보드 리팩터링, API 연동, 테스트 코드 작성"
                                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#FF7D00]"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-zinc-600">예상 기간</label>
                            <input
                                type="text"
                                value={workingPeriod}
                                onChange={(e) => onChangeWorkingPeriod(e.target.value)}
                                placeholder="예: 6주"
                                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#FF7D00]"
                            />
                        </div>
                    </>
                )}

                <div>
                    <label className="mb-1 block text-xs font-bold text-zinc-600">추가 메시지</label>
                    <textarea
                        value={message}
                        onChange={(e) => onChangeMessage(e.target.value)}
                        rows={4}
                        placeholder="프리랜서에게 전달할 제안 메시지를 입력하세요."
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#FF7D00]"
                    />
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={onClose} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-600">
                    취소
                </button>
                <button
                    type="button"
                    onClick={onSend}
                    disabled={
                        sending ||
                        (mode === 'PROJECT' &&
                            (projectsLoading || projects.length === 0 || selectedProjectId == null))
                    }
                    className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-black text-white transition hover:bg-[#FF7D00] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {sending ? '전송 중...' : '제안 전송'}
                </button>
            </div>
        </div>
    );
}
