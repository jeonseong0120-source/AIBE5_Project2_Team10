'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout } from '@/app/lib/authEvents';
import { motion } from 'framer-motion';
interface MypageSidebarProps {
    tabs: { id: string, label: string, icon: any }[];
    activeTab: string;
    setActiveTab: (tabId: string) => void;
    accentColor?: string; // Optional accent color (e.g., #FF7D00 for client, #7A4FFF for freelancer)
}

export default function MypageSidebar({ tabs, activeTab, setActiveTab, accentColor = '#FF7D00' }: MypageSidebarProps) {
    const router = useRouter();

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
