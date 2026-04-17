'use client';

import { MessageCircle, CheckCircle2, XCircle } from 'lucide-react';

type ReceivedProposal = {
    proposalId: number;
    projectId: number;
    projectName: string;
    clientProfileId: number;
    clientName: string;
    offeredPrice: number;
    message?: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    statusDescription: string;
    createdAt: string;
};

interface Props {
    proposals: ReceivedProposal[];
    statusLoadingById: Record<number, boolean>;
    inquireLoadingById: Record<number, boolean>;
    onRespond: (proposalId: number, status: 'ACCEPTED' | 'REJECTED') => void;
    onInquire: (proposalId: number) => void;
}

export default function MypageProposalTab({
    proposals,
    statusLoadingById,
    inquireLoadingById,
    onRespond,
    onInquire,
}: Props) {
    if (!proposals.length) {
        return (
            <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-20 text-center">
                <p className="text-xl font-black text-zinc-300">받은 제안이 없습니다.</p>
                <p className="mt-2 text-sm font-medium text-zinc-400">클라이언트 제안이 도착하면 여기서 확인할 수 있어요.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {proposals.map((proposal) => {
                const statusLoading = !!statusLoadingById[proposal.proposalId];
                const inquireLoading = !!inquireLoadingById[proposal.proposalId];

                return (
                    <div key={proposal.proposalId} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">From {proposal.clientName}</p>
                                <h3 className="text-xl font-black text-zinc-900">{proposal.projectName}</h3>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-black ${proposal.status === 'PENDING' ? 'bg-zinc-100 text-zinc-600' : proposal.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                {proposal.statusDescription}
                            </span>
                        </div>

                        <div className="rounded-xl bg-zinc-50 p-4">
                            <p className="text-sm font-bold text-zinc-700">제안 금액: ₩{proposal.offeredPrice?.toLocaleString()}</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                                {proposal.message || '전달된 메시지가 없습니다.'}
                            </p>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                            <button
                                onClick={() => onInquire(proposal.proposalId)}
                                disabled={inquireLoading}
                                className="inline-flex items-center gap-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                            >
                                <MessageCircle size={16} />
                                {inquireLoading ? '문의 연결 중...' : '문의하기'}
                            </button>

                            {proposal.status === 'PENDING' ? (
                                <>
                                    <button
                                        onClick={() => onRespond(proposal.proposalId, 'REJECTED')}
                                        disabled={statusLoading}
                                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                                    >
                                        <XCircle size={16} />
                                        거절
                                    </button>
                                    <button
                                        onClick={() => onRespond(proposal.proposalId, 'ACCEPTED')}
                                        disabled={statusLoading}
                                        className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-[#FF7D00] disabled:opacity-50"
                                    >
                                        <CheckCircle2 size={16} />
                                        수락
                                    </button>
                                </>
                            ) : (
                                <div className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-500">
                                    이미 처리된 제안입니다.
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

