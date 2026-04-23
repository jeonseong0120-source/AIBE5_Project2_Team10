'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import ModeToggle from '@/components/common/ModeToggle';
import { Search, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveRole, setActiveRole } from '@/app/lib/auth';

export interface UserData {
    role: 'CLIENT' | 'FREELANCER' | 'BOTH';
    nickname?: string;
    name?: string;
    profileImage?: string;
    imageUrl?: string;
}

export interface ProfileData {
    logoUrl?: string;
    profileImageUrl?: string;
}

interface GlobalNavbarProps {
    user: UserData | null;
    profile?: ProfileData | null;
}

export default function GlobalNavbar({ user, profile }: GlobalNavbarProps) {
    const pathname = usePathname();
    const router = useRouter();

    // 🎯 1. 컴포넌트 마운트 상태 추적
    const [isMounted, setIsMounted] = useState(false);
    const [currentMode, setCurrentMode] = useState<'CLIENT' | 'FREELANCER'>('CLIENT'); // 기본값으로 초기화

    // 🎯 2. 마운트 완료 시에만 로컬스토리지/세션 접근 허용 (Hydration 에러 방지)
    useEffect(() => {
        setIsMounted(true);
        if (pathname?.startsWith('/client')) {
            setActiveRole('CLIENT');
            setCurrentMode('CLIENT');
        } else if (pathname?.startsWith('/freelancer')) {
            setActiveRole('FREELANCER');
            setCurrentMode('FREELANCER');
        } else {
            setCurrentMode(getActiveRole() || 'CLIENT');
        }
    }, [pathname]);

    // 🎯 3. 마운트 전(서버 렌더링 시점)에는 빈 껍데기 네비게이션을 보여주어 에러 방지
    if (!isMounted) {
        return (
            <>
                <div className="h-24 w-full" />
                <nav className="fixed top-0 left-0 w-full h-24 flex justify-center items-center z-50 bg-white/60 backdrop-blur-xl border-b border-white/40" />
            </>
        );
    }

    const isClientPage = currentMode === 'CLIENT';
    const accentColor = isClientPage ? '#FF7D00' : '#7A4FFF';
    const buttonBg = isClientPage
        ? 'linear-gradient(135deg, #FF7D00 0%, #FF9E45 100%)'
        : 'linear-gradient(135deg, #7A4FFF 0%, #A385FF 100%)';
    const buttonShadow = isClientPage
        ? 'rgba(255, 125, 0, 0.3)'
        : 'rgba(122, 79, 255, 0.3)';

    const menus = isClientPage
        ? [
            { label: 'DASHBOARD', path: '/client/dashboard' },
            { label: 'EXPLORE', path: '/client/mainpage' },
            { label: 'COMMUNITY', path: '/community' },
        ]
        : [
            { label: 'DASHBOARD', path: '/freelancer/dashboard' },
            { label: 'EXPLORE', path: '/freelancer/explore' },
            { label: 'COMMUNITY', path: '/community' },
        ];

    const userImg = isClientPage
        ? (profile?.logoUrl || user?.profileImage || user?.imageUrl)
        : (profile?.profileImageUrl || user?.profileImage || user?.imageUrl);
    const userName = user?.nickname || user?.name || (isClientPage ? 'C' : 'F');

    return (
        <>
            <div className="h-24 w-full" />
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 left-0 w-full h-24 flex justify-center items-center z-50 font-sans"
            >
                <div className="absolute inset-0 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)]" />

                <div className="relative z-10 w-full max-w-7xl px-8 flex justify-between items-center">
                    <button
                        className="cursor-pointer flex items-center group overflow-visible outline-none focus-visible:ring-4 focus-visible:ring-zinc-950/10 rounded-2xl transition-all"
                        onClick={() => router.push(isClientPage ? "/client/mainpage" : "/freelancer/explore")}
                        aria-label="DevNear Home"
                    >
                        <div className="relative h-28 w-[400px] ml-[-40px]">
                            <img
                                src="/devnear-logo.png"
                                alt="DevNear"
                                className="h-full w-full object-contain object-left transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                            />
                        </div>
                    </button>

                    <div className="flex gap-10 items-center">
                        <div className="hidden lg:flex items-center gap-10">
                            {menus.map((item) => {
                                const isActive = pathname === item.path;
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => router.push(item.path)}
                                        className={`group relative py-2 text-[11px] font-bold tracking-[0.2em] transition-all uppercase font-mono ${isActive ? 'text-zinc-950' : 'text-zinc-400 hover:text-zinc-600'}`}
                                    >
                                    <span className={isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}>
                                        {item.label}
                                    </span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-glow"
                                                className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full blur-[1px]"
                                                style={{ backgroundColor: accentColor }}
                                            />
                                        )}
                                        <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-zinc-950 transition-all duration-300 group-hover:w-full opacity-20" />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="hidden sm:flex items-center justify-center min-w-[44px]">
                                {user?.role === 'BOTH' && (
                                    <div className="p-1 bg-zinc-100/50 rounded-full border border-white/50 backdrop-blur-sm">
                                        <ModeToggle role={user.role} />
                                    </div>
                                )}
                            </div>

                            <div className="w-10 flex justify-center relative hover:scale-110 transition-transform cursor-pointer">
                                <NotificationBell />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, translateY: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push(isClientPage ? "/client/projects/new" : `/freelancer/mypage?tab=portfolio&_t=${Date.now()}`)}
                                style={{
                                    background: buttonBg,
                                    boxShadow: `0 10px 20px -5px ${buttonShadow}`
                                }}
                                className="relative overflow-hidden w-[160px] py-3.5 text-white rounded-2xl text-[11px] font-bold tracking-[0.15em] transition-all flex items-center justify-center gap-2.5 uppercase font-mono shadow-lg"
                            >
                                <motion.div
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none"
                                />
                                <Plus size={15} />
                                <span className="relative z-10">{isClientPage ? "Add Project" : "Add Portfolio"}</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative flex-shrink-0 w-11 h-11 rounded-[14px] overflow-hidden cursor-pointer shadow-lg border-2 border-white transition-all group outline-none focus-visible:ring-4 focus-visible:ring-zinc-950/10"
                                style={{ backgroundColor: accentColor }}
                                onClick={() => router.push(isClientPage ? '/client/mypage' : '/freelancer/mypage')}
                                aria-label="Open My Page"
                            >
                                <AnimatePresence mode="wait">
                                    {userImg ? (
                                        <motion.img
                                            key="avatar"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            src={userImg}
                                            alt="Profile"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <motion.div
                                            key="initials"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="w-full h-full flex items-center justify-center text-white font-bold"
                                        >
                                            {userName.charAt(0).toUpperCase()}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.nav>
        </>
    );
}