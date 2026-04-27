'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, ExternalLink, UserCircle, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../../lib/authEvents';
import api from '../../lib/axios';

import MypageSidebar from '@/components/layout/MypageSidebar';
import MypageWithdrawFooter from '@/components/layout/MypageWithdrawFooter';
// 🎯 [수정 1] 기존 MypageNavbar 임포트 삭제 후 GlobalNavbar 임포트
import GlobalNavbar, { type UserData, type ProfileData } from '@/components/common/GlobalNavbar';
import SettingsTab from '@/components/client_mypage/SettingsTab';
import { MypageNotificationsTab } from '@/components/mypage/MypageNotificationsTab';
import { dnAlert } from '@/lib/swal';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface UserProfile {
    name: string;
    email: string;
    role: string;
    nickname?: string;
}

function mapClientMyPageUserToNavbarUser(u: UserProfile): UserData {
        const roles = String(u.role)
            .split(',')
            .map((v) => v.trim().replace(/^ROLE_/, ''))
            .filter(Boolean);
        const hasClient = roles.includes('CLIENT');
        const hasFreelancer = roles.includes('FREELANCER');
        const role: UserData['role'] =
                roles.includes('BOTH') || (hasClient && hasFreelancer)
                    ? 'BOTH'
                    : 'CLIENT';
    return {
        role,
        nickname: u.nickname,
        name: u.name,
    };
}

const TABS = [
    { id: 'settings', label: '계정 설정', icon: UserCircle },
    { id: 'notifications', label: '알림', icon: Bell },
];

export default function ClientMyPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [activeTab, setActiveTab] = useState('settings');

    useEffect(() => {
        const checkAccessAndFetchUser = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) { router.replace("/"); return; }
            try {
                const res = await api.get("/v1/users/me");
                const roles = res.data.role || "";

                if (!roles.includes("CLIENT") && !roles.includes("BOTH")) {
                    await dnAlert("클라이언트 또는 BOTH 계정만 접근 가능합니다.", "warning");
                    if (roles.includes("FREELANCER")) return router.replace("/");
                    return router.replace("/onboarding");
                }

                if (roles.includes("GUEST")) return router.replace("/onboarding");

                setUser(res.data);
                setAuthorized(true);
            } catch (err) { router.replace("/"); }
        };
        checkAccessAndFetchUser();
    }, [router]);

    useEffect(() => {
        const fetchEssentialData = async () => {
            if (!authorized) return;
            setLoading(true);
            try {
                // 프로필 정보만 가져옴 (프로젝트 목록 요청 삭제)
                const profileRes = await api.get('/client/profile');
                setProfile(profileRes.data as ProfileData);
            } catch (err) {
                console.error("데이터 로드 실패", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEssentialData();
    }, [authorized]);

    if (!authorized) return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-[#FF7D00] font-black text-xl animate-pulse uppercase font-mono tracking-[0.2em]">
            보안 인증 중...
        </div>
    );

    const handleUpdateSuccess = (updatedData: any) => {
        if (typeof updatedData === 'string') {
            // 구버전: 닉네임만 전달받은 경우
            setUser(prev => ({ ...(prev || {}), nickname: updatedData } as UserProfile));
        } else {
            // 신버전: 전체 formData 오브젝트를 전달받은 경우
            setUser(prev => ({ ...(prev || {}), nickname: updatedData.nickname } as UserProfile));
            setProfile((prev: any) => ({ ...(prev || {}), ...updatedData }));
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-24 relative scroll-smooth font-sans">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px), linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px, 100px 100px, 100px 100px' }} />
            </div>

            {/* 🎯 [2. 수정] 기존 MypageNavbar를 지우고 GlobalNavbar로 대체! */}
            <GlobalNavbar user={user ? mapClientMyPageUserToNavbarUser(user) : null} profile={profile} />

            <main className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start relative z-10">
                <MypageSidebar
                    tabs={TABS}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    accentColor="#FF7D00"
                />

                <div className="space-y-8 min-w-0">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.3,
                            ease: "easeOut"
                        }}
                        className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 md:p-12 border border-zinc-100 shadow-2xl shadow-zinc-200/50 min-h-[780px] w-full flex flex-col"
                    >
                        <div className="min-h-0 flex-1 w-full">
                            {activeTab === 'settings' && (
                                <SettingsTab onUpdateSuccess={handleUpdateSuccess} />
                            )}
                            {activeTab === 'notifications' && <MypageNotificationsTab accentColor="#FF7D00" />}
                        </div>
                        {activeTab === 'settings' ? <MypageWithdrawFooter /> : null}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}