import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Users, CheckCircle, XCircle, Edit, Trash2,
    Calendar, DollarSign, Globe, Sparkles, CreditCard, ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ClientProjectCardProps {
    project: any;
    isExpanded: boolean;
    projectApplicants: any[];
    loadingApplicants: boolean;
    handleEditProjectClick: (projectId: number) => void;
    handleDeleteProject: (projectId: number) => void;
    handleCompleteProject: (project: any) => void;
    setSelectedProjectIdForMatching: (projectId: number) => void;
    setIsMatchingModalOpen: (isOpen: boolean) => void;
    handleViewApplicants: (project: any) => void;
    handleApplicationStatus: (applicationId: number, status: 'ACCEPTED' | 'REJECTED') => void;
    handleDemoPayment: (project: any, application: any) => void;
    handlePayment: (project: any, application: any) => void;
    paymentDisabled?: boolean;
}

export default function ClientProjectCard({
    project,
    isExpanded,
    projectApplicants,
    loadingApplicants,
    handleEditProjectClick,
    handleDeleteProject,
    handleCompleteProject,
    setSelectedProjectIdForMatching,
    setIsMatchingModalOpen,
    handleViewApplicants,
    handleApplicationStatus,
    handleDemoPayment,
    handlePayment,
    paymentDisabled = false
}: ClientProjectCardProps) {
    const router = useRouter();
    const isCompleted = project.status === 'COMPLETED';
    const isInProgress = project.status === 'IN_PROGRESS';
    const acceptedApp = projectApplicants?.find(app => app.status === 'ACCEPTED');

    return (
        <div className="flex flex-col gap-6">
            <motion.div 
                layout
                className={`group bg-white p-10 rounded-[2.5rem] border transition-all duration-500 overflow-hidden relative ${isExpanded ? 'border-[#FF7D00] shadow-2xl ring-1 ring-orange-50' : 'border-zinc-100 shadow-sm hover:shadow-xl hover:border-[#FF7D00]/30'}`}
            >
                <div className="relative z-10">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
                        {/* 📝 프로젝트 기본 정보 섹션 */}
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-4 mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
                                    project.status === 'OPEN' ? 'bg-orange-50 text-[#FF7D00] border-orange-100' : 
                                    project.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-500 border-blue-100' : 
                                    'bg-zinc-950 text-white border-zinc-950'
                                }`}>
                                    {project.status === 'OPEN' ? '모집 중' : project.status === 'IN_PROGRESS' ? '진행 중' : '완료됨'}
                                </span>
                                
                                 {!isCompleted && !isInProgress && (
                                    <div className="flex gap-1 ml-auto xl:ml-0 bg-zinc-50/50 p-1 rounded-[1rem] border border-zinc-100/50">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditProjectClick(project.projectId); }} 
                                            className="group/tool p-2.5 text-zinc-400 hover:text-[#FF7D00] hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                            title="Edit Project"
                                        >
                                            <Edit size={16} className="group-hover/tool:rotate-12 transition-transform" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.projectId); }} 
                                            className="group/tool p-2.5 text-zinc-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                            title="Delete Project"
                                        >
                                            <Trash2 size={16} className="group-hover/tool:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <h3 className="text-3xl font-bold text-zinc-950 group-hover:text-[#FF7D00] transition-colors tracking-tight leading-tight mb-8 max-w-2xl">
                                {project.projectName}
                            </h3>

                            <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Expected Budget</span>
                                    <span className="flex items-center gap-2 text-base font-bold text-zinc-900">
                                        <DollarSign size={16} className="text-[#FF7D00]"/> ₩{project.budget?.toLocaleString()}
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-zinc-100 hidden sm:block" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Application Deadline</span>
                                    <span className="flex items-center gap-2 text-base font-bold text-zinc-900">
                                        <Calendar size={16} className="text-[#FF7D00]"/> {project.deadline}
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-zinc-100 hidden sm:block" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Working Style</span>
                                    <span className="flex items-center gap-2 text-base font-bold text-zinc-900">
                                        <Globe size={16} className="text-[#FF7D00]"/> {project.online ? '온라인' : '오프라인'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ⚡ 액션 버튼 섹션 */}
                        <div className="w-full xl:w-auto flex flex-col sm:flex-row xl:flex-col gap-3 shrink-0">
                            {isInProgress && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleCompleteProject(project); }} 
                                    className="group/complete w-full px-8 py-4 bg-zinc-950 text-white rounded-[1.2rem] transition-all hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95 flex flex-col items-center justify-center gap-0.5 border border-zinc-800 hover:border-emerald-400/30 shadow-xl"
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={16} className="group-hover/complete:scale-110 transition-transform" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.15em]">프로젝트 완료하기</span>
                                    </div>
                                </button>
                            )}

                            {!isCompleted && !isInProgress && acceptedApp && (
                                <div className="flex flex-col gap-3 w-full">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDemoPayment(project, acceptedApp); }} 
                                            disabled={paymentDisabled}
                                            className={`group/pay px-8 py-4 bg-[#FF7D00] text-white rounded-[1.2rem] transition-all flex flex-col items-center justify-center gap-0.5 min-w-[140px] border border-orange-400/20 shadow-xl ${paymentDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.03] hover:shadow-2xl hover:shadow-orange-500/30 active:scale-95'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={16} className="group-hover/pay:rotate-12 transition-transform" />
                                                <span className="text-[11px] font-black uppercase tracking-widest">결제</span>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handlePayment(project, acceptedApp); }} 
                                            disabled={paymentDisabled}
                                            className={`group/pay px-8 py-4 bg-zinc-950 text-white rounded-[1.2rem] transition-all flex flex-col items-center justify-center gap-0.5 min-w-[140px] border border-zinc-800 shadow-xl ${paymentDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.03] hover:shadow-2xl hover:shadow-zinc-900/30 active:scale-95'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck size={16} className="group-hover/pay:scale-110 transition-transform" />
                                                <span className="text-[11px] font-black uppercase tracking-widest">결제</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row xl:flex-col gap-3 w-full">
                                {project.status === 'OPEN' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedProjectIdForMatching(project.projectId);
                                            setIsMatchingModalOpen(true);
                                        }}
                                        className="group/ai flex-1 px-8 py-4 bg-white border border-zinc-100 text-[#FF7D00] rounded-[1.2rem] transition-all hover:bg-orange-50 hover:border-orange-200 flex flex-col items-center justify-center gap-0.5 shadow-sm hover:shadow-md active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={16} className="group-hover/ai:animate-pulse" />
                                            <span className="text-[13px] font-black uppercase tracking-tighter">AI 심층 분석</span>
                                        </div>
                                    </button>
                                )}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleViewApplicants(project); }} 
                                    disabled={(project.applicationCount || 0) === 0}
                                    className={`group/console flex-1 px-10 py-4 min-w-[200px] rounded-[1.2rem] transition-all flex flex-col items-center justify-center gap-0.5 shadow-xl ${
                                        (project.applicationCount || 0) === 0 
                                        ? 'bg-zinc-50 text-zinc-300 cursor-not-allowed border border-zinc-100 shadow-none' 
                                        : isExpanded 
                                            ? 'bg-[#FF7D00] text-white shadow-orange-500/30 ring-4 ring-orange-500/10' 
                                            : 'bg-zinc-950 text-white hover:bg-zinc-800 shadow-zinc-900/20 active:scale-[0.98]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Users size={18} className="group-hover/console:scale-110 transition-transform" />
                                        <span className="text-[13px] font-black uppercase tracking-tighter">
                                            {isExpanded ? '관리 센터 닫기' : `지원자 관리 (${project.applicationCount || 0})`}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 지원자 집중 관리 센터 */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0, scale: 0.98 }} 
                        animate={{ height: "auto", opacity: 1, scale: 1 }} 
                        exit={{ height: 0, opacity: 0, scale: 0.98 }} 
                        className="overflow-hidden"
                    >
                        <div className="bg-white border border-zinc-100 shadow-sm rounded-[2rem] p-6 mb-10 relative">
                            {/* 장식용 요소 */}
                            <div className="absolute top-6 right-8 flex gap-4">
                                <div className="flex items-center gap-2">
                                </div>
                            </div>


                            {loadingApplicants ? (
                                <div className="py-24 flex flex-col items-center justify-center gap-8">
                                    <div className="relative">
                                        <div className="w-20 h-20 border-4 border-zinc-100 border-t-[#FF7D00] rounded-full animate-spin" />
                                        <Sparkles size={24} className="absolute inset-0 m-auto text-[#FF7D00] animate-pulse" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[13px] font-bold text-zinc-300">가장 완벽한 인재를 선별하는 중입니다.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {projectApplicants.length === 0 ? (
                                        <div className="py-24 flex flex-col items-center justify-center text-center bg-zinc-50/50 rounded-[3rem] border-4 border-dashed border-zinc-100">
                                            <Users size={48} className="text-zinc-200 mb-6" strokeWidth={0.5} />
                                            <h5 className="text-zinc-300 font-black text-lg font-mono uppercase tracking-[0.3em] mb-3">Zero_Pipeline</h5>
                                            <p className="text-zinc-400 text-[10px] max-w-xs leading-relaxed">아직 지원자가 없습니다. 프로젝트 공고를 매력적으로 수정하거나 인재에게 직접 제안해보세요.</p>
                                        </div>
                                    ) : (
                                        [...projectApplicants].sort((a,b) => b.matchingRate - a.matchingRate).map((app: any, appIdx: number) => (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 20 }} 
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: appIdx * 0.05 }}
                                                key={app.applicationId} 
                                                className={`group/card p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col md:flex-row items-center gap-6 ${
                                                    app.status === 'ACCEPTED' ? 'border-[#FF7D00] bg-orange-50/10' : 'border-zinc-100 bg-white hover:border-zinc-200'
                                                }`}
                                            >

                                                {/* 좌측: 아바타 및 기본정보 */}
                                                <div className="flex items-center gap-4 min-w-[200px]">
                                                    <div className="relative cursor-pointer group/avatar" onClick={() => router.push(`/client/freelancers/${app.freelancerId}`)}>
                                                        <div className="w-14 h-14 rounded-xl bg-zinc-100 border border-white overflow-hidden shadow-md transition-transform duration-500 group-hover/avatar:scale-110">
                                                            {app.freelancerProfileImageUrl ? <img src={app.freelancerProfileImageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-300"><User size={20} /></div>}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-lg text-zinc-950 leading-tight tracking-tight">{app.freelancerNickname}</h4>
                                                    </div>
                                                </div>

                                                {/* 중앙: 스킬 및 매칭 바 */}
                                                <div className="flex-1 min-w-0 border-x border-zinc-50 px-6">
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {app.skills?.slice(0, 3).map((sk: string) => (
                                                            <span key={sk} className="text-[7px] font-black px-2 py-0.5 bg-zinc-50 text-zinc-400 rounded-md border border-zinc-100">{sk}</span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* 우측: 제안 금액 및 액션 */}
                                                <div className="flex items-center gap-6 min-w-[280px] justify-end">
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest leading-none mb-1">Bid Price</p>
                                                        <p className="text-lg font-bold text-zinc-950">₩{app.bidPrice?.toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {app.status === 'PENDING' ? (
                                                            app.source === 'PROPOSAL' ? (
                                                                <div className="px-5 py-2.5 bg-zinc-50/80 text-zinc-400 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] border border-zinc-100 flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-pulse" />
                                                                     수락 대기중
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleApplicationStatus(app.applicationId, 'REJECTED')} 
                                                                        className="group/rej px-6 py-3 bg-white border border-zinc-100 text-zinc-400 rounded-[1.2rem] transition-all hover:bg-red-50 hover:border-red-100 hover:text-red-500 active:scale-95 flex flex-col items-center justify-center gap-0.5 min-w-[100px] shadow-sm"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <XCircle size={14} className="group-hover/rej:rotate-90 transition-transform" />
                                                                            <span className="text-[11px] font-bold uppercase tracking-widest">거절</span>
                                                                        </div>
                                                                    </button>
                                                                    
                                                                    <div className="flex gap-3 ml-2 border-l border-zinc-100 pl-6">
                                                                    <button 
                                                                        onClick={() => handleDemoPayment(project, app)} 
                                                                        disabled={paymentDisabled}
                                                                        className={`group/btn px-7 py-3 bg-[#FF7D00] text-white rounded-[1.2rem] transition-all flex flex-col items-center justify-center gap-0.5 min-w-[140px] border border-orange-400/20 shadow-lg ${paymentDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.03] hover:shadow-xl hover:shadow-orange-500/20 active:scale-95'}`}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <CreditCard size={14} className="group-hover/btn:rotate-12 transition-transform" />
                                                                            <span className="text-[11px] font-bold uppercase tracking-widest">수락</span>
                                                                        </div>
                                                                    </button>
                                                                    
                                                                    <button 
                                                                        onClick={() => handlePayment(project, app)} 
                                                                        disabled={paymentDisabled}
                                                                        className={`group/btn px-7 py-3 bg-zinc-950 text-white rounded-[1.2rem] transition-all flex flex-col items-center justify-center gap-0.5 min-w-[140px] border border-zinc-800 shadow-lg ${paymentDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.03] hover:shadow-xl hover:shadow-zinc-900/20 active:scale-95'}`}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <ShieldCheck size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                                            <span className="text-[11px] font-bold uppercase tracking-widest">수락</span>
                                                                        </div>
                                                                    </button>
                                                                    </div>
                                                                </>
                                                            )
                                                        ) : (
                                                            <div className="flex items-center gap-3">
                                                                <div className={`px-4 py-2.5 rounded-lg text-[9px] font-black flex items-center gap-2 uppercase border tracking-widest ${app.status === 'ACCEPTED' ? 'bg-orange-50 text-[#FF7D00] border-orange-100' : 'bg-red-50 text-red-400 border-red-100'}`}>
                                                                    {app.status === 'ACCEPTED' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                                    {app.status === 'ACCEPTED' ? 'CONFIRMED' : 'REJECTED'}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
