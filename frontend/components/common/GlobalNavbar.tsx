'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import ModeToggle from '@/components/common/ModeToggle';
import { Search, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveRole, setActiveRole } from '@/app/lib/auth';

// 🎯 명확한 인터페이스 정의
interface UserData {
    role: 'CLIENT' | 'FREELANCER' | 'BOTH';
    nickname?: string;
    name?: string;
    profileImage?: string;
    imageUrl?: string;
}

interface ProfileData {
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
    const [currentMode, setCurrentMode] = useState<'CLIENT' | 'FREELANCER'>('FREELANCER');

    useEffect(() => {
        if (pathname?.startsWith('/client')) {
            setActiveRole('CLIENT');
            setCurrentMode('CLIENT');
        } else if (pathname?.startsWith('/freelancer')) {
            setActiveRole('FREELANCER');
            setCurrentMode('FREELANCER');
        } else {
            setCurrentMode(getActiveRole());
        }
    }, [pathname]);

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
        <motion.nav 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full h-24 flex justify-center items-center sticky top-0 z-50 font-sans"
        >
            {/* 배경 레이어: 더 정교한 글래스모피즘 (전체 너비 유지) */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)]" />
            
            {/* 🎯 본문 라인과 일치시키기 위한 내부 컨테이너 (max-w-7xl) */}
            <div className="relative z-10 w-full max-w-7xl px-8 flex justify-between items-center">
                {/* 좌측: 로고 (Pop-out 디자인 및 정밀 라인 정렬) */}
                <div 
                    className="cursor-pointer flex items-center group overflow-visible"
                    onClick={() => router.push(isClientPage ? "/client/mainpage" : "/freelancer/explore")}
                >
                    <div className="relative h-28 w-[400px] ml-[-40px]">
                        <img 
                            src="/devnear-logo.png" 
                            alt="DevNear" 
                            className="h-full w-full object-contain object-left transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                        />
                    </div>
                </div>

                {/* 우측: 메뉴 및 유저 세션 */}
                <div className="flex gap-10 items-center">
                    {/* 메인 네비게이션 */}
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
                        {/* 역할 전환 토글 (유무에 따른 위치 변화 방지) */}
                        <div className="hidden sm:flex items-center justify-center min-w-[44px]">
                            {user?.role === 'BOTH' && (
                                <div className="p-1 bg-zinc-100/50 rounded-full border border-white/50 backdrop-blur-sm">
                                    <ModeToggle role={user.role} />
                                </div>
                            )}
                        </div>
                        
                        {/* 알림 벨 (고정 너비 확보) */}
                        <div className="w-10 flex justify-center relative hover:scale-110 transition-transform cursor-pointer">
                            <NotificationBell />
                        </div>

                        {/* 프리미엄 액션 버튼 (가로 길이 160px 고정으로 모드 간 간격 동일화) */}
                        <motion.button
                            whileHover={{ scale: 1.02, translateY: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push(isClientPage ? "/client/projects/new" : "/freelancer/explore")}
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
                            
                            {isClientPage ? <Plus size={15} /> : <Search size={15} />}
                            <span className="relative z-10">{isClientPage ? "Hire Talent" : "Find Mission"}</span>
                        </motion.button>

                        {/* 유저 프로필 (고정 크기) */}
                        <motion.div
                            className="relative flex-shrink-0 w-11 h-11 rounded-[14px] overflow-hidden cursor-pointer shadow-lg border-2 border-white transition-all group"
                            style={{ backgroundColor: accentColor }}
                            onClick={() => router.push(isClientPage ? '/client/mypage' : '/freelancer/mypage')}
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
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}