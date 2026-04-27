'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import api from '@/app/lib/axios';
import FreelancerProfileDetail from '@/components/freelancer/FreelancerProfileDetail';
import GlobalNavbar from '@/components/common/GlobalNavbar';
import { dnAlert } from '@/lib/swal';

function ClientFreelancerProfileContent() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const bm = searchParams.get('bm');
    const initialBookmarkedHint = bm === '1' ? true : bm === '0' ? false : undefined;
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
                    await dnAlert('클라이언트 또는 BOTH 계정만 접근 가능합니다.', 'warning');
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
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px), linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px, 100px 100px, 100px 100px' }} />
            </div>

            <GlobalNavbar user={user} profile={profile} />

            <div className="relative z-10">
                <FreelancerProfileDetail
                    profileId={profileId}
                    variant="client"
                    initialBookmarkedHint={initialBookmarkedHint}
                />
            </div>
        </div>
    );
}

export default function ClientFreelancerProfilePage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-mono text-sm font-black uppercase tracking-widest text-[#FF7D00] animate-pulse">
                    Verifying_Client_Session...
                </div>
            }
        >
            <ClientFreelancerProfileContent />
        </Suspense>
    );
}
