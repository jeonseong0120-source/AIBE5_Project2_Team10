'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import FreelancerProfileDetail from '@/components/freelancer/FreelancerProfileDetail';
import GlobalNavbar from '@/components/common/GlobalNavbar';

export default function ClientFreelancerProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    const profileId = Array.isArray(id) ? id[0] : id;

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await api.get('/v1/users/me');
                const roles = res.data.role || '';

                if (!roles.includes('CLIENT') && !roles.includes('BOTH')) {
                    alert('클라이언트 또는 BOTH 계정만 접근 가능합니다.');
                    if (roles.includes('FREELANCER')) router.replace('/');
                    else router.replace('/onboarding');
                    return;
                }

                setUser(res.data);
                setAuthorized(true);

                api.get('/client/profile')
                    .then(pRes => setProfile(pRes.data))
                    .catch(err => console.error("프로필 로드 실패", err));

            } catch {
                router.replace('/login');
            } finally {
                setChecking(false);
            }
        };

        void checkAccess();
    }, [router]);

    if (checking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-mono text-sm font-black uppercase tracking-widest text-[#FF7D00] animate-pulse">
                Verifying_Client_Session...
            </div>
        );
    }

    if (!authorized || !profileId) {
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-50 font-sans relative">
            {/* 🎨 은은한 그리드 배경 */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px), linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px, 100px 100px, 100px 100px' }} />
            </div>

            {/* 🎯 상단 네비게이션 */}
            <GlobalNavbar user={user} profile={profile} />

            {/* 실제 내용 렌더링 */}
            <div className="relative z-10">
                <FreelancerProfileDetail profileId={profileId} variant="client" />
            </div>
        </div>
    );
}