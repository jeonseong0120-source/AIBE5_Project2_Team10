'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import {
    User, Users, CheckCircle, XCircle, Edit, Trash2,
    Calendar, DollarSign, Activity, ChevronRight,
    Briefcase, Heart, Send, Sparkles, Star, MapPin, Globe, Loader2, Clock, ArrowUpRight, Plus, RefreshCcw, Search,
    CreditCard, ShieldCheck, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProposalSendModal, { mapProjectsForProposalPicker, type ProjectOption } from '@/components/proposal/ProposalSendModal';

import GlobalNavbar from '@/components/common/GlobalNavbar';
import FreelancerReviewModal from '@/components/review/FreelancerReviewModal';

// 🎯 [추가] 자동 매칭  모달 임포트
import MatchingresultForm from '@/components/project/MatchingresultForm';
import ClientProjectCard from '@/components/project/ClientProjectCard';
import FreelancerBookmarkCard from '@/components/freelancer/FreelancerBookmarkCard';

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
    const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
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

    // 🎯 [추가] 자동 매칭 결과 모달 제어 상태
    const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);
    const [selectedProjectIdForMatching, setSelectedProjectIdForMatching] = useState<number | null>(null);

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
                router.replace("/");
            }
        };
        checkAccess();
    }, [router]);

    const fetchMyProjects = async () => {
        try {
            const { data } = await api.get('/v1/projects/me');
            const projectArray = data.content || data || [];
            setProjects(projectArray);
            
            // 프로젝트별 지원자 정보를 미리 로드하여 수락된 제안이 있는지 확인
            const openProjects = projectArray.filter((p: any) => p.status === 'OPEN');
            
            // Promise.allSettled를 사용하여 일부 요청이 실패해도 전체 프로세스가 중단되지 않도록 함
            await Promise.allSettled(openProjects.map(async (p: any) => {
                try {
                    const res = await api.get(`/projects/${p.projectId}/applications`);
                    setApplicantsByProject(prev => ({ ...prev, [p.projectId]: res.data }));
                } catch (e) {
                    console.error(`프로젝트 ${p.projectId} 지원자 로드 실패:`, e);
                }
            }));
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
        let currentApplicants = applicantsByProject[project.projectId];

        // 지원자 목록이 로드되지 않은 경우 자동으로 로드 시도
        if (!currentApplicants || currentApplicants.length === 0) {
            try {
                const { data } = await api.get(`/projects/${project.projectId}/applications`);
                currentApplicants = data;
                setApplicantsByProject(prev => ({ ...prev, [project.projectId]: data }));
            } catch (err) {
                console.error("지원자 목록 로드 실패:", err);
            }
        }

        const acceptedApp = currentApplicants?.find(a => a.status === 'ACCEPTED');

        if (!acceptedApp) {
            alert("수락된 지원자 정보를 찾을 수 없습니다. 프로젝트 진행을 위해 먼저 파트너를 수락해주세요.");
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
            setFilterStatus('COMPLETED'); // 완료 후 '마감됨' 탭으로 이동
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
        if (status === 'ACCEPTED') {
            alert('결제를 완료하시면 자동으로 수락 처리됩니다.');
            return;
        }

        try {
            await api.patch(`/applications/${applicationId}/status`, { status });
            alert(`지원자가 거절 처리되었습니다.`);
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

            await api.post('/v1/payments/prepare', {
                orderId,
                amount,
                orderName,
                projectId: project.projectId,
                applicationId: application.applicationId,
                source: application.source || (application.proposalId ? 'PROPOSAL' : 'APPLICATION')
            });

            const originalConsoleError = console.error;
            try {
                console.error = () => {};
                const { loadTossPayments } = await import('@tosspayments/payment-sdk');
                const tossPayments = await loadTossPayments(tossClientKey);

                const successUrl = `${window.location.origin}/client/payment/success`;
                const failUrl = `${window.location.origin}/client/payment/fail`;

                await tossPayments.requestPayment('카드', {
                    amount,
                    orderId,
                    orderName,
                    customerName: profile?.nickname || user?.nickname || '의뢰인',
                    successUrl,
                    failUrl,
                });
            } finally {
                console.error = originalConsoleError;
            }

        } catch (err: any) {
            if (err?.code === 'USER_CANCEL' || err?.message?.includes('취소되었습니다')) {
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
            const orderId = `devnear_order_demo_${new Date().getTime()}_${Math.random().toString(36).substring(2, 8)}`;
            const amount = Math.floor(project.budget || 0);
            const orderName = project.projectName || '데모 프로젝트 결제';

            await api.post('/v1/payments/prepare', {
                orderId,
                amount,
                orderName,
                projectId: project.projectId,
                applicationId: application.applicationId,
                source: application.source || (application.proposalId ? 'PROPOSAL' : 'APPLICATION')
            });

            setIsPaymentProcessing(true);
            setTimeout(() => {
                const mockPaymentKey = `mock_${new Date().getTime()}_${Math.random().toString(36).substring(2, 6)}`;
                router.push(`/client/payment/success?paymentKey=${mockPaymentKey}&orderId=${orderId}&amount=${amount}`);
                setPaymentProjectIdInFlight(null);
            }, 1500);

        } catch (err: any) {
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
            // 날짜(projectId) 기준 정렬을 최우선으로 적용
            return sortOrder === 'DESC' ? b.projectId - a.projectId : a.projectId - b.projectId;
        });

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 pb-20 relative overflow-hidden font-sans">
            <div className="pointer-events-none fixed left-0 top-0 z-0 h-[300px] w-[300px] rounded-full bg-[#FF7D00]/20 blur-[120px] will-change-transform" style={{ transform: `translate(${cursor.x - 150}px, ${cursor.y - 150}px)` }} />
            <GlobalNavbar user={user} profile={profile} />

            <header className="relative pt-24 pb-16 px-8 overflow-hidden bg-white border-b border-zinc-100 text-center">
                {/* 십자가 무늬 배경 패턴 */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                     style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {/* 데코레이션 아이콘 */}
                <div className="absolute left-[-20px] bottom-4 opacity-5 hidden lg:block text-[#FF7D00]">
                    <Briefcase size={200} strokeWidth={0.5} />
                </div>
                <div className="absolute right-[-40px] top-10 opacity-5 hidden lg:block rotate-12 text-[#FF7D00]">
                    <Users size={240} strokeWidth={0.5} />
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <span className="w-12 h-[3px] bg-[#FF7D00] rounded-full"></span>
                            <span className="text-[11px] font-black text-[#FF7D00] uppercase tracking-[0.4em] font-mono">관리 콘솔</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-zinc-900 leading-tight">
                            클라이언트 <span className="text-[#FF7D00]">대시보드</span>
                        </h1>
                        <p className="text-zinc-400 text-sm font-medium max-w-lg mx-auto">등록한 프로젝트를 관리하고 지원자 정보를 확인하여 성공적인 팀을 구성하세요.</p>
                    </motion.div>

                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-12 relative z-10">
                {/* 🎯 메인 콘텐츠 영역 */}
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* 좌측 사이드바: 퀵 스탯 */}
                    <aside className="w-full lg:w-72 flex flex-col gap-10">
                        {/* 프로젝트 등록 버튼 */}
                        <button 
                            onClick={() => router.push("/client/projects/new")} 
                            className="group flex items-center justify-center gap-3 w-full py-4 bg-[#FF7D00] text-white rounded-2xl text-[11px] font-black hover:bg-zinc-950 transition-all shadow-lg shadow-orange-500/10 uppercase tracking-widest"
                        >
                            <Plus size={18} strokeWidth={3} /> 프로젝트 등록
                        </button>

                        {/* 메인 내비게이션 섹션 */}
                        <div className="flex flex-col gap-2">
                            <p className="px-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Management_Console</p>
                            {[
                                { id: 'PROJECTS', label: '프로젝트 관리', icon: <Briefcase size={18} /> },
                                { id: 'PROPOSALS', label: '제안 현황', icon: <Send size={18} /> },
                                { id: 'BOOKMARKS', label: '관심 프리랜서', icon: <Heart size={18} /> }
                            ].map((tab) => (
                                <button 
                                    key={tab.id} 
                                    onClick={() => setActiveMainTab(tab.id as any)} 
                                    className={`flex items-center gap-4 px-6 py-4 rounded-[1.2rem] text-[10px] font-black transition-all tracking-wider text-left ${
                                        activeMainTab === tab.id 
                                        ? 'bg-zinc-950 text-white shadow-xl translate-x-2' 
                                        : 'text-zinc-400 hover:text-zinc-600 hover:bg-white border border-transparent hover:border-zinc-100'
                                    }`}
                                >
                                    <span className={activeMainTab === tab.id ? 'text-[#FF7D00]' : ''}>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                    </aside>

                    {/* 우측 메인 리스트 */}
                    <div className="flex-1 min-w-0">
                        {activeMainTab === 'PROJECTS' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="sticky top-4 z-40 backdrop-blur-md pb-6 flex items-center gap-4">
                                    <div className="flex-1 bg-white/70 border border-zinc-100 rounded-full shadow-sm p-1.5">
                                        <div className="grid grid-cols-4 gap-1">
                                            {[{ id: 'ALL', label: '전체' }, { id: 'OPEN', label: '모집중' }, { id: 'IN_PROGRESS', label: '진행중' }, { id: 'COMPLETED', label: '마감됨' }].map((s) => (
                                                <button 
                                                    key={s.id} 
                                                    onClick={() => setFilterStatus(s.id)} 
                                                    className={`py-3 rounded-full text-[11px] font-black transition-all tracking-widest uppercase font-mono text-center ${
                                                        filterStatus === s.id 
                                                        ? 'bg-zinc-950 text-white shadow-xl scale-[1.02]' 
                                                        : 'text-zinc-400 hover:text-zinc-600 hover:bg-white/80'
                                                    }`}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                                        className="px-8 py-3.5 bg-zinc-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#FF7D00] transition-all flex items-center gap-3 shadow-xl shadow-zinc-100"
                                    >
                                        <Clock size={16} /> {sortOrder === 'DESC' ? 'Latest' : 'Oldest'}
                                    </button>
                                </div>

                                <div className="grid gap-10 mt-4">
                                    {filteredProjects.length === 0 ? (
                                        <div className="text-center py-40 bg-white/30 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-zinc-200">
                                            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Briefcase size={32} className="text-zinc-300" />
                                            </div>
                                            <h3 className="text-zinc-400 font-black text-xl font-mono uppercase tracking-widest">No_Project_Found</h3>
                                            <p className="text-zinc-400 text-xs mt-2 italic font-medium tracking-tight">등록된 프로젝트가 없거나 필터 조건에 맞는 결과가 없습니다.</p>
                                        </div>
                                    ) : (
                                        filteredProjects.map((project) => {
                                            const isExpanded = expandedProjectId === project.projectId;
                                            const projectApplicants = applicantsByProject[project.projectId] || [];

                                            return (
                                                <ClientProjectCard
                                                    key={project.projectId}
                                                    project={project}
                                                    isExpanded={isExpanded}
                                                    projectApplicants={projectApplicants}
                                                    loadingApplicants={loadingApplicants[project.projectId] || false}
                                                    handleEditProjectClick={handleEditProjectClick}
                                                    handleDeleteProject={handleDeleteProject}
                                                    handleCompleteProject={handleCompleteProject}
                                                    setSelectedProjectIdForMatching={setSelectedProjectIdForMatching}
                                                    setIsMatchingModalOpen={setIsMatchingModalOpen}
                                                    handleViewApplicants={handleViewApplicants}
                                                    handleApplicationStatus={handleApplicationStatus}
                                                    handleDemoPayment={handleDemoPayment}
                                                    handlePayment={handlePayment}
                                                    paymentDisabled={paymentProjectIdInFlight === project.projectId || isPaymentProcessing}
                                                />
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* 북마크 및 제안 탭은 기존 고도화된 스타일 유지하면서 좌측 사이드바와 조화롭게 배치 */}
                        {activeMainTab === 'BOOKMARKS' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                                <div className="sticky top-4 z-40 backdrop-blur-md pb-6 flex items-center justify-between">
                                    <button 
                                        onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                                        className="px-8 py-3.5 bg-zinc-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#FF7D00] transition-all flex items-center gap-3 shadow-xl shadow-zinc-100"
                                    >
                                        <Clock size={16} /> {sortOrder === 'DESC' ? 'Latest' : 'Oldest'}
                                    </button>
                                </div>
                                
                                {bookmarks.length === 0 ? (
                                    <div className="text-center py-48 bg-white/30 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-zinc-200">
                                        <Heart size={64} className="text-zinc-200 mx-auto mb-8" strokeWidth={0.5} />
                                        <h3 className="text-zinc-300 font-black text-2xl font-mono uppercase tracking-[0.3em]">Empty_Library</h3>
                                        <p className="text-zinc-400 text-xs mt-2 italic">찜한 인재가 없습니다. 탐색 페이지에서 파트너를 찾아보세요.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-8">
                                        {[...bookmarks].sort((a,b) => sortOrder === 'DESC' ? b.profileId - a.profileId : a.profileId - b.profileId).map((freelancer, idx) => (
                                            <FreelancerBookmarkCard 
                                                key={freelancer.profileId} 
                                                freelancer={freelancer} 
                                                idx={idx} 
                                                onOpenProposal={openProposalModal} 
                                                onRemoveBookmark={handleRemoveBookmark} 
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeMainTab === 'PROPOSALS' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                                <div className="sticky top-4 z-40 backdrop-blur-md pb-6 flex items-center justify-between">
                                    <button 
                                        onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                                        className="px-8 py-3.5 bg-zinc-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#FF7D00] transition-all flex items-center gap-3 shadow-xl shadow-zinc-100"
                                    >
                                        <Clock size={16} /> {sortOrder === 'DESC' ? 'Latest' : 'Oldest'}
                                    </button>
                                </div>

                                {sentProposals.length === 0 ? (
                                    <div className="text-center py-48 bg-white/30 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-zinc-200">
                                        <Send size={64} className="text-zinc-200 mx-auto mb-8" strokeWidth={0.5} />
                                        <h3 className="text-zinc-300 font-black text-2xl font-mono uppercase tracking-[0.3em]">No_Outbound_Offers</h3>
                                        <p className="text-zinc-400 text-xs mt-2 italic">전송된 제안서가 없습니다. 전문가에게 먼저 다가가보세요.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-8">
                                        {[...sentProposals].sort((a,b) => {
                                            const timeA = new Date(a.createdAt || 0).getTime();
                                            const timeB = new Date(b.createdAt || 0).getTime();
                                            return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
                                        }).map((proposal, idx) => (
                                            <motion.div 
                                                initial={{ opacity: 0, x: -20 }} 
                                                animate={{ opacity: 1, x: 0 }} 
                                                transition={{ delay: idx * 0.05 }} 
                                                key={proposal.proposalId || idx} 
                                                className="bg-white p-10 rounded-[3rem] border-2 border-zinc-50 hover:border-[#FF7D00] hover:shadow-2xl transition-all relative group/prop flex flex-col md:flex-row gap-10 items-start md:items-center"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] font-mono border-2 ${
                                                            proposal.status === 'ACCEPTED' ? 'bg-green-50 text-green-500 border-green-100' : 
                                                            proposal.status === 'REJECTED' ? 'bg-red-50 text-red-500 border-red-100' : 
                                                            'bg-zinc-50 text-zinc-400 border-zinc-100'
                                                        }`}>
                                                            {proposal.status || 'PENDING'}
                                                        </span>
                                                        <span className="text-[10px] font-black text-zinc-200 font-mono tracking-widest">{new Date(proposal.createdAt || Date.now()).toLocaleDateString()}</span>
                                                    </div>
                                                    
                                                    <h3 className="text-2xl font-black text-zinc-950 mb-3 truncate tracking-tighter group-hover/prop:text-[#FF7D00] transition-colors leading-none">
                                                        {proposal.projectName || proposal.positionTitle || 'Strategic Collaboration Offer'}
                                                    </h3>
                                                    
                                                    <p className="text-xs text-zinc-500 leading-relaxed italic max-w-xl">"{proposal.message}"</p>
                                                </div>

                                                <div className="flex items-center gap-8 pl-10 border-l border-zinc-50">
                                                    <div className="flex flex-col items-end">
                                                        <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mb-2 italic">Proposed_Budget</p>
                                                        <p className="text-2xl font-black text-[#FF7D00] font-mono italic tracking-tighter leading-none">₩{proposal.offeredPrice?.toLocaleString() || '0'}</p>
                                                    </div>
                                                    <div className="w-16 h-16 rounded-3xl bg-zinc-950 flex items-center justify-center text-white shadow-xl shadow-zinc-950/20 group-hover/prop:scale-110 transition-transform duration-500">
                                                        {proposal.freelancerName?.charAt(0) || 'U'}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>

            <FreelancerReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} projectId={selectedProjectForReview?.projectId} freelancerId={selectedProjectForReview?.freelancerId} freelancerNickname={selectedProjectForReview?.freelancerNickname || "선택한 요원"} />

            <AnimatePresence>
                {isMatchingModalOpen && selectedProjectIdForMatching && (
                    <MatchingresultForm
                        projectId={selectedProjectIdForMatching}
                        onClose={() => setIsMatchingModalOpen(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {proposalModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }} className="w-full max-w-2xl">
                            <ProposalSendModal open targetName={proposalTargetFreelancer?.userName} mode={proposalMode} onChangeMode={setProposalMode} projects={proposalProjects} projectsLoading={proposalProjectsLoading} selectedProjectId={proposalProjectId} onChangeProjectId={setProposalProjectId} offeredPrice={proposalOfferedPrice} onChangeOfferedPrice={setProposalOfferedPrice} positionTitle={proposalPositionTitle} onChangePositionTitle={setProposalPositionTitle} workScope={proposalWorkScope} onChangeWorkScope={setProposalWorkScope} workingPeriod={proposalWorkingPeriod} onChangeWorkingPeriod={setProposalWorkingPeriod} message={proposalMessage} onChangeMessage={setProposalMessage} sending={proposalSending} onClose={closeProposalModal} onSend={handleSendProposal} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isPaymentProcessing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md">
                        <div className="flex flex-col items-center gap-10">
                            <div className="relative"><motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-32 h-32 rounded-full border-2 border-[#FF7D00]/30" /><div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-12 h-12 text-[#FF7D00] animate-spin" /></div><motion.div className="absolute inset-0 rounded-full bg-[#FF7D00]/10" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} /></div>
                            <div className="flex flex-col items-center gap-3"><h3 className="text-3xl font-black text-white tracking-widest font-mono uppercase">Secure Escrow Processing</h3><div className="flex gap-1.5">{[0, 1, 2].map((i) => (<motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-2 h-2 rounded-full bg-[#FF7D00]"/>))}</div><p className="mt-4 text-zinc-400 font-black text-[10px] tracking-[0.4em] uppercase">안전한 에스크로 거래를 체결 중입니다</p></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
