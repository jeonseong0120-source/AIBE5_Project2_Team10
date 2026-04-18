'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, ChevronRight, Calendar, XCircle, ExternalLink, Briefcase, LayoutGrid, UserCircle, Heart, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../../lib/authEvents';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import api from '../../lib/axios';

import MypageSidebar from '@/components/layout/MypageSidebar';
import MypageNavbar from '@/components/layout/MypageNavbar';
import ProjectsTab from '@/components/client_mypage/ProjectsTab';
import SettingsTab from '@/components/client_mypage/SettingsTab';
import BookmarkedFreelancers from '@/components/client_mypage/BookmarkedFreelancers';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface UserProfile {
    name: string;
    email: string;
    role: string;
    nickname?: string;
}

interface ProjectDto {
    projectId: number;
    projectName: string;
    status: string;
    deadline: string;
    budget?: number;
    detail?: string;
    online: boolean;
    offline: boolean;
    location?: string;
    skills: string[];
}

const TABS = [
    { id: 'settings', label: 'ACCOUNT SETTINGS', icon: UserCircle },
    { id: 'projects', label: 'MY PROJECTS', icon: Briefcase },
    { id: 'bookmarks', label: 'BOOKMARKS', icon: Heart },
];

export default function ClientMyPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [projects, setProjects] = useState<ProjectDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [activeTab, setActiveTab] = useState('settings');

    const [selectedProjectForView, setSelectedProjectForView] = useState<ProjectDto | null>(null);

    useEffect(() => {
        const checkAccessAndFetchUser = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) { router.replace("/login"); return; }
            try {
                const res = await api.get("/v1/users/me");
                const roles = res.data.role || "";

                if (!roles.includes("CLIENT") && !roles.includes("BOTH")) {
                    alert("클라이언트 또는 BOTH 계정만 접근 가능합니다.");
                    if (roles.includes("FREELANCER")) return router.replace("/");
                    return router.replace("/onboarding");
                }

                if (roles.includes("GUEST")) return router.replace("/onboarding");

                setUser(res.data);
                setAuthorized(true);
            } catch (err) { router.replace("/login"); }
        };
        checkAccessAndFetchUser();
    }, [router]);

    useEffect(() => {
        const fetchEssentialData = async () => {
            if (!authorized) return;
            setLoading(true);
            try {
                // 프로젝트와 프로필 정보를 동시에 가져옴
                const [projectsRes, profileRes] = await Promise.all([
                    api.get('/v1/projects/me'),
                    api.get('/client/profile')
                ]);
                setProjects(projectsRes.data.content || projectsRes.data || []);
                setProfile(profileRes.data);
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
            SYSTEM_AUTHORIZING...
        </div>
    );

    const handleUpdateSuccess = (updatedData: any) => {
        if (typeof updatedData === 'string') {
            // 구버전: 닉네임만 전달받은 경우
            setUser(prev => prev ? { ...prev, nickname: updatedData } : null);
        } else {
            // 신버전: 전체 formData 오브젝트를 전달받은 경우
            setUser(prev => prev ? { ...prev, nickname: updatedData.nickname } : null);
            setProfile((prev: any) => ({ ...prev, ...updatedData }));
        }
    };

    const navItems = [
        { label: 'DASHBOARD', path: '/client/dashboard' },
        { label: 'EXPLORE', path: '/client/mainpage' },
        { label: 'MY_WORKSPACE', path: '/client/mypage', active: true },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-24 relative overflow-y-scroll scroll-smooth font-sans">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px), linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px, 100px 100px, 100px 100px' }} />
            </div>

            <MypageNavbar 
                userType="CLIENT" 
                userName={user?.name}
                profileImage={profile?.logoUrl}
                navItems={navItems}
                accentColor="#FF7D00"
            />

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
                        className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 md:p-12 border border-zinc-100 shadow-2xl shadow-zinc-200/50 min-h-[700px] w-full"
                    >
                        {activeTab === 'projects' && (
                            <ProjectsTab user={user} projects={projects} loading={loading} setSelectedProjectForView={setSelectedProjectForView} />
                        )}
                        {activeTab === 'bookmarks' && (
                            <div className="space-y-8">
                                <h2 className="text-sm font-black uppercase font-mono tracking-[0.3em] text-zinc-400 mb-8">Bookmarked Freelancers</h2>
                                <BookmarkedFreelancers />
                            </div>
                        )}
                        {activeTab === 'settings' && (
                            <SettingsTab onUpdateSuccess={handleUpdateSuccess} />
                        )}
                    </motion.div>
                </div>
            </main>

            <AnimatePresence>
                {selectedProjectForView && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProjectForView(null)} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="relative bg-white rounded-[4rem] w-full max-w-2xl p-12 shadow-2xl border border-zinc-100 overflow-hidden">
                            <div className="flex justify-between items-start mb-12 relative z-10">
                                <div><span className="text-[10px] font-black text-[#FF7D00] uppercase tracking-[0.5em] font-mono block mb-3">Project_Briefing</span><h2 className="text-4xl font-black text-zinc-900 tracking-tighter leading-tight">{selectedProjectForView.projectName}</h2></div>
                                <button onClick={() => setSelectedProjectForView(null)} className="text-zinc-300 hover:text-[#FF7D00] transition-all p-3 bg-zinc-50 rounded-full hover:rotate-90"><XCircle size={32} /></button>
                            </div>
                            <div className="space-y-8 relative z-10">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase mb-3 font-mono tracking-widest">Target_Budget</p>
                                        <p className="text-2xl font-black text-zinc-950 font-mono italic">₩{selectedProjectForView.budget?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase mb-3 font-mono tracking-widest">Current_Status</p>
                                        <p className="text-2xl font-black text-[#FF7D00] font-mono uppercase">{selectedProjectForView.status}</p>
                                    </div>
                                </div>
                                <div className="p-10 bg-zinc-50 rounded-[3rem] border border-zinc-100 shadow-inner">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase mb-4 font-mono tracking-[0.3em]">Mission_Statement</p>
                                    <p className="text-base font-medium text-zinc-600 leading-relaxed italic">"{selectedProjectForView.detail || "제공된 상세 내용이 없습니다."}"</p>
                                </div>
                                <div className="flex gap-5 pt-6">
                                    <button onClick={() => setSelectedProjectForView(null)} className="flex-1 py-6 bg-zinc-100 text-zinc-500 rounded-3xl font-black text-xs uppercase tracking-widest font-mono hover:bg-zinc-200 transition-all">Close</button>
                                    <button onClick={() => router.push('/client/dashboard')} className="flex-[2] py-6 bg-zinc-950 text-white rounded-3xl font-black text-xs uppercase tracking-widest font-mono hover:bg-[#FF7D00] shadow-[0_20px_40px_rgba(255,125,0,0.2)] flex items-center justify-center gap-3 transition-all group">Manage_Now <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}