'use client';

import { useParams } from 'next/navigation';
import FreelancerProfileDetail from '@/components/freelancer/FreelancerProfileDetail';

export default function FreelancerDetailPage() {
    const { id } = useParams();
    const profileId = Array.isArray(id) ? id[0] : id;

    if (!profileId) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-mono text-sm font-black uppercase tracking-widest text-zinc-400">
                Invalid_Request
            </div>
        );
    }

    return <FreelancerProfileDetail profileId={profileId} variant="freelancer" />;
}
