'use client';

import { motion } from 'framer-motion';
import { Calendar, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

interface ProjectsTabProps {
    user: any;
    projects: ProjectDto[];
    loading: boolean;
    setSelectedProjectForView: (project: ProjectDto) => void;
}

export default function ProjectsTab({ user, projects, loading, setSelectedProjectForView }: ProjectsTabProps) {
    const router = useRouter();

    return (
        <div className="space-y-12">
            {/* 프로젝트 목록 */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black uppercase font-mono tracking-[0.3em] text-zinc-400">Project_Snapshot</h2>
                        <p className="text-[10px] text-zinc-400 font-mono uppercase mt-1 italic">Tracking your active missions and completed goals</p>
                    </div>
                    <span className="px-4 py-1.5 bg-zinc-950 text-white text-[10px] font-black rounded-full font-mono shadow-lg">TOTAL_{projects.length}</span>
                </div>
                
                {loading ? (
                    <div className="py-24 flex justify-center"><div className="w-10 h-10 border-4 border-[#FF7D00]/20 border-t-[#FF7D00] rounded-full animate-spin"></div></div>
                ) : projects.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {projects.map((project, idx) => (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: idx * 0.05 }} 
                                key={project.projectId || idx}
                                onClick={() => setSelectedProjectForView(project)}
                                className="group bg-zinc-50/50 p-8 rounded-[2.5rem] border border-zinc-100/50 transition-all hover:bg-white hover:shadow-2xl hover:border-[#FF7D00]/20 hover:translate-y-[-4px] cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-1.5 text-[10px] font-black tracking-widest rounded-full font-mono uppercase border ${project.status === "OPEN" ? "bg-white text-[#FF7D00] border-orange-100 shadow-sm" : "bg-zinc-100 text-zinc-400 border-zinc-200"}`}>
                                            {project.status === 'OPEN' ? '모집 중' : project.status}
                                        </span>
                                        <div className="flex gap-1">
                                            {project.online && <span className="px-2 py-1 bg-blue-50 text-blue-500 text-[9px] font-black rounded-md border border-blue-100">ONLINE</span>}
                                            {project.offline && <span className="px-2 py-1 bg-purple-50 text-purple-500 text-[9px] font-black rounded-md border border-purple-100">OFFLINE</span>}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-300 font-mono tracking-widest">ID_{project.projectId}</span>
                                </div>

                                <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
                                    <div>
                                        <h3 className="text-2xl font-black mb-4 text-zinc-800 group-hover:text-[#FF7D00] transition-colors tracking-tight">{project.projectName}</h3>
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {project.skills?.map(skill => (
                                                <span key={skill} className="px-3 py-1 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold text-zinc-500 font-mono">#{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-zinc-300 uppercase font-mono mb-1">Target_Budget</p>
                                        <p className="text-xl font-black text-zinc-900 group-hover:text-[#FF7D00] transition-colors font-mono italic">₩{project.budget?.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 mt-2 border-t border-zinc-100/50">
                                    <div className="flex items-center gap-6 text-[11px] font-mono text-zinc-400 font-bold uppercase">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-[#FF7D00]" />
                                            <span>Deadline: {project.deadline}</span>
                                        </div>
                                        {project.location && (
                                            <div className="hidden md:flex items-center gap-2">
                                                <div className="w-1 h-1 bg-zinc-200 rounded-full" />
                                                <span>{project.location}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); router.push('/client/dashboard'); }} className="px-6 py-3 rounded-xl bg-zinc-950 text-white text-[10px] font-black uppercase tracking-[0.2em] font-mono hover:bg-[#FF7D00] transition-all shadow-xl shadow-zinc-200">Manage_Project</button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-40 bg-zinc-50/50 rounded-[3rem] border-4 border-dashed border-zinc-100 font-mono font-black text-zinc-200 italic uppercase text-xl tracking-widest">Null: No_Mission_Detected</div>
                )}
            </div>
        </div>
    );
}
