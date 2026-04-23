'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserData, ProfileData } from './GlobalNavbar';

interface TabItem<T extends string> {
    id: T;
    label: string;
    icon: React.ReactNode;
    badge?: number;
}

interface DashboardSidebarProps<T extends string> {
    activeTab: T;
    onTabChange: (id: T) => void;
    tabs: TabItem<T>[];
    mode: 'CLIENT' | 'FREELANCER';
    ctaLabel: string;
    ctaIcon: React.ReactNode;
    onCtaClick: () => void;
    user: UserData | null;
    profile?: ProfileData | null;
}

export default function DashboardSidebar<T extends string>({
    activeTab,
    onTabChange,
    tabs,
    mode,
    ctaLabel,
    ctaIcon,
    onCtaClick,
    user,
    profile
}: DashboardSidebarProps<T>) {
    const router = useRouter();
    const isClient = mode === 'CLIENT';
    const accentColor = isClient ? '#FF7D00' : '#7A4FFF';
    const accentBg = isClient ? 'bg-[#FF7D00]' : 'bg-[#7A4FFF]';
    const accentText = isClient ? 'text-[#FF7D00]' : 'text-[#7A4FFF]';
    const accentShadow = isClient ? 'shadow-orange-500/20' : 'shadow-purple-500/20';

    const userImg = isClient
        ? (profile?.logoUrl || user?.profileImage || user?.imageUrl)
        : (profile?.profileImageUrl || user?.profileImage || user?.imageUrl);
    const userName = user?.nickname || user?.name || 'User';

    return (
        <aside className="w-full lg:w-72 flex flex-col gap-8 h-fit lg:sticky lg:top-32">
            {/* 🚀 Main CTA Button */}
            <motion.button
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCtaClick}
                className={`group relative overflow-hidden flex items-center justify-center gap-3 w-full py-5.5 ${accentBg} text-white rounded-[2rem] text-[16px] font-black transition-all shadow-2xl ${accentShadow} tracking-tighter`}
            >
                <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none"
                />
                <span className="relative z-10 flex items-center gap-3">
                    {ctaIcon} {ctaLabel}
                </span>
            </motion.button>

            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-3 shadow-xl shadow-zinc-200/40">
                <div className="flex flex-col gap-1.5">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`group relative flex items-center justify-between w-full px-6 py-5 rounded-[1.4rem] transition-all duration-300 ${
                                    isActive
                                        ? 'text-zinc-950'
                                        : 'text-zinc-400 hover:text-zinc-600 hover:bg-white/60'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active-bg"
                                        className="absolute inset-0 bg-white shadow-lg shadow-zinc-200/50 rounded-[1.4rem] border border-zinc-100/50"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}

                                <div className="relative z-10 flex items-center gap-4">
                                    <span className={`transition-colors duration-300 ${isActive ? accentText : 'group-hover:text-zinc-600'}`}>
                                        {tab.icon}
                                    </span>
                                    <span className={`text-[15px] font-bold tracking-tight transition-colors duration-300 ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                                        {tab.label}
                                    </span>
                                </div>

                                <div className="relative z-10 flex items-center gap-3">
                                    {tab.badge !== undefined && tab.badge > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[8px] font-bold text-white ${accentBg} shadow-sm`}
                                        >
                                            {tab.badge}
                                        </motion.span>
                                    )}
                                    <ChevronRight 
                                        size={14} 
                                        className={`transition-all duration-300 ${isActive ? `opacity-100 ${accentText} translate-x-0` : 'opacity-0 -translate-x-2'}`}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

        </aside>
    );
}
