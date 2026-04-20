'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout } from '@/app/lib/authEvents';

interface ClientMypageSidebarProps {
    tabs: { id: string, label: string, icon: any }[];
    activeTab: string;
    setActiveTab: (tabId: string) => void;
}

export default function ClientMypageSidebar({ tabs, activeTab, setActiveTab }: ClientMypageSidebarProps) {
    const router = useRouter();

    return (
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-2xl p-3 border border-zinc-200 shadow-sm">
                <div className="flex flex-col gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-zinc-900 text-white shadow-md'
                                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                                }`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? 'text-[#FF7D00]' : 'text-zinc-400'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl p-2 border border-zinc-200 shadow-sm mt-6">
                <button 
                    onClick={() => { logout(); router.push('/login'); }} 
                    className="w-full flex items-center gap-3 p-4 hover:bg-red-50 rounded-xl transition text-sm font-bold text-red-500"
                >
                    <X size={16} />
                    로그아웃
                </button>
            </div>
        </aside>
    );
}
