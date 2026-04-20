'use client';

import { usePathname, useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import ModeToggle from '@/components/common/ModeToggle';
import { Search, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

// 🎯 [수정] profile 속성을 인터페이스에 추가해서 TypeScript의 입을 막아줌
interface GlobalNavbarProps {
    user: any;
    profile?: any; // 👈
}

export default function GlobalNavbar({ user, profile }: GlobalNavbarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const isClientPage = pathname?.startsWith('/client');
    const themeColor = isClientPage ? 'text-[#FF7D00]' : 'text-[#7A4FFF]';
    const accentColor = isClientPage ? '#FF7D00' : '#7A4FFF';
    const buttonColor = isClientPage ? 'bg-[#FF7D00]' : 'bg-[#7A4FFF]';

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

    // 마이페이지 성공 로직 이식: logoUrl 최우선 확인
    const userImg = profile?.logoUrl || profile?.profileImageUrl || user?.profileImage || user?.imageUrl;
    const userName = user?.nickname || user?.name || (isClientPage ? 'C' : 'F');

    return (
        <nav className="w-full py-6 px-10 bg-white/70 backdrop-blur-2xl border-b border-zinc-200/50 flex justify-between items-center sticky top-0 z-50 shadow-sm font-sans">
            <div className="cursor-pointer group flex items-center" onClick={() => router.push(isClientPage ? "/client/mainpage" : "/freelancer/explore")}>
                <img src="/devnear-logo.png" alt="DevNear" className="h-14 w-auto object-contain flex-shrink-0 scale-[1.9] origin-left group-hover:scale-[2.0] transition-transform" />
            </div>

            <div className="flex gap-4 items-center relative z-10 md:gap-8">
                <div className="hidden md:flex gap-10 mr-4">
                    {menus.map((item) => (
                        <button key={item.label} onClick={() => router.push(item.path)} className={`text-sm font-black tracking-[0.1em] transition uppercase font-mono relative ${pathname === item.path ? 'text-zinc-950' : 'text-zinc-400 hover:text-zinc-950'}`}>
                            {item.label}
                            {pathname === item.path && (
                                <motion.div layoutId="nav-underline" className="h-0.5 w-full absolute -bottom-1" style={{ backgroundColor: accentColor }} />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-5">
                    {user?.role === 'BOTH' && <ModeToggle role={user.role} />}
                    <NotificationBell />

                    {/* 퀵 액션 버튼 (프로젝트 등록 / 미션 찾기) */}
                    <button
                        onClick={() => router.push(isClientPage ? "/client/projects/new" : "/freelancer/explore")}
                        className={`px-7 py-3 text-white rounded-2xl text-xs font-black tracking-widest ${buttonColor} hover:brightness-110 transition-all shadow-xl flex items-center gap-2 uppercase font-mono flex-shrink-0`}
                    >
                        {isClientPage ? <><Plus size={14} /> 프로젝트 등록</> : <><Search size={14} /> 미션 찾기</>}
                    </button>

                    <div
                        className="w-11 h-11 rounded-full border-2 border-white shadow-xl overflow-hidden flex items-center justify-center text-white font-black text-sm font-mono cursor-pointer hover:ring-2 transition-all"
                        style={{ backgroundColor: accentColor }}
                        onClick={() => router.push(isClientPage ? '/client/mypage' : '/freelancer/mypage')}
                    >
                        {userImg ? (
                            <img src={userImg} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span>{userName.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}