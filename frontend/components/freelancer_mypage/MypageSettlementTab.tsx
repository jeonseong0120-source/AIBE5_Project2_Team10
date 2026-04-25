'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, CreditCard, ShieldCheck, HelpCircle, ArrowRight, Banknote, RefreshCw } from 'lucide-react';


interface MypageSettlementTabProps {
    profile: any;
}

export default function MypageSettlementTab({ profile }: MypageSettlementTabProps) {
    const balance = profile?.balance || 0;
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        // FIXME: 향후 실제 잔액 갱신 API 연동 필요 (현재는 UI 시뮬레이션만 제공)
        setTimeout(() => setIsRefreshing(false), 800);
    };

    return (
        <div className="space-y-10">
            {/* 🏷️ HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter text-zinc-900">나의 정산 관리</h2>
                    <p className="text-sm text-zinc-500 mt-2 font-medium">실시간 정산 현황과 지갑 잔액을 관리하세요.</p>
                </div>
                <div className="px-5 py-2 bg-purple-50 text-[#7A4FFF] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-purple-100">
                    <ShieldCheck size={14} /> 보안 에스크로 시스템
                </div>
            </div>

            {/* 💰 MAIN WALLET CARD */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-10 md:p-14 text-white shadow-2xl shadow-purple-200/20"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10">
                            <Wallet className="text-[#A78BFA]" size={24} />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider text-white/60">출금 가능한 잔액</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-6xl md:text-7xl font-black tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                    {balance.toLocaleString()}
                                </span>
                                <span className="text-2xl font-black text-white/40">원</span>
                            </div>
                            <p className="text-xs text-white/40 mt-4 font-medium flex items-center gap-2">
                                <ShieldCheck size={12} className="text-[#A78BFA]" /> 클라이언트의 리뷰가 완료되면 즉시 지갑으로 입금됩니다.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                disabled 
                                className="relative group h-16 px-10 bg-white/50 text-zinc-500 rounded-[2rem] text-sm font-black shadow-xl shadow-black/10 flex items-center gap-3 cursor-not-allowed"
                            >
                                <Banknote size={18} /> 출금 신청하기
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs py-2 px-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none before:absolute before:bottom-[-4px] before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-zinc-900 shadow-xl">
                                    서비스 준비 중입니다
                                </div>
                            </button>
                            <button 
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white disabled:opacity-50"
                            >
                                <RefreshCw size={20} className={isRefreshing ? "animate-spin text-[#A78BFA]" : ""} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 📊 STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: '누적 수익금', value: `₩${balance.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: '이번 달 수익', value: '₩0', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: '평균 건당 수임료', value: '₩0', icon: Banknote, color: 'text-purple-500', bg: 'bg-purple-50' }
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="bg-white border border-zinc-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            <stat.icon size={20} />
                        </div>
                        <p className="text-[12px] font-bold text-zinc-400 uppercase tracking-tight mb-2">{stat.label}</p>
                        <p className="text-xl font-black text-zinc-900">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* ℹ️ SETTLEMENT POLICY SECTION */}
            <div className="bg-zinc-50 rounded-[2.5rem] p-10 border border-zinc-100 border-dashed">
                <div className="flex items-center gap-3 mb-6">
                    <HelpCircle size={20} className="text-zinc-400" />
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight">정산 및 출금 안내</h3>
                </div>
                <div className="space-y-4">
                    {[
                        { title: '실시간 정산 시스템', desc: '클라이언트가 프로젝트를 마감하고 리뷰를 남기면 즉시 자산으로 정산됩니다.' },
                        { title: '출금 한도', desc: '최소 출금 가능 금액은 10,000원이며, 1일 최대 1,000만원까지 신청 가능합니다.' },
                        { title: '수수료 안내', desc: '데브니어 플랫폼 결제 이용 수수료는 5%이며, 업계 최저 수준의 수수료로 프리랜서의 수익을 극대화합니다.' }
                    ].map((item, i) => (
                        <div key={i} className="flex gap-4 group">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#7A4FFF]/40 flex-shrink-0 group-hover:scale-150 transition-transform" />
                            <div>
                                <h4 className="text-sm font-black text-zinc-800">{item.title}</h4>
                                <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                <button className="mt-8 text-[13px] font-bold text-[#7A4FFF] flex items-center gap-2 hover:gap-3 transition-all tracking-tight group">
                    상세 정책 보기 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}
