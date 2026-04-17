'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import { notifyAuthChanged } from '../../lib/authEvents';
import { Briefcase, User, Settings, LogOut, ChevronRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

import ProfileEditModal from '@/components/client_mypage/page';
import CompanyEditModal from '@/components/client_mypage/CompanyEditModal';

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
}

export default function ClientMyPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [projects, setProjects] = useState<ProjectDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [cursor, setCursor] = useState({ x: 0, y: 0 });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

    useEffect(() => {
        const move = (e: MouseEvent) => {
            setCursor({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    useEffect(() => {
        const checkAccessAndFetchUser = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("로그인이 필요합니다.");
                router.replace("/login");
                return;
            }

            try {
                const res = await api.get("/v1/users/me");
                const userData = res.data;

                if (userData.role === "GUEST" || userData.role === "ROLE_GUEST") {
                    router.replace("/onboarding");
                    return;
                }

                if (userData.role === "FREELANCER" || userData.role === "ROLE_FREELANCER") {
                    alert("해당 마이페이지는 클라이언트 전용 화면입니다.");
                    router.replace("/");
                    return;
                }

                setUser(userData);
                setAuthorized(true);
            } catch (err) {
                router.replace("/login");
            }
        };

        checkAccessAndFetchUser();
    }, [router]);

    useEffect(() => {
        const fetchMyProjects = async () => {
            if (!authorized) return;
            setLoading(true);
            try {
                const { data } = await api.get('/v1/projects/me');
                let projectArray: ProjectDto[] = [];
                if (Array.isArray(data)) projectArray = data;
                else if (data && Array.isArray(data.content)) projectArray = data.content;
                else if (data && Array.isArray(data.data)) projectArray = data.data;
                setProjects(projectArray);
            } catch (err) {
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMyProjects();
    }, [authorized]);

    if (!authorized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-[#FF7D00] font-black text-xl animate-pulse">
                AUTHORIZING ACCESS...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 relative overflow-hidden font-sans">
            {/* 🔥 커서 글로우 */}
            <div
                className="pointer-events-none fixed z-0 w-[300px] h-[300px] rounded-full bg-[#FF7D00]/20 blur-[120px] transition-all duration-200"
                style={{ left: cursor.x - 150, top: cursor.y - 150 }}
            />

            {/* NAV (로고 보라색 유지) */}
            <nav className="w-full py-5 px-10 bg-white/80 backdrop-blur-xl border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div
                    className="font-black text-2xl tracking-tighter cursor-pointer"
                    // 👇 마스터, 경로를 '/client/dashboard'로 수정했습니다.
                    onClick={() => router.push("/client/dashboard")}
                >
                    <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                </div>

                <div className="flex gap-4 items-center md:gap-6">
                    <button
                        onClick={() => router.push('/client/dashboard')}
                        className="text-xs font-bold text-zinc-500 hover:text-zinc-900 tracking-widest transition uppercase font-mono"
                    >
                        DASHBOARD
                    </button>
                    <NotificationBell />
                    <button
                        onClick={() => alert("시스템 설계 중입니다. 다음 업데이트를 기다려주세요.")}
                        className="px-6 py-2.5 bg-[#FF7D00] text-white rounded-xl text-xs font-black tracking-widest hover:brightness-110 transition shadow-md shadow-orange-100 uppercase font-mono"
                    >
                        Register_Project
                    </button>
                </div>
            </nav>

            {/* HEADER (보라색 제거) */}
            <section className="relative pt-16 pb-12 px-8 bg-white border-b border-zinc-200 overflow-hidden">
                <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-8">
                    {/* 그라데이션 오렌지로 통일 */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#FF7D00] to-[#FFB066] shadow-lg flex items-center justify-center text-4xl text-white font-black font-mono overflow-hidden">
                        {user?.name?.charAt(0).toUpperCase() || 'M'}
                    </div>
                    <div>
                        <div className="flex gap-4 text-xs text-zinc-500 mb-2 font-bold font-mono">
                            <span className="bg-orange-50 px-2 py-1 rounded text-[#FF7D00]">CLIENT_ACCOUNT</span>
                            <span className="bg-zinc-100 px-2 py-1 rounded">AUTH_VERIFIED</span>
                        </div>
                        <motion.h1
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-4xl font-black tracking-tight mb-2"
                        >
                            {/* 🔍 닉네임이 있으면 닉네임을, 없으면 이름을, 둘 다 없으면 '마스터'를 보여줍니다. */}
                            환영합니다, <span className="text-[#FF7D00]">{user?.nickname || user?.name || '마스터'}</span>님
                        </motion.h1>
                        <p className="text-zinc-500 font-medium">{user?.email}</p>
                    </div>
                </div>
            </section>

            <main className="max-w-5xl mx-auto px-8 py-12 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* --- 왼쪽 사이드 --- */}
                <div className="lg:col-span-1 space-y-6">
                    {/* System Status (오렌지 강조) */}
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-zinc-100 hover:border-[#FF7D00]/50 transition-colors">
                        <h3 className="text-zinc-400 font-black text-xs uppercase font-mono tracking-widest mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#FF7D00]" />
                            System_Status
                        </h3>
                        <div className="space-y-4 font-mono">
                            <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                                <span className="text-sm font-bold text-zinc-600">Total_Projects</span>
                                <span className="text-xl font-black text-zinc-900">{Array.isArray(projects) ? projects.length : 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-zinc-600">Active_Projects</span>
                                <span className="text-xl font-black text-[#FF7D00]">
                                    {Array.isArray(projects)
                                        ? projects.filter(p => p.status === '진행 중' || p.status === '모집 중').length
                                        : 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-2 rounded-2xl shadow-xl border border-zinc-100">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 rounded-xl transition group"
                        >
                            <div className="flex items-center gap-3 font-bold text-sm text-zinc-700 group-hover:text-[#FF7D00]">
                                <User className="w-5 h-5 text-zinc-400 group-hover:text-[#FF7D00]" />
                                프로필 편집
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#FF7D00]" />
                        </button>

                        <button
                            onClick={() => setIsCompanyModalOpen(true)}
                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 rounded-xl transition group"
                        >
                            <div className="flex items-center gap-3 font-bold text-sm text-zinc-700 group-hover:text-[#FF7D00]">
                                <Settings className="w-5 h-5 text-zinc-400 group-hover:text-[#FF7D00]" />
                                기업 정보 수정
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#FF7D00]" />
                        </button>
                        <hr className="my-1 border-zinc-100" />
                        <button className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-xl transition group"
                                onClick={() => {
                                    localStorage.removeItem("accessToken");
                                    notifyAuthChanged();
                                    router.push("/login");
                                }}>
                            <div className="flex items-center gap-3 font-bold text-sm text-red-500">
                                <LogOut className="w-5 h-5 text-red-400" />
                                로그아웃
                            </div>
                        </button>
                    </div>
                </div>

                {/* --- 오른쪽 메인 --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-black tracking-tight text-zinc-950 uppercase font-mono">
                            My_Projects <span className="text-[#FF7D00] ml-1">[{Array.isArray(projects) ? projects.length : 0}]</span>
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center py-20 bg-white rounded-2xl border border-zinc-100">
                            <div className="w-8 h-8 border-4 border-[#FF7D00] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : Array.isArray(projects) && projects.length > 0 ? (
                        <div className="space-y-4">
                            {projects.map((project, idx) => (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={project.projectId || idx}
                                    className="group bg-white p-6 rounded-2xl shadow-md border border-zinc-100 transition-all hover:border-[#FF7D00] hover:shadow-xl hover:shadow-orange-100/50"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className={`inline-block px-3 py-1 text-[10px] font-black tracking-widest rounded-md mb-3 font-mono uppercase ${
                                                project.status === "모집 중" ? "bg-[#FF7D00]/10 text-[#FF7D00]" :
                                                    project.status === "진행 중" ? "bg-orange-50 text-[#FF7D00]" :
                                                        "bg-zinc-100 text-zinc-500"
                                            }`}>
                                                {project.status || '상태 없음'}
                                            </span>
                                            <h3 className="text-xl font-bold group-hover:text-[#FF7D00] transition-colors">
                                                {project.projectName || '프로젝트 이름이 없습니다.'}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-50">
                                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 font-bold">
                                            <Briefcase className="w-4 h-4" />
                                            <span>DEADLINE: {project.deadline || '미정'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-black uppercase tracking-widest font-mono hover:bg-zinc-200 transition-all">
                                                DETAILS
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-zinc-200">
                            <Briefcase className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                            <h3 className="text-zinc-400 font-bold text-lg italic uppercase font-mono tracking-tighter">Null: No_Projects_Found</h3>
                        </div>
                    )}
                </div>
            </main>
            <ProfileEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={(newName) => {
                    // [AI 리뷰 반영] nickname만 수정하고, name은 그대로 둡니다.
                    setUser(prev => prev ? { ...prev, nickname: newName } : null);
                }}
            />

            {/* 👇 이 부분을 추가해 주셔야 기업 정보 창이 뜹니다! */}
            <CompanyEditModal
                isOpen={isCompanyModalOpen}
                onClose={() => setIsCompanyModalOpen(false)}
                onSuccess={() => {
                    // 기업 정보 수정 성공 시 실행할 추가 로직이 있다면 여기에 작성
                }}
            />
        </div>
    );
}