'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import { User, Users, CheckCircle, XCircle, Edit, Trash2, Calendar, DollarSign, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientDashboardPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // 필터 및 모달 상태
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [selectedProjectForApplicant, setSelectedProjectForApplicant] = useState<any>(null);
    const [applicants, setApplicants] = useState<any[]>([]);
    const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);

    // 🔥 커서 글로우
    const [cursor, setCursor] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const move = (e: MouseEvent) => {
            setCursor({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await api.get("/v1/users/me");
                if (res.data.role.includes("GUEST")) return router.replace("/onboarding");
                setAuthorized(true);
            } catch (err) {
                router.replace("/login");
            }
        };
        checkAccess();
    }, [router]);

    const fetchMyProjects = async () => {
        try {
            const { data } = await api.get('/v1/projects/me');
            const projectArray = data.content || data || [];
            setProjects(projectArray.filter((p: any) => p.status !== 'COMPLETED'));
        } catch (err) {
            console.error("로드 실패", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authorized) fetchMyProjects();
    }, [authorized]);

    const handleEditProjectClick = (projectId: number) => {
        router.push(`/client/projects/${projectId}/edit`);
    };

    const handleStatusChange = async (projectId: number, action: 'start' | 'close') => {
        const msg = action === 'start' ? '시작' : '마감';
        if (!confirm(`프로젝트를 ${msg} 처리하시겠습니까?`)) return;
        try {
            await api.patch(`/v1/projects/${projectId}/${action}`);
            fetchMyProjects();
        } catch (err) {
            alert('상태 변경 실패');
        }
    };

    const handleDeleteProject = async (projectId: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await api.delete(`/v1/projects/${projectId}`);
            fetchMyProjects();
        } catch (err) {
            alert('삭제 실패');
        }
    };

    const handleViewApplicants = async (project: any) => {
        setSelectedProjectForApplicant(project);
        setIsApplicantModalOpen(true);
        try {
            const { data } = await api.get(`/v1/projects/${project.projectId}/applications`);
            setApplicants(data);
        } catch (err) {
            setApplicants([]);
        }
    };

    const handleApplicationStatus = async (applicationId: number, status: 'ACCEPTED' | 'REJECTED') => {
        try {
            await api.patch(`/v1/applications/${applicationId}/status`, { status });
            if (selectedProjectForApplicant) handleViewApplicants(selectedProjectForApplicant);
        } catch (err) {
            alert('처리 실패');
        }
    };

    if (!authorized || loading) return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-[#FF7D00] font-black text-xl animate-pulse font-mono tracking-widest uppercase">
            Restoring_Command_Center...
        </div>
    );

    const filteredProjects = projects.filter(p => filterStatus === 'ALL' || p.status === filterStatus);

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 relative overflow-hidden font-sans">

            <div
                className="pointer-events-none fixed z-0 w-[400px] h-[400px] rounded-full bg-[#FF7D00]/10 blur-[120px] transition-all duration-200"
                style={{ left: cursor.x - 200, top: cursor.y - 200 }}
            />

            <nav className="w-full py-5 px-10 bg-white/80 backdrop-blur-xl border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/client/mainpage")}>
                    <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                </div>
                <div className="flex gap-4 items-center relative z-10 md:gap-6">
                    <button onClick={() => router.push('/client/mypage')} className="text-xs font-black text-zinc-500 hover:text-zinc-950 tracking-widest transition uppercase font-mono">
                        MY_PAGE
                    </button>
                    <NotificationBell />
                    <button onClick={() => router.push("/client/projects/new")} className="px-6 py-2.5 bg-[#FF7D00] text-white rounded-xl text-xs font-black tracking-widest hover:brightness-110 transition shadow-lg shadow-orange-100 uppercase font-mono">
                        Register_Project
                    </button>
                </div>
            </nav>

            <header className="relative pt-20 pb-12 px-8 bg-white border-b border-zinc-200 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
                </div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-8 h-[2px] bg-[#FF7D00]"></span>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono">Project_Operations</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter mb-4 uppercase">Dashboard</h1>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-8 py-16 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <h2 className="text-xl font-black tracking-tight text-zinc-950 uppercase font-mono">
                        System_Projects <span className="text-[#7A4FFF] ml-1">[{filteredProjects.length}]</span>
                    </h2>
                    <div className="flex gap-1.5 p-1.5 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                        {['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED'].map((s) => (
                            <button key={s} onClick={() => setFilterStatus(s)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all tracking-widest font-mono uppercase ${filterStatus === s ? 'bg-zinc-950 text-white shadow-lg' : 'text-zinc-400'}`}>
                                {s === 'IN_PROGRESS' ? 'PROGRESS' : s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6">
                    {filteredProjects.length === 0 ? (
                        <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100 font-mono font-black text-zinc-300 uppercase italic">
                            Null: No_Mission_Detected
                        </div>
                    ) : (
                        filteredProjects.map((project) => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={project.projectId} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-zinc-100 flex flex-col md:flex-row justify-between items-center group hover:shadow-xl transition-all duration-500 hover:scale-[1.01]">
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black font-mono tracking-widest uppercase border ${project.status === 'OPEN' ? 'bg-blue-50 text-blue-600 border-blue-100' : project.status === 'IN_PROGRESS' ? 'bg-orange-50 text-[#FF7D00] border-orange-100' : 'bg-zinc-100 text-zinc-500'}`}>
                                            {project.status}
                                        </span>
                                        <span className="text-[10px] font-black text-zinc-300 font-mono">ID_{project.projectId}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-zinc-900 group-hover:text-[#FF7D00] transition-colors mb-4">{project.projectName}</h3>
                                    <div className="flex flex-wrap gap-6 text-xs font-bold text-zinc-400 font-mono uppercase">
                                        <span><DollarSign size={14} className="inline mr-1"/>{project.budget.toLocaleString()}원</span>
                                        <span><Calendar size={14} className="inline mr-1"/>{project.deadline}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-8 md:mt-0">
                                    {project.status === 'OPEN' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleStatusChange(project.projectId, 'start')} className="px-5 py-3 bg-[#FF7D00]/10 text-[#FF7D00] rounded-2xl text-[10px] font-black hover:bg-[#FF7D00] hover:text-white transition-all uppercase">START</button>
                                            <button onClick={() => handleStatusChange(project.projectId, 'close')} className="px-5 py-3 bg-zinc-50 text-zinc-400 rounded-2xl text-[10px] font-black hover:bg-zinc-100 transition-all uppercase">CLOSE</button>
                                        </div>
                                    )}
                                    <div className="flex gap-1 px-3 border-x border-zinc-100">
                                        <button onClick={() => handleEditProjectClick(project.projectId)} className="p-3.5 text-zinc-300 hover:text-blue-500 transition-all"><Edit size={18} /></button>
                                        <button onClick={() => handleDeleteProject(project.projectId)} className="p-3.5 text-zinc-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                                    </div>
                                    <button onClick={() => handleViewApplicants(project)} className="px-8 py-4 bg-zinc-950 text-white rounded-[1.5rem] font-black text-xs tracking-widest uppercase hover:bg-[#FF7D00] transition-all flex items-center gap-2">
                                        <Users size={16} /> Applicants
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </main>

            <AnimatePresence>
                {isApplicantModalOpen && selectedProjectForApplicant && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsApplicantModalOpen(false)} className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative bg-white rounded-[3.5rem] w-full max-w-2xl p-12 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-zinc-100">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-2">Applicants</h2>
                                    <p className="text-[10px] text-[#FF7D00] font-black font-mono uppercase tracking-widest">{selectedProjectForApplicant.projectName}</p>
                                </div>
                                <button onClick={() => setIsApplicantModalOpen(false)} className="text-zinc-300 hover:text-zinc-950 p-2 bg-zinc-50 rounded-full"><XCircle size={24} /></button>
                            </div>
                            <div className="overflow-y-auto space-y-5">
                                {applicants.length === 0 ? (
                                    <div className="py-24 text-center text-zinc-200 font-black font-mono tracking-tighter uppercase border-4 border-dashed border-zinc-50 rounded-[2.5rem]">No_Data.</div>
                                ) : (
                                    applicants.map((app: any) => (
                                        <div key={app.applicationId} className="p-8 bg-zinc-50 rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-center border border-zinc-100 transition-all hover:bg-white hover:shadow-lg group">
                                            <div className="text-center sm:text-left mb-4 sm:mb-0">
                                                <h4 className="font-black text-lg text-zinc-900 group-hover:text-[#FF7D00] transition-colors">{app.freelancerName}</h4>
                                                <p className="text-[10px] font-black text-zinc-400 font-mono tracking-widest uppercase">{app.status} | MATCH {app.matchingScore}%</p>
                                            </div>
                                            {app.status === 'PENDING' ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleApplicationStatus(app.applicationId, 'ACCEPTED')} className="px-6 py-3 bg-zinc-950 text-white rounded-[1.2rem] text-[10px] font-black hover:bg-[#FF7D00] transition-all uppercase">Accept</button>
                                                    <button onClick={() => handleApplicationStatus(app.applicationId, 'REJECTED')} className="px-6 py-3 bg-white border border-zinc-200 text-zinc-400 rounded-[1.2rem] text-[10px] font-black hover:text-red-600 transition-all uppercase">Reject</button>
                                                </div>
                                            ) : (
                                                <div className="px-8 py-3 rounded-[1.2rem] text-[10px] font-black font-mono tracking-widest uppercase bg-zinc-100 text-zinc-500">{app.status}</div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}