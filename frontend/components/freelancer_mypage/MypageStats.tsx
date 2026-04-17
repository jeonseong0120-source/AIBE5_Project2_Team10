'use client';

import { Send, Inbox, Star } from 'lucide-react';

interface MypageStatsProps {
    receivedProposalCount?: number;
}

export default function MypageStats({ receivedProposalCount = 0 }: MypageStatsProps) {
    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between w-full h-full gap-6 md:gap-0 md:divide-x divide-zinc-100">
                {/* 지원 현황 */}
                <div className="flex-1 flex items-center gap-5 md:justify-center">
                    <div className="w-14 h-14 rounded-full bg-[#ff5a5f] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Send size={24} className="-ml-1" />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-[13px] font-bold text-zinc-500 mb-1">지원 현황</span>
                        <span className="text-2xl font-black text-zinc-900 leading-none font-mono">0</span>
                    </div>
                </div>
                
                {/* 받은 제안 */}
                <div className="flex-1 flex items-center gap-5 md:justify-center">
                    <div className="w-14 h-14 rounded-full bg-[#00b4ff] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Inbox size={24} />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-[13px] font-bold text-zinc-500 mb-1">받은 제안</span>
                        <span className="text-2xl font-black text-zinc-900 leading-none font-mono">{receivedProposalCount}</span>
                    </div>
                </div>
                
                {/* 스크랩 */}
                <div className="flex-1 flex items-center gap-5 md:justify-center">
                    <div className="w-14 h-14 rounded-full bg-[#ffa900] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Star size={24} className="fill-current" />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-[13px] font-bold text-zinc-500 mb-1">스크랩 (관심 공고)</span>
                        <span className="text-2xl font-black text-zinc-900 leading-none font-mono">0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
