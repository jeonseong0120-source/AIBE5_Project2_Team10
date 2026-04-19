'use client';

import { useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import { motion } from 'framer-motion';

interface NavItem {
    label: string;
    path: string;
    active?: boolean;
}

interface MypageNavbarProps {
    userType: 'CLIENT' | 'FREELANCER';
    userName?: string;
    profileImage?: string;
    navItems: NavItem[];
    actionButton?: {
        label: string;
        path: string;
        icon?: any;
    };
    accentColor?: string;
}

export default function MypageNavbar({
                                         userType,
                                         userName,
                                         profileImage,
                                         navItems,
                                         actionButton,
                                         accentColor = '#FF7D00'
                                     }: MypageNavbarProps) {
    const router = useRouter();

    return (
        <nav className="w-full py-6 px-10 bg-white/70 backdrop-blur-2xl border-b border-zinc-200/50 flex justify-between items-center sticky top-0 z-50 shadow-sm">

            {/* 🎨 [로고 영역 수정 완료] 텍스트 날림 + h-12 확대 + flex-shrink-0 */}
            <div
                className="cursor-pointer group flex items-center"
                onClick={() => router.push(userType === 'CLIENT' ? "/client/mainpage" : "/freelancer/explore")}
            >
                <img
                    src="/devnear-logo.png"
                    alt="DevNear_Logo"
                    className="h-14 w-auto object-contain flex-shrink-0 scale-[1.9] origin-left group-hover:scale-[1.6] transition-transform"
                />
            </div>

            {/* Navigation & Profile */}
            <div className="flex gap-4 items-center relative z-10 md:gap-8">
                <div className="hidden md:flex gap-8 mr-4">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => router.push(item.path)}
                            className={`text-[10px] font-black tracking-[0.2em] transition uppercase font-mono ${
                                item.active
                                    ? 'text-zinc-950'
                                    : 'text-zinc-400 hover:text-zinc-950'
                            }`}
                        >
                            {item.label}
                            {item.active && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-0.5 w-full mt-1"
                                    style={{ backgroundColor: accentColor }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <NotificationBell />

                    {actionButton && (
                        <button
                            onClick={() => router.push(actionButton.path)}
                            className="hidden md:flex px-6 py-2.5 bg-zinc-950 text-white rounded-xl text-[10px] font-black tracking-widest hover:scale-105 transition-all shadow-xl shadow-zinc-200 items-center gap-2 uppercase font-mono"
                            style={{ backgroundColor: accentColor }}
                        >
                            {actionButton.icon && <actionButton.icon size={14} />}
                            {actionButton.label}
                        </button>
                    )}

                    <div
                        className="w-10 h-10 rounded-full border-2 border-white shadow-xl overflow-hidden flex items-center justify-center text-white font-black text-sm font-mono cursor-pointer hover:ring-2 transition-all"
                        style={{ backgroundColor: accentColor }}
                        onClick={() => router.push(userType === 'CLIENT' ? '/client/mypage' : '/freelancer/mypage')}
                    >
                        {profileImage ? (
                            <img src={profileImage} alt="User Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span>{userName?.charAt(0).toUpperCase() || (userType === 'CLIENT' ? 'C' : 'F')}</span>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}