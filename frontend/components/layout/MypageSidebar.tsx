'use client';

import { LogOut, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout } from '@/app/lib/authEvents';
import { motion } from 'framer-motion';
import { dnConfirm } from '@/lib/swal';

interface MypageSidebarProps {
    tabs: { id: string, label: string, icon: any }[];
    activeTab: string;
    setActiveTab: (tabId: string) => void;
    accentColor?: string; // Optional accent color (e.g., #FF7D00 for client, #7A4FFF for freelancer)
}

export default function MypageSidebar({ tabs, activeTab, setActiveTab, accentColor = '#FF7D00' }: MypageSidebarProps) {
    const router = useRouter();
    
    // Determine theme colors based on accentColor
    const isClient = accentColor === '#FF7D00';
    const accentBg = isClient ? 'bg-[#FF7D00]' : 'bg-[#7A4FFF]';
    const accentText = isClient ? 'text-[#FF7D00]' : 'text-[#7A4FFF]';
    const accentShadow = isClient ? 'shadow-orange-500/20' : 'shadow-purple-500/20';

    return (
        <aside className="flex flex-col gap-6 lg:sticky lg:top-[136px] lg:self-start w-full">
            {/* 💎 Main Navigation Card */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-3 border border-white/60 shadow-xl shadow-zinc-200/40">
                <div className="flex flex-col gap-1.5">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group relative flex items-center justify-between w-full px-6 py-5 rounded-[1.4rem] transition-all duration-300 ${
                                    isActive
                                        ? 'text-zinc-950'
                                        : 'text-zinc-400 hover:text-zinc-600 hover:bg-white/60'
                                }`}
                            >
                                {/* ✨ Active Background Pill */}
                                {isActive && (
                                    <motion.div
                                        layoutId="mypage-sidebar-active-bg"
                                        className="absolute inset-0 bg-white shadow-lg shadow-zinc-200/50 rounded-[1.4rem] border border-zinc-100/50"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}

                                <div className="relative z-10 flex items-center gap-4">
                                    <span className={`transition-colors duration-300 ${isActive ? accentText : 'group-hover:text-zinc-600'}`}>
                                        <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                    </span>
                                    <span className={`text-[14px] font-bold tracking-tight transition-colors duration-300 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                                        {tab.label}
                                    </span>
                                </div>

                                <div className="relative z-10 flex items-center">
                                    <ChevronRight 
                                        size={14} 
                                        className={`transition-all duration-300 ${
                                            isActive 
                                                ? `opacity-100 ${accentText} translate-x-0` 
                                                : 'opacity-0 -translate-x-2'
                                        }`}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 🚪 Logout Section */}
            <div className="bg-white/30 backdrop-blur-sm rounded-[1.8rem] p-2 border border-white/40 shadow-sm group">
                <button
                    onClick={async () => {
                        if (await dnConfirm('로그아웃 하시겠습니까?')) {
                            logout();
                            router.push('/');
                        }
                    }}
                    className="w-full flex items-center justify-center gap-3 py-4 hover:bg-red-50 rounded-[1.2rem] transition-all duration-300 text-[12px] font-bold text-zinc-400 hover:text-red-500 tracking-tight"
                >
                    <LogOut size={16} className="group-hover:rotate-12 transition-transform" />
                    로그아웃
                </button>
            </div>

            {/* 📟 System Status */}
            <div className="px-8 py-2">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                        <div className={`absolute inset-0 w-2 h-2 rounded-full ${accentBg} animate-ping opacity-40`} />
                        <div className={`relative w-2 h-2 rounded-full ${accentBg}`} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                        SECURE_ACCESS_v1.2
                    </span>
                </div>
            </div>
        </aside>
    );
}
