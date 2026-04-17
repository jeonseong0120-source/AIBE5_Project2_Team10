'use client';

import { Award, Activity } from 'lucide-react';

interface MypageGradeTabProps {
    profile: any;
}

export default function MypageGradeTab({ profile }: MypageGradeTabProps) {
    const grade = profile?.gradeName || '일반';
    const isTopTalent = grade.includes('TOP Talent');
    const isAuthFreelancer = grade.includes('인증 프리랜서');
    const displayGrade = isTopTalent ? 'TOP Talent' : (isAuthFreelancer ? '인증 프리랜서' : '일반');
    
    const nextGoal = isTopTalent ? '최고 등급 달성' : (isAuthFreelancer ? '목표: 인증프리랜서 → TOP Talent' : '목표: 일반 → 인증프리랜서');
    const targetProjects = isAuthFreelancer || isTopTalent ? 10 : 3;
    const targetRating = isAuthFreelancer || isTopTalent ? 4.5 : 4.0;
    const pCompleted = profile?.completedProjects || 0;
    const pRating = profile?.averageRating || 0;

    return (
        <div className="py-10 space-y-12">
            <div className="flex flex-col items-center justify-center text-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-zinc-900 to-zinc-700 flex items-center justify-center text-[#FF7D00] shadow-2xl relative mb-6">
                    <Award size={44} className="relative z-10" />
                    <div className="absolute inset-0 border-[3px] border-[#FF7D00]/20 rounded-full animate-ping" />
                </div>
                <p className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase mb-2">등급 정보 / SECURITY_CLEARANCE</p>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tighter mb-4">
                    {displayGrade}
                </h2>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto font-medium">최고의 퍼포먼스를 보여주고 다음 등급으로 인증하여 클래스를 업그레이드 하세요.</p>
            </div>
            <div className="w-full bg-zinc-50 p-8 rounded-2xl border border-zinc-100">
                <div className="flex justify-between items-center mb-6 border-b border-zinc-200 pb-4">
                    <h3 className="text-xs font-black font-mono tracking-widest uppercase text-zinc-900 flex items-center gap-2">
                        <Activity size={14} className="text-[#7A4FFF]" /> NEXT_LEVEL_REQUIREMENTS
                    </h3>
                    <span className="text-[10px] font-bold text-[#FF7D00] bg-[#FF7D00]/10 px-2 py-1 rounded">{nextGoal}</span>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-zinc-500">완료한 프로젝트 ({targetProjects}건 이상)</span>
                            <span className="font-black text-sm text-zinc-900">{pCompleted} / {targetProjects}</span>
                        </div>
                        <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#7A4FFF]" style={{ width: `${Math.min(100, (pCompleted / targetProjects) * 100)}%` }} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-zinc-500">평균 평점 ({targetRating.toFixed(1)} 이상)</span>
                            <span className="font-black text-sm text-zinc-900">{pRating.toFixed(1)} / {targetRating.toFixed(1)}</span>
                        </div>
                        <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#FF7D00]" style={{ width: `${Math.min(100, (pRating / targetRating) * 100)}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
