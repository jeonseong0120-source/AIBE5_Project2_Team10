'use client';

import { LogOut, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout } from '@/app/lib/authEvents';
import api from '@/app/lib/axios';
import { motion } from 'framer-motion';
import { useState } from 'react';
interface MypageSidebarProps {
    tabs: { id: string, label: string, icon: any }[];
    activeTab: string;
    setActiveTab: (tabId: string) => void;
    accentColor?: string; // Optional accent color (e.g., #FF7D00 for client, #7A4FFF for freelancer)
}

export default function MypageSidebar({ tabs, activeTab, setActiveTab, accentColor = '#FF7D00' }: MypageSidebarProps) {
    const router = useRouter();
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const handleWithdraw = async () => {
        if (isWithdrawing) return;
        const confirmed = confirm('정말 회원 탈퇴하시겠습니까?\n탈퇴 후에는 계정을 복구할 수 없습니다.');
        if (!confirmed) return;

        try {
            setIsWithdrawing(true);
            await api.delete('/v1/users/me/account');
            alert('회원 탈퇴가 완료되었습니다.');
            logout();
            router.push('/login');
        } catch (error: any) {
            const message = error?.response?.data?.message || '회원 탈퇴에 실패했습니다. 조건을 확인해주세요.';
            alert(message);
            setIsWithdrawing(false);
        }
    };

    return (
        <aside className="space-y-6 lg:sticky lg:top-[136px] lg:self-start">
            {/* Main Navigation Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-4 border border-zinc-200/50 shadow-xl shadow-zinc-200/40">
                <div className="flex flex-col gap-2">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`group relative flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black tracking-[0.2em] transition-all duration-300 uppercase font-mono ${activeTab === tab.id
                                    ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200'
                                    : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900'
                                }`}
                        >
                            <tab.icon
                                size={18}
                                className={`transition-colors duration-300 ${activeTab === tab.id ? '' : 'group-hover:text-zinc-900'
                                    }`}
                                style={{ color: activeTab === tab.id ? accentColor : undefined }}
                            />
                            {tab.label}

                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute right-4 w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: accentColor }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Logout Section */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-2 border border-zinc-100 shadow-sm">
                <button
                    onClick={() => { if (confirm('로그아웃 하시겠습니까?')) { logout(); router.push('/login'); } }}
                    className="w-full flex items-center gap-3 p-4 hover:bg-red-50 rounded-xl transition-all duration-300 text-[10px] font-black text-red-400 hover:text-red-500 uppercase font-mono tracking-widest"
                >
                    <LogOut size={16} />
                    SIGN_OUT
                </button>
                <button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                    className="w-full mt-2 flex items-center gap-3 p-4 hover:bg-rose-50 rounded-xl transition-all duration-300 text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase font-mono tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <UserX size={16} />
                    {isWithdrawing ? 'WITHDRAWING...' : 'WITHDRAW'}
                </button>
            </div>

            {/* System Status (Subtle aesthetic addition) */}
            <div className="px-6 py-2">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black text-zinc-300 uppercase font-mono tracking-tighter">System_Online_v1.0</span>
                </div>
            </div>
        </aside>
    );
}
