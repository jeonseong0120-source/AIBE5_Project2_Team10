'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Briefcase, MonitorPlay } from 'lucide-react';

interface ModeToggleProps {
    role?: string;
}

export default function ModeToggle({ role }: ModeToggleProps) {
    const pathname = usePathname();
    const router = useRouter();

    // 🎯 BOTH 권한이 아니면 아예 숨김
    if (role !== 'BOTH') return null;

    const isClientMode = pathname?.startsWith('/client');

    const toggleMode = () => {
        if (isClientMode) router.push('/freelancer/dashboard');
        else router.push('/client/dashboard');
    };

    return (
        <div
            onClick={toggleMode}
            className="relative flex items-center w-36 h-10 bg-zinc-100 rounded-full p-1 cursor-pointer shadow-inner border border-zinc-200 overflow-hidden"
        >
            <motion.div
                className={`absolute w-[calc(50%-4px)] h-[calc(100%-8px)] rounded-full shadow-md ${isClientMode ? 'bg-[#FF7D00]' : 'bg-[#7A4FFF]'}`}
                animate={{ x: isClientMode ? 0 : '100%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <div className={`relative z-10 flex-1 flex items-center justify-center gap-1 text-[9px] font-black uppercase font-mono transition-colors ${isClientMode ? 'text-white' : 'text-zinc-400'}`}>
                <Briefcase size={10} /> Client
            </div>
            <div className={`relative z-10 flex-1 flex items-center justify-center gap-1 text-[9px] font-black uppercase font-mono transition-colors ${!isClientMode ? 'text-white' : 'text-zinc-400'}`}>
                <MonitorPlay size={10} /> Free
            </div>
        </div>
    );
}