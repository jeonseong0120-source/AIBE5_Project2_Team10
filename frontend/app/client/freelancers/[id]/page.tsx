'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import FreelancerProfileDetail from '@/components/freelancer/FreelancerProfileDetail';

export default function ClientFreelancerProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

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

                setAuthorized(true);
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
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-mono text-sm font-black uppercase tracking-widest text-zinc-400 animate-pulse">
                Verifying_Client_Session...
            </div>
        );
    }

    if (!authorized || !profileId) {
        return null;
    }

    return <FreelancerProfileDetail profileId={profileId} variant="client" />;
}
