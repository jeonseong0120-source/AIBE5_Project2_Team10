'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import {
    User, Users, CheckCircle, XCircle, Edit, Trash2,
    Calendar, DollarSign, Activity, ChevronRight,
    Briefcase, Heart, Send, Sparkles, Star, MapPin, Globe, Loader2, Clock, ArrowUpRight, Plus, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProposalSendModal, { mapProjectsForProposalPicker, type ProjectOption } from '@/components/proposal/ProposalSendModal';

import GlobalNavbar from '@/components/common/GlobalNavbar';
import FreelancerReviewModal from '@/components/review/FreelancerReviewModal';

export default function ClientDashboardPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedProjectForReview, setSelectedProjectForReview] = useState<any>(null);

    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [bookmarksLoading, setBookmarksLoading] = useState(false);
    const [bookmarkPage, setBookmarkPage] = useState(0);
    const [hasMoreBookmarks, setHasMoreBookmarks] = useState(true);

    const [activeMainTab, setActiveMainTab] = useState<'PROJECTS' | 'BOOKMARKS' | 'PROPOSALS'>('PROJECTS');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
    const [applicantsByProject, setApplicantsByProject] = useState<{ [key: number]: any[] }>({});
    const [loadingApplicants, setLoadingApplicants] = useState<{ [key: number]: boolean }>({});
    const [applicantsErrorByProject, setApplicantsErrorByProject] = useState<{ [key: number]: boolean }>({});
    const [selectedProjectForApplicant, setSelectedProjectForApplicant] = useState<any>(null);

    const [sentProposals, setSentProposals] = useState<any[]>([]);
    const [proposalsLoading, setProposalsLoading] = useState(false);
    const [proposalModalOpen, setProposalModalOpen] = useState(false);
    const [proposalTargetFreelancer, setProposalTargetFreelancer] = useState<any>(null);
    const [proposalMode, setProposalMode] = useState<'PROJECT' | 'FORM'>('PROJECT');
    const [proposalProjects, setProposalProjects] = useState<ProjectOption[]>([]);
    const [proposalProjectsLoading, setProposalProjectsLoading] = useState(false);
    const [proposalProjectId, setProposalProjectId] = useState<number | null>(null);
    const [proposalOfferedPrice, setProposalOfferedPrice] = useState('');
    const [proposalMessage, setProposalMessage] = useState('');
    const [proposalPositionTitle, setProposalPositionTitle] = useState('');
    const [proposalWorkScope, setProposalWorkScope] = useState('');
    const [proposalWorkingPeriod, setProposalWorkingPeriod] = useState('');
    const [proposalSending, setProposalSending] = useState(false);
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const [paymentProjectIdInFlight, setPaymentProjectIdInFlight] = useState<number | null>(null);

    const [cursor, setCursor] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await api.get("/v1/users/me");
                const roles = res.data.role || "";
                if (!roles.includes("CLIENT") && !roles.includes("BOTH")) {
                    alert("클라이언트 또는 BOTH 계정만 접근 가능합니다.");
                    if (roles.includes("FREELANCER")) return router.replace("/");
                    return router.replace("/onboarding");
                }
                setUser(res.data);
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
            setProjects(projectArray);
        } catch (err) { console.error("로드 실패", err); } finally { setLoading(false); }
    };

    const fetchBookmarks = useCallback(async (isLoadMore = false) => {
        if (!isLoadMore) { setBookmarksLoading(true); setBookmarkPage(0); }
        const targetPage = isLoadMore ? bookmarkPage + 1 : 0;
        try {
            const { data } = await api.get(`/v1/bookmarks/freelancers?page=${targetPage}&size=9`);
            const newContent = data.content || [];
            setBookmarks(prev => isLoadMore ? [...prev, ...newContent] : newContent);
            setBookmarkPage(targetPage);
            setHasMoreBookmarks(!data.last);
        } catch (err) { console.error("찜 목록 로드 실패", err); } finally { setBookmarksLoading(false); }
    }, [bookmarkPage]);

    const fetchSentProposals = async () => {
        setProposalsLoading(true);
        try {
            const { data } = await api.get('/v1/proposals/sent');
            setSentProposals(data || []);
        } catch (err) { console.error("제안 로드 실패", err); } finally { setProposalsLoading(false); }
    };

    const handleRemoveBookmark = async (profileId: number) => {
        if (!confirm("찜 목록에서 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/v1/bookmarks/freelancers/${profileId}`);
            fetchBookmarks(false);
        } catch (err) { alert("삭제에 실패했습니다."); }
    };

    const openProposalModal = async (freelancer: any) => {
        setProposalTargetFreelancer(freelancer);
        setProposalModalOpen(true);
        setProposalProjectsLoading(true);
        setProposalMode('PROJECT');
        try {
            const { data } = await api.get('/v1/projects/me');
            const usable = mapProjectsForProposalPicker(data?.content ?? data ?? []);
            setProposalProjects(usable);
            setProposalProjectId(usable.length > 0 ? usable[0].projectId : null);
        } catch {
            setProposalProjects([]);
            setProposalProjectId(null);
        } finally {
            setProposalProjectsLoading(false);
        }
    };

    const closeProposalModal = () => {
        if (proposalSending) return;
        setProposalModalOpen(false);
        setProposalTargetFreelancer(null);
        setProposalOfferedPrice('');
        setProposalMessage('');
        setProposalPositionTitle('');
        setProposalWorkScope('');
        setProposalWorkingPeriod('');
    };

    const buildProposalMessageFromForm = () => {
        const chunks = [
            proposalPositionTitle.trim() ? `포지션: ${proposalPositionTitle.trim()}` : '',
            proposalWorkScope.trim() ? `업무 범위: ${proposalWorkScope.trim()}` : '',
            proposalWorkingPeriod.trim() ? `예상 기간: ${proposalWorkingPeriod.trim()}` : '',
            proposalMessage.trim() ? `추가 메시지: ${proposalMessage.trim()}` : '',
        ].filter(Boolean);
        return chunks.join('\n');
    };

    const buildStandaloneProjectPayload = (parsedPrice: number) => {
        const title = proposalPositionTitle.trim() || '제안서 기반 협업 프로젝트';
        const details = [
            '[자동 생성] 제안서 기반 프로젝트',
            proposalWorkScope.trim() ? `업무 범위: ${proposalWorkScope.trim()}` : '',
            proposalWorkingPeriod.trim() ? `예상 기간: ${proposalWorkingPeriod.trim()}` : '',
            proposalMessage.trim() ? `추가 메시지: ${proposalMessage.trim()}` : '',
        ].filter(Boolean).join('\n');
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);
        const deadlineStr = [
            deadline.getFullYear(),
            String(deadline.getMonth() + 1).padStart(2, '0'),
            String(deadline.getDate()).padStart(2, '0'),
        ].join('-');
        return {
            projectName: `[제안서] ${title}`,
            budget: Math.max(1, Math.floor(parsedPrice)),
            deadline: deadlineStr,
            detail: details,
            online: true,
            offline: false,
            location: null,
            latitude: null,
            longitude: null,
            skills: [],
        };
    };

    const handleSendProposal = async () => {
        if (!proposalTargetFreelancer?.profileId) return;
        if (proposalMode === 'PROJECT' && !proposalProjectId) {
            alert('연결할 프로젝트를 선택해주세요.');
            return;
        }

        const parsedPrice = Number(proposalOfferedPrice);
        if (!Number.isInteger(parsedPrice) || parsedPrice < 1) {
            alert('제안 금액은 1원 이상의 정수로 입력해주세요.');
            return;
        }
        if (proposalMode === 'FORM' && !proposalPositionTitle.trim()) {
            alert('포지션명을 입력해주세요.');
            return;
        }

        if (proposalMode === 'FORM' && !proposalWorkScope.trim()) {
            alert('업무 범위를 입력해주세요.');
            return;
        }

        const composedMessage = proposalMode === 'FORM' ? buildProposalMessageFromForm() : proposalMessage.trim();
        if (!composedMessage) {
            alert('제안 메시지를 입력해주세요.');
            return;
        }

        const payload = {
            projectId: proposalProjectId,
            freelancerProfileId: proposalTargetFreelancer.profileId,
            offeredPrice: parsedPrice,
            message: composedMessage,
        };

        setProposalSending(true);
        try {
            if (proposalMode === 'FORM') {
                await api.post('/v1/proposals/with-standalone-project', {
                    project: buildStandaloneProjectPayload(parsedPrice),
                    freelancerProfileId: proposalTargetFreelancer.profileId,
                    offeredPrice: parsedPrice,
                    message: composedMessage,
                });
            } else {
                await api.post('/v1/proposals', payload);
            }
            alert('제안을 전송했습니다.');
            closeProposalModal();
            fetchSentProposals();
        } catch (e: any) {
            const status = e?.response?.status;
            const raw = e?.response?.data?.message;
            const msg = typeof raw === 'string' ? raw : '';
            const reqUrl = String(e?.response?.config?.url ?? '');
            const wasStandaloneRequest =
                proposalMode === 'FORM' || reqUrl.includes('with-standalone-project');
            const likelyAlreadyProposed =
                msg.includes('ALREADY_PROPOSED') || (status === 400 && wasStandaloneRequest);
            if (likelyAlreadyProposed) {
                alert('이미 해당 프로젝트로 이 프리랜서에게 제안을 보냈습니다.');
            } else {
                alert('제안 전송에 실패했습니다.');
            }
        } finally {
            setProposalSending(false);
        }
    };

    useEffect(() => {
        if (authorized) {
            api.get('/client/profile').then(res => setProfile(res.data)).catch(() => {});
            if (activeMainTab === 'PROJECTS') fetchMyProjects();
            if (activeMainTab === 'BOOKMARKS') fetchBookmarks(false);
            if (activeMainTab === 'PROPOSALS') fetchSentProposals();
        }
    }, [authorized, activeMainTab]);

    const handleEditProjectClick = (projectId: number) => router.push(`/client/projects/${projectId}/edit`);

    const handleCompleteProject = async (project: any) => {
        const acceptedApp = applicantsByProject[project.projectId]?.find(a => a.status === 'ACCEPTED');

        if (!acceptedApp) {
            alert("수락된 지원자 정보를 찾을 수 없습니다. '지원자 확인' 버튼을 눌러 목록을 로드한 뒤 다시 시도해주세요!");
            return;
        }

        if (!confirm('작업을 완료처리하시겠습니까? 마감 후 프리랜서 리뷰 작성이 가능합니다.')) return;

        try {
            await api.patch(`/v1/projects/${project.projectId}/complete`, {});
            alert('프로젝트가 완료되었습니다.');

            setSelectedProjectForReview({
                projectId: project.projectId,
                freelancerId: acceptedApp.freelancerId,
                freelancerNickname: acceptedApp.freelancerNickname
            });

            setIsReviewModalOpen(true);
            fetchMyProjects();
        } catch (err) {
            alert('완료 처리 실패 (상태를 확인해주세요)');
        }
    };

    const handleDeleteProject = async (projectId: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try { await api.delete(`/v1/projects/${projectId}`); fetchMyProjects(); } catch (err) { alert('삭제 실패'); }
    };

    const handleViewApplicants = async (project: any) => {
        const pid = project.projectId;
        if (expandedProjectId === pid) { setExpandedProjectId(null); return; }
        setSelectedProjectForApplicant(project);
        setExpandedProjectId(pid);
        if (applicantsByProject[pid] && !applicantsErrorByProject[pid]) return;
        setLoadingApplicants(prev => ({ ...prev, [pid]: true }));
        setApplicantsErrorByProject(prev => ({ ...prev, [pid]: false }));
        try {
            const { data } = await api.get(`/projects/${pid}/applications`);
            setApplicantsByProject(prev => ({ ...prev, [pid]: data }));
        } catch (err) { setApplicantsErrorByProject(prev => ({ ...prev, [pid]: true })); } finally { setLoadingApplicants(prev => ({ ...prev, [pid]: false })); }
    };

    const handleApplicationStatus = async (applicationId: number, status: 'ACCEPTED' | 'REJECTED') => {
        try {
            await api.patch(`/applications/${applicationId}/status`, { status });
            alert(`지원자가 ${status === 'ACCEPTED' ? '수락' : '거절'} 처리되었습니다.`);
            fetchMyProjects();
            if (selectedProjectForApplicant) {
                const { data } = await api.get(`/projects/${selectedProjectForApplicant.projectId}/applications`);
                setApplicantsByProject(prev => ({ ...prev, [selectedProjectForApplicant.projectId]: data }));
            }
        } catch (err) { alert('상태 처리 중 오류가 발생했습니다.'); }
    };

    const handlePayment = async (project: any, application: any) => {
        try {
            setPaymentProjectIdInFlight(project.projectId);
            const tossClientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
            if (!tossClientKey) {
                alert('결제 환경 변수가 설정되지 않았습니다.');
                setPaymentProjectIdInFlight(null);
                return;
            }

            // 1. 보안을 위한 주문번호 생성 및 정보 세팅
            const orderId = `devnear_order_${new Date().getTime()}_${Math.random().toString(36).substring(2, 8)}`;
            const amount = Math.floor(project.budget || 0);
            const orderName = project.projectName || '프로젝트 결제';

            if (!amount || amount <= 0) {
                alert(`유효하지 않은 결제 금액입니다: ${amount}`);
                setPaymentProjectIdInFlight(null);
                return;
            }

            if (!project.projectId) {
                alert('프로젝트 ID를 찾을 수 없습니다.');
                setPaymentProjectIdInFlight(null);
                return;
            }

            // 2. 백엔드 결제 준비 (Prepare) 호출 - 데이터 위변조 방지
            console.log('Sending prepare request:', {
                orderId,
                amount,
                orderName,
                projectId: project.projectId,
                apiUrl: '/v1/payments/prepare'
            });

            await api.post('/v1/payments/prepare', {
                orderId,
                amount,
                orderName,
                projectId: project.projectId
            });

            // 3. 토스 SDK 로드 및 결제창 띄우기
            const originalConsoleError = console.error;
            try {
                // 토스 내부 기능 토글 에러({})가 Next.js 빨간 화면을 띄우지 않도록 한시적 차단
                console.error = () => {};

                const { loadTossPayments } = await import('@tosspayments/payment-sdk');
                const tossPayments = await loadTossPayments(tossClientKey);

                const successUrl = `${window.location.origin}/client/payment/success`;
                const failUrl = `${window.location.origin}/client/payment/fail`;

                // 기존의 토스페이먼츠 카드 결제창을 호출하여 다양한 결제 수단 제공
                await tossPayments.requestPayment('카드', {
                    amount,
                    orderId,
                    orderName,
                    customerName: profile?.nickname || user?.nickname || '의뢰인',
                    successUrl,
                    failUrl,
                });
            } finally {
                // 호출 완료 또는 예외 발생 시 즉시 원래의 console.error 복구
                console.error = originalConsoleError;
            }

        } catch (err: any) {
            const errorInfo = {
                message: err?.message || err?.desc || 'No message provided',
                code: err?.code,
                response: err?.response?.data,
                status: err?.response?.status,
                raw: typeof err === 'object' ? { ...err } : err,
                stack: err?.stack || 'No stack trace'
            };
            
            // console.error 대신 console.warn을 사용하여 Next.js 오버레이 트리거 방지
            console.warn('Payment Notification (Handled):', errorInfo);
            
            // 토스페이먼츠 사용자 취소 또는 '취소되었습니다' 에러는 경고창을 띄우지 않음
            if (err?.code === 'USER_CANCEL' || err?.message?.includes('취소되었습니다')) {
                console.log('사용자가 결제창을 닫았거나 결제가 취소되었습니다.');
                setPaymentProjectIdInFlight(null);
                return;
            }

            alert(err?.response?.data?.message || err?.message || err?.code || '결제 진행 중 오류가 발생했습니다.');
            setPaymentProjectIdInFlight(null);
        }
    };

    const handleDemoPayment = async (project: any, application: any) => {
        try {
            setPaymentProjectIdInFlight(project.projectId);
            // 1. 보안을 위한 주문번호 생성 및 정보 세팅
            const orderId = `devnear_order_demo_${new Date().getTime()}_${Math.random().toString(36).substring(2, 8)}`;
            const amount = Math.floor(project.budget || 0);
            const orderName = project.projectName || '데모 프로젝트 결제';

            if (!amount || amount <= 0) {
                alert(`유효하지 않은 데모 결제 금액입니다: ${amount}`);
                setPaymentProjectIdInFlight(null);
                return;
            }

            // 2. 백엔드 결제 준비 (Prepare) 호출
            console.log('Sending demo prepare request:', {
                orderId,
                amount,
                orderName,
                projectId: project.projectId
            });

            await api.post('/v1/payments/prepare', {
                orderId,
                amount,
                orderName,
                projectId: project.projectId
            });

            // 3. 시뮬레이션 오버레이 표시
            setIsPaymentProcessing(true);

            // 4. 1.5초 후 가짜 성공 데이터와 함께 성공 페이지로 이동
            setTimeout(() => {
                const mockPaymentKey = `mock_${new Date().getTime()}_${Math.random().toString(36).substring(2, 6)}`;
                router.push(`/client/payment/success?paymentKey=${mockPaymentKey}&orderId=${orderId}&amount=${amount}`);
                setPaymentProjectIdInFlight(null); // Cleanup in demo flow
            }, 1500);

        } catch (err: any) {
             const errorInfo = {
                message: err?.message || 'No message provided',
                code: err?.code,
                response: err?.response?.data,
                status: err?.response?.status,
                raw: typeof err === 'object' ? { ...err } : err,
                stack: err?.stack || 'No stack trace'
            };
            console.warn('Demo Payment Notification (Handled):', errorInfo);
            
            alert(err?.response?.data?.message || err?.message || err?.code || '데모 결제 준비 중 오류가 발생했습니다.');
            setPaymentProjectIdInFlight(null);
        }
    };

    if (!authorized || loading) return (

        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-[#FF7D00] font-black text-xl animate-pulse uppercase font-mono">데이터 동기화 중...</div>
    );

    const statusPriority: { [key: string]: number } = {
        'OPEN': 1,
        'IN_PROGRESS': 2,
        'COMPLETED': 3
    };

    const filteredProjects = projects
        .filter(p => {
            if (filterStatus === 'ALL') return true;
            return p.status === filterStatus;
        })
        .sort((a, b) => {
            const priorityA = statusPriority[a.status] || 4;
            const priorityB = statusPriority[b.status] || 4;

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return b.projectId - a.projectId;
        });

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 relative overflow-hidden font-sans">
            <div className="pointer-events-none fixed left-0 top-0 z-0 h-[300px] w-[300px] rounded-full bg-[#FF7D00]/20 blur-[120px] will-change-transform" style={{ transform: `translate(${cursor.x - 150}px, ${cursor.y - 150}px)` }} />
            <GlobalNavbar user={user} profile={profile} />

            <header className="relative pt-24 pb-16 px-8 overflow-hidden max-w-6xl mx-auto">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-6">
                    <span className="w-12 h-[3px] bg-[#FF7D00] rounded-full"></span>
                    <span className="text-[11px] font-black text-[#FF7D00] uppercase tracking-[0.4em] font-mono">관리 콘솔</span>
                </motion.div>
                <h1 className="text-5xl font-black tracking-tighter mb-12 text-zinc-950">클라이언트 <span className="text-zinc-400">대시보드</span></h1>

                <div className="flex gap-10 border-b border-zinc-200/50">
                    {[
                        { id: 'PROJECTS', label: '프로젝트 관리', icon: <Briefcase size={18} /> },
                        { id: 'BOOKMARKS', label: '관심 프리랜서', icon: <Heart size={18} /> },
                        { id: 'PROPOSALS', label: '제안 현황', icon: <Send size={18} /> }
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveMainTab(tab.id as any)} className={`flex items-center gap-2.5 pb-6 text-sm font-black transition-all relative ${activeMainTab === tab.id ? 'text-[#FF7D00]' : 'text-zinc-400 hover:text-zinc-600'}`}>
                            {tab.icon} {tab.label}
                            {activeMainTab === tab.id && <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF7D00] rounded-t-full shadow-[0_-4px_10px_#FF7D00]" />}
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-8 py-16 relative z-10">
                {activeMainTab === 'PROJECTS' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black tracking-tight text-zinc-950 uppercase font-mono">프로젝트 목록</h2>
                                <span className="px-3 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-black text-[#FF7D00]">총 {filteredProjects.length}개</span>
                                <button onClick={() => router.push("/client/projects/new")} className="p-2.5 bg-white border border-zinc-200 text-[#FF7D00] rounded-xl hover:bg-[#FF7D00] hover:text-white transition-all shadow-sm group"><Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} /></button>
                            </div>
                            <div className="flex gap-2 p-2 bg-white/50 backdrop-blur-md border border-zinc-200 rounded-3xl">
                                {[{ id: 'ALL', label: '전체' }, { id: 'OPEN', label: '모집중' }, { id: 'IN_PROGRESS', label: '진행중' }, { id: 'COMPLETED', label: '마감됨' }].map((s) => (
                                    <button key={s.id} onClick={() => setFilterStatus(s.id)} className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all tracking-wider uppercase font-mono ${filterStatus === s.id ? 'bg-zinc-950 text-white shadow-xl' : 'text-zinc-400 hover:text-zinc-600'}`}>{s.label}</button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-8">
                            {filteredProjects.map((project) => {
                                const isExpanded = expandedProjectId === project.projectId;
                                const projectApplicants = applicantsByProject[project.projectId] || [];

                                return (
                                    <div key={project.projectId} className="flex flex-col gap-3">
                                        <motion.div className={`group bg-white p-10 rounded-[2.5rem] border transition-all duration-500 ${isExpanded ? 'border-[#FF7D00] shadow-2xl ring-1 ring-[#FF7D00]/20' : 'border-zinc-100 shadow-xl hover:border-[#FF7D00]/30'}`}>
                                            <div className="flex flex-col xl:flex-row justify-between items-center gap-8 w-full">
                                                <div className="flex-1 w-full">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase font-mono border ${project.status === 'OPEN' ? 'bg-[#FF7D00]/10 text-[#FF7D00] border-[#FF7D00]/20' : project.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-zinc-50 text-zinc-400'}`}>
                                                        {project.status === 'OPEN' ? '모집중' : project.status === 'IN_PROGRESS' ? '진행중' : '마감됨'}
                                                    </span>
                                                    <h3 className="text-3xl font-black text-zinc-900 mt-4 group-hover:text-[#FF7D00] transition-colors tracking-tight">{project.projectName}</h3>
                                                    <div className="flex gap-8 mt-6 text-xs font-bold text-zinc-400 font-mono uppercase">
                                                        <span><DollarSign size={16} className="inline mr-1 text-[#FF7D00]"/>{project.budget?.toLocaleString()}원</span>
                                                        <span><Calendar size={16} className="inline mr-1 text-[#FF7D00]"/>{project.deadline} 마감</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-5">
                                                    <div className="flex gap-2 px-4 border-x border-zinc-100">
                                                        {project.status === 'IN_PROGRESS' ? (
                                                            <button
                                                                onClick={() => handleCompleteProject(project)}
                                                                className="px-6 py-3 bg-zinc-950 text-white rounded-xl text-[10px] font-black hover:bg-[#FF7D00] transition-all uppercase tracking-widest font-mono shadow-md"
                                                            >
                                                                프로젝트 마감
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleEditProjectClick(project.projectId)} className="p-4 text-zinc-300 hover:text-[#7A4FFF] transition-all"><Edit size={20} /></button>
                                                                <button onClick={() => handleDeleteProject(project.projectId)} className="p-4 text-zinc-300 hover:text-red-500 transition-all"><Trash2 size={20} /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                    <button onClick={() => handleViewApplicants(project)} className={`px-10 py-5 rounded-[1.5rem] font-black text-xs tracking-[0.2em] uppercase transition-all flex items-center gap-3 shadow-2xl font-mono ${isExpanded ? 'bg-[#FF7D00] text-white shadow-orange-200' : 'bg-zinc-950 text-white hover:bg-[#FF7D00]'}`}>
                                                        <Users size={18} /> 지원자 확인 {projectApplicants.length > 0 && `(${projectApplicants.length})`}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                    <div className="mt-2 mb-12 p-3 bg-white border border-zinc-200 shadow-2xl rounded-[3rem]">
                                                        {loadingApplicants[project.projectId] ? (
                                                            <div className="py-24 flex flex-col items-center justify-center gap-5"><Loader2 className="w-10 h-10 animate-spin text-[#FF7D00]" /><span className="animate-pulse tracking-[0.3em] text-xs font-black font-mono text-zinc-400 uppercase">지원자 정보를 동기화 중...</span></div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                                                                {projectApplicants.length === 0 ? (
                                                                    <div className="col-span-2 py-24 text-center text-zinc-200 font-black border-4 border-dashed border-zinc-50 rounded-[2.5rem] text-2xl font-mono uppercase">지원자가 없습니다</div>
                                                                ) : (
                                                                    projectApplicants.map((app: any) => (
                                                                        <div key={app.applicationId} className={`p-8 bg-zinc-50 rounded-[2rem] border transition-all hover:bg-white hover:shadow-xl ${app.status === 'ACCEPTED' ? 'border-[#FF7D00] bg-orange-50/30' : 'border-zinc-100'}`}>
                                                                            <div className="flex items-center gap-6 mb-8">
                                                                                <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200 overflow-hidden cursor-pointer shadow-sm" onClick={() => router.push(`/freelancer/${app.freelancerId}`)}>{app.freelancerProfileImageUrl ? <img src={app.freelancerProfileImageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-300"><User size={28} /></div>}</div>
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-3 mb-1">
                                                                                        <h4 className="font-black text-xl text-zinc-900">{app.freelancerNickname}</h4>
                                                                                        <span className="text-[10px] font-black text-[#FF7D00] bg-white px-2 py-0.5 rounded border border-orange-100">일치율 {Math.round(app.matchingRate)}%</span>
                                                                                        {app.source === 'PROPOSAL' && (
                                                                                            <span className="text-[10px] font-black text-white bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 uppercase font-mono tracking-wider animate-pulse">역제안 보냄</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center justify-between pt-6 border-t border-zinc-200/50">
                                                                                <p className="text-xl font-black text-zinc-950 font-mono italic">₩{app.bidPrice?.toLocaleString()}</p>
                                                                                <div className="flex gap-2">
                                                                                    {app.status === 'PENDING' ? (
                                                                                        app.source === 'PROPOSAL' ? (
                                                                                            <div className="px-6 py-3 bg-white border border-zinc-200 text-zinc-400 rounded-xl text-[10px] font-black uppercase italic tracking-tighter">
                                                                                                프리랜서 응답 대기 중
                                                                                            </div>
                                                                                        ) : (
                                                                                            <><button onClick={() => handleApplicationStatus(app.applicationId, 'ACCEPTED')} className="px-6 py-3 bg-zinc-950 text-white rounded-xl text-[10px] font-black hover:bg-[#FF7D00] transition-all uppercase">수락</button><button onClick={() => handleApplicationStatus(app.applicationId, 'REJECTED')} className="px-6 py-3 bg-white border border-zinc-200 text-zinc-400 rounded-xl text-[10px] font-black hover:text-red-500 transition-all uppercase">거절</button></>
                                                                                        )
                                                                                    ) : (
                                                                                        <div className="flex flex-col gap-2 min-w-[120px]">
                                                                                            <div className={`px-6 py-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 uppercase border ${app.status === 'ACCEPTED' ? 'bg-orange-50 text-[#FF7D00] border-orange-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                                                                                                {app.status === 'ACCEPTED' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                                                                {app.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                                                                                            </div>
                                                                                            {app.status === 'ACCEPTED' && project.status === 'OPEN' && (
                                                                                                <div className="flex flex-col gap-2 mt-2">
                                                                                                    <button
                                                                                                        onClick={() => handlePayment(project, app)}
                                                                                                        disabled={paymentProjectIdInFlight === project.projectId}
                                                                                                        className="w-full px-4 py-3 bg-zinc-950 text-white rounded-xl text-[10px] font-black hover:bg-zinc-800 transition-all uppercase tracking-widest font-mono shadow-md disabled:opacity-50"
                                                                                                    >
                                                                                                        {paymentProjectIdInFlight === project.projectId ? '처리 중...' : '안전 결제하기'}
                                                                                                    </button>
                                                                                                    <button
                                                                                                        onClick={() => handleDemoPayment(project, app)}
                                                                                                        disabled={paymentProjectIdInFlight === project.projectId}
                                                                                                        className="w-full px-4 py-3 bg-[#FF7D00] text-white rounded-xl text-[10px] font-black hover:bg-orange-600 transition-all uppercase tracking-widest font-mono shadow-[0_4px_15px_rgba(255,125,0,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
                                                                                                    >
                                                                                                        <Sparkles size={14} className={paymentProjectIdInFlight === project.projectId ? "" : "animate-pulse"} />
                                                                                                        {paymentProjectIdInFlight === project.projectId ? '처리 중...' : '번개 데모 결제'}
                                                                                                    </button>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
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
                            })}
                        </div>
                    </motion.div>
                )}

                {activeMainTab === 'BOOKMARKS' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
                        <div className="flex items-center justify-between mb-4">
                            <div><h2 className="text-3xl font-black tracking-tight text-zinc-950 uppercase font-mono mb-2">관심 프리랜서</h2><p className="text-sm font-medium text-zinc-400">지목한 최정상급 프리랜서 후보군입니다.</p></div>
                            <span className="px-5 py-2 bg-white border border-zinc-200 rounded-2xl text-xs font-black text-[#FF7D00]">프리랜서 수: {bookmarks.length}명</span>
                        </div>
                        {bookmarks.length === 0 && !bookmarksLoading ? (
                            <div className="text-center py-48 bg-white/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-zinc-200 font-black text-zinc-200 italic uppercase tracking-tighter">찜한 인재가 없습니다</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {bookmarks.map((freelancer, idx) => (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={freelancer.profileId} className="group bg-white p-10 rounded-[3rem] border border-zinc-100 hover:border-[#FF7D00] hover:shadow-[0_20px_50px_rgba(255,125,0,0.15)] transition-all relative">
                                        <button onClick={() => handleRemoveBookmark(freelancer.profileId)} className="absolute top-8 right-8 p-3 bg-zinc-50 rounded-2xl text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={18} /></button>
                                        <div className="flex flex-col items-center text-center mb-8 cursor-pointer" onClick={() => router.push(`/freelancer/${freelancer.profileId}`)}>
                                            <div className="w-24 h-24 rounded-[2rem] bg-zinc-100 overflow-hidden border-4 border-white shadow-xl mb-6">{freelancer.profileImageUrl ? <img src={freelancer.profileImageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-300 bg-zinc-50"><User size={40} /></div>}</div>
                                            <div className="flex items-center gap-2 mb-2"><h3 className="text-2xl font-black text-zinc-900 group-hover:text-[#FF7D00] transition-colors">{freelancer.userName}</h3><span className="px-2 py-0.5 bg-zinc-950 text-white text-[9px] font-black rounded font-mono uppercase">{freelancer.gradeName}</span></div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF7D00] mb-4">
                                                <Star size={16} fill="#FF7D00" strokeWidth={0} />
                                                <span>{(freelancer.averageRating ?? 0).toFixed(1)}</span>
                                                <span className="text-zinc-300 ml-1 font-mono">({freelancer.reviewCount} 리뷰)</span>
                                            </div>
                                            <p className="text-xs font-medium text-zinc-400 line-clamp-2 italic leading-relaxed">"{freelancer.introduction || "준비된 프리랜서입니다."}"</p>
                                        </div>
                                        <div className="space-y-2">
                                            <button onClick={() => router.push(`/freelancer/${freelancer.profileId}`)} className="w-full py-4 bg-zinc-50 text-zinc-400 group-hover:bg-[#FF7D00] group-hover:text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all font-mono">프로필 상세보기</button>
                                            <button onClick={() => openProposalModal(freelancer)} className="w-full py-4 bg-zinc-950 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all hover:bg-[#FF7D00] font-mono">제안 보내기</button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* 🎯 제안 현황 UI 렌더링 로직 추가 */}
                {activeMainTab === 'PROPOSALS' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight text-zinc-950 uppercase font-mono mb-2">제안 현황</h2>
                                <p className="text-sm font-medium text-zinc-400">요원들에게 발송한 제안 내역입니다.</p>
                            </div>
                            <span className="px-5 py-2 bg-white border border-zinc-200 rounded-2xl text-xs font-black text-[#FF7D00]">전송된 제안: {sentProposals.length}건</span>
                        </div>

                        {proposalsLoading ? (
                            <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-[#FF7D00] w-10 h-10" /></div>
                        ) : sentProposals.length === 0 ? (
                            <div className="text-center py-48 bg-white/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-zinc-200 font-black text-zinc-200 italic uppercase tracking-tighter">보낸 제안이 없습니다</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {sentProposals.map((proposal, idx) => (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={proposal.proposalId || idx} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 hover:border-[#FF7D00] hover:shadow-xl transition-all relative">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${proposal.status === 'ACCEPTED' ? 'bg-green-50 text-green-500' : proposal.status === 'REJECTED' ? 'bg-red-50 text-red-500' : 'bg-zinc-100 text-zinc-500'}`}>
                                                {proposal.status || '대기중'}
                                            </span>
                                            <span className="text-xs text-zinc-400 font-mono">{new Date(proposal.createdAt || Date.now()).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-zinc-900 mb-2 truncate">{proposal.projectName || proposal.positionTitle || '프로젝트 제안'}</h3>
                                        <p className="text-sm text-zinc-500 mb-6 line-clamp-2">"{proposal.message}"</p>
                                        <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400"><User size={16} /></div>
                                                <span className="text-sm font-bold text-zinc-700">{proposal.freelancerName || '프리랜서'}</span>
                                            </div>
                                            <div className="text-lg font-black text-[#FF7D00] font-mono">
                                                ₩{proposal.offeredPrice?.toLocaleString() || '0'}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </main>

            <FreelancerReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                projectId={selectedProjectForReview?.projectId}
                freelancerId={selectedProjectForReview?.freelancerId}
                freelancerNickname={selectedProjectForReview?.freelancerNickname || "선택한 요원"}
            />

            <AnimatePresence>
                {proposalModalOpen ? (
                    <motion.div
                        key="client-dashboard-proposal-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.98 }}
                            className="w-full max-w-2xl"
                        >
                            <ProposalSendModal
                                open
                                targetName={proposalTargetFreelancer?.userName}
                                mode={proposalMode}
                                onChangeMode={setProposalMode}
                                projects={proposalProjects}
                                projectsLoading={proposalProjectsLoading}
                                selectedProjectId={proposalProjectId}
                                onChangeProjectId={setProposalProjectId}
                                offeredPrice={proposalOfferedPrice}
                                onChangeOfferedPrice={setProposalOfferedPrice}
                                positionTitle={proposalPositionTitle}
                                onChangePositionTitle={setProposalPositionTitle}
                                workScope={proposalWorkScope}
                                onChangeWorkScope={setProposalWorkScope}
                                workingPeriod={proposalWorkingPeriod}
                                onChangeWorkingPeriod={setProposalWorkingPeriod}
                                message={proposalMessage}
                                onChangeMessage={setProposalMessage}
                                sending={proposalSending}
                                onClose={closeProposalModal}
                                onSend={handleSendProposal}
                            />
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
            {/* 결제 처리 중 시뮬레이션 오버레이 (데모 모드) */}
            <AnimatePresence>
                {isPaymentProcessing && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md"
                    >
                        <div className="flex flex-col items-center gap-10">
                            <div className="relative">
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1] }} 
                                    transition={{ duration: 2, repeat: Infinity }} 
                                    className="w-32 h-32 rounded-full border-2 border-[#FF7D00]/30" 
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-12 h-12 text-[#FF7D00] animate-spin" />
                                </div>
                                <motion.div 
                                    className="absolute inset-0 rounded-full bg-[#FF7D00]/10"
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <h3 className="text-3xl font-black text-white tracking-widest font-mono uppercase">Secure Escrow Processing</h3>
                                <div className="flex gap-1.5">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div 
                                            key={i}
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                            className="w-2 h-2 rounded-full bg-[#FF7D00]"
                                        />
                                    ))}
                                </div>
                                <p className="mt-4 text-zinc-400 font-black text-[10px] tracking-[0.4em] uppercase">안전한 에스크로 거래를 체결 중입니다</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}