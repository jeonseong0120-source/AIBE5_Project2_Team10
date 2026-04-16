'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { Briefcase, User, Settings, LogOut, X, ChevronRight, Activity, Globe, Phone, FileText, Landmark, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfile {
    name: string;
    email: string;
    role: string;
    nickname?: string;
    companyName?: string;
    representativeName?: string;
    bn?: string;
    homepageUrl?: string;
    introduction?: string;
    phoneNum?: string;
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

    // 편집 모드 상태
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingCompany, setIsEditingCompany] = useState(false);

    // 프로필 편집 폼
    const [profileForm, setProfileForm] = useState({ nickname: '', phoneNum: '' });
    const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

    // 기업 정보 편집 폼
    const [companyForm, setCompanyForm] = useState({
        representativeName: '', companyName: '', bn: '', homepageUrl: '', introduction: '', nickname: '', phoneNum: ''
    });
    const [isCompanySubmitting, setIsCompanySubmitting] = useState(false);
    const [isBnVerified, setIsBnVerified] = useState(false);

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
                    router.replace("/onboarding"); return;
                }
                if (userData.role === "FREELANCER" || userData.role === "ROLE_FREELANCER") {
                    alert("해당 마이페이지는 클라이언트 전용 화면입니다.");
                    router.replace("/"); return;
                }
                setUser(userData);
                setAuthorized(true);

                // 상세 프로필 로드
                try {
                    const { data } = await api.get('/client/profile');
                    setUser(prev => prev ? { ...prev, ...data } : data);
                    setProfileForm({ nickname: data.nickname || '', phoneNum: data.phoneNum || '' });
                    setCompanyForm(prev => ({ ...prev, ...data, nickname: data.nickname || '', phoneNum: data.phoneNum || '' }));
                    if (data.bn?.match(/^\d{3}-\d{2}-\d{5}$/)) setIsBnVerified(true);
                } catch (e) { console.error("프로필 로드 실패", e); }

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

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProfileSubmitting(true);
        try {
            await api.put('/client/profile', { ...companyForm, ...profileForm });
            alert("개인 프로필이 수정되었습니다.");
            setUser(prev => prev ? { ...prev, nickname: profileForm.nickname, phoneNum: profileForm.phoneNum } : null);
            setIsEditingProfile(false);
        } catch (err) { alert("수정 실패: 양식을 확인해주세요."); }
        finally { setIsProfileSubmitting(false); }
    };

    const handleBnCheck = () => {
        if (companyForm.bn.match(/^\d{3}-\d{2}-\d{5}$/)) {
            setIsBnVerified(true); alert("사업자 번호가 인증되었습니다.");
        } else {
            alert("사업자번호 형식을 확인해주세요. (000-00-00000)");
            setIsBnVerified(false);
        }
    };

    const handleCompanySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBnVerified) { alert("사업자 번호 인증이 필요합니다."); return; }
        setIsCompanySubmitting(true);
        try {
            await api.put('/client/profile', companyForm);
            alert("기업 정보가 성공적으로 수정되었습니다.");
            setUser(prev => prev ? { ...prev, ...companyForm } : null);
            setIsEditingCompany(false);
        } catch (err) { alert("수정 실패: 양식을 확인해주세요."); }
        finally { setIsCompanySubmitting(false); }
    };

    if (!authorized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-[#FF7D00] font-black text-xl animate-pulse font-mono uppercase tracking-widest">
                AUTHORIZING ACCESS...
            </div>
        );
    }

    const activeCount = Array.isArray(projects) ? projects.filter(p => p.status === '진행 중' || p.status === '모집 중').length : 0;
    const totalCount = Array.isArray(projects) ? projects.length : 0;

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 font-sans">

            {/* Nav */}
            <nav className="w-full py-5 px-10 bg-white/80 backdrop-blur-xl border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/client/dashboard")}>
                    <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                </div>
                <div className="flex gap-6 items-center">
                    <button onClick={() => router.push('/client/dashboard')} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 tracking-widest transition uppercase font-mono">
                        DASHBOARD
                    </button>
                    <div className="w-8 h-8 rounded-full bg-[#FF7D00] border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-white font-bold text-xs">
                        {user?.name?.charAt(0).toUpperCase() || 'C'}
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* ===== 왼쪽 사이드바 ===== */}
                <aside className="lg:col-span-1 space-y-4">

                    {/* 프로필 카드 */}
                    <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col items-center text-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#FF7D00] to-[#FFB066] shadow-lg flex items-center justify-center text-4xl text-white font-black font-mono">
                            {user?.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">{user?.nickname || user?.name || '사용자'}</h1>
                            <p className="text-xs text-zinc-400 font-mono mt-1">{user?.email}</p>
                            <span className="mt-2 inline-block px-3 py-1 text-[10px] font-black tracking-widest font-mono uppercase rounded-full border bg-orange-50 text-[#FF7D00] border-orange-100">
                                CLIENT_ACCOUNT
                            </span>
                        </div>

                        {/* 통계 요약 */}
                        <div className="w-full flex justify-around pt-3 border-t border-zinc-100 text-center">
                            <div>
                                <p className="font-black text-lg">{totalCount}</p>
                                <p className="text-[10px] text-zinc-400 font-mono">전체</p>
                            </div>
                            <div>
                                <p className="font-black text-lg text-[#FF7D00]">{activeCount}</p>
                                <p className="text-[10px] text-zinc-400 font-mono">진행중</p>
                            </div>
                            <div>
                                <p className="font-black text-lg">{totalCount - activeCount}</p>
                                <p className="text-[10px] text-zinc-400 font-mono">완료</p>
                            </div>
                        </div>
                    </div>

                    {/* 회사 정보 요약 */}
                    {!isEditingProfile && !isEditingCompany && (
                        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-3">
                            <p className="text-[10px] font-black font-mono uppercase text-zinc-400 tracking-widest">회사 정보</p>
                            {user?.companyName && (
                                <div className="flex items-center gap-2 text-sm text-zinc-600">
                                    <Landmark size={14} className="text-zinc-400 flex-shrink-0" />
                                    <span className="font-bold">{user.companyName}</span>
                                </div>
                            )}
                            {user?.representativeName && (
                                <div className="flex items-center gap-2 text-sm text-zinc-600">
                                    <User size={14} className="text-zinc-400 flex-shrink-0" />
                                    <span className="font-bold">{user.representativeName} 대표</span>
                                </div>
                            )}
                            {user?.phoneNum && (
                                <div className="flex items-center gap-2 text-sm text-zinc-600">
                                    <Phone size={14} className="text-zinc-400 flex-shrink-0" />
                                    <span className="font-bold">{user.phoneNum}</span>
                                </div>
                            )}
                            {user?.homepageUrl && (
                                <div className="flex items-center gap-2 text-sm text-zinc-600">
                                    <Globe size={14} className="text-zinc-400 flex-shrink-0" />
                                    <a href={user.homepageUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[#FF7D00] hover:underline truncate">{user.homepageUrl}</a>
                                </div>
                            )}
                            {user?.introduction && (
                                <p className="text-xs text-zinc-500 leading-relaxed pt-2 border-t border-zinc-100">{user.introduction}</p>
                            )}
                        </div>
                    )}

                    {/* 프로필 편집 폼 */}
                    {isEditingProfile && (
                        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-4">
                            <p className="text-[10px] font-black font-mono uppercase text-zinc-400 tracking-widest">개인 프로필 편집</p>
                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400 flex items-center gap-2">
                                        <User size={12} className="text-[#FF7D00]" /> 닉네임
                                    </label>
                                    <input type="text" required value={profileForm.nickname} onChange={e => setProfileForm({ ...profileForm, nickname: e.target.value })} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-200 outline-none focus:border-[#FF7D00] text-sm font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400 flex items-center gap-2">
                                        <Phone size={12} className="text-[#FF7D00]" /> 연락처
                                    </label>
                                    <input type="tel" required value={profileForm.phoneNum} onChange={e => setProfileForm({ ...profileForm, phoneNum: e.target.value })} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-200 outline-none focus:border-[#FF7D00] text-sm font-bold" />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="submit" disabled={isProfileSubmitting} className="flex-1 py-3 bg-[#FF7D00] hover:brightness-110 text-white rounded-xl text-sm font-black transition-all">
                                        {isProfileSubmitting ? '저장 중...' : '저장'}
                                    </button>
                                    <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-sm font-black">
                                        취소
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* 기업 정보 편집 폼 */}
                    {isEditingCompany && (
                        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-4">
                            <p className="text-[10px] font-black font-mono uppercase text-zinc-400 tracking-widest">기업 정보 편집</p>
                            <form onSubmit={handleCompanySubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">대표자 *</label>
                                        <input type="text" required value={companyForm.representativeName} onChange={e => setCompanyForm({ ...companyForm, representativeName: e.target.value })} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-200 outline-none focus:border-[#FF7D00] text-sm font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">회사명 *</label>
                                        <input type="text" required value={companyForm.companyName} onChange={e => setCompanyForm({ ...companyForm, companyName: e.target.value })} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-200 outline-none focus:border-[#FF7D00] text-sm font-bold" />
                                    </div>
                                </div>

                                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 space-y-2">
                                    <label className="text-[10px] font-black font-mono uppercase text-[#FF7D00] tracking-widest flex justify-between">
                                        <span className="flex items-center gap-1"><Landmark size={12} /> 사업자번호 *</span>
                                        {isBnVerified && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> VERIFIED</span>}
                                    </label>
                                    <div className="flex gap-2">
                                        <input type="text" required placeholder="000-00-00000" value={companyForm.bn} onChange={e => { setCompanyForm({ ...companyForm, bn: e.target.value }); setIsBnVerified(false); }} className={`flex-1 px-3 py-2.5 bg-white border ${isBnVerified ? 'border-green-300' : 'border-zinc-200'} rounded-xl text-sm font-mono font-bold focus:border-[#FF7D00] outline-none`} />
                                        <button type="button" onClick={handleBnCheck} className={`px-3 py-2.5 rounded-xl text-xs font-black transition-all ${isBnVerified ? 'bg-green-500 text-white' : 'bg-zinc-900 text-white hover:bg-[#FF7D00]'}`}>
                                            {isBnVerified ? '완료' : '인증'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400 flex items-center gap-1"><Globe size={12} className="text-[#FF7D00]" /> 홈페이지</label>
                                    <input type="url" placeholder="https://..." value={companyForm.homepageUrl} onChange={e => setCompanyForm({ ...companyForm, homepageUrl: e.target.value })} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-200 outline-none focus:border-[#FF7D00] text-sm font-bold" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400 flex items-center gap-1"><FileText size={12} className="text-[#FF7D00]" /> 회사 소개</label>
                                    <textarea rows={3} placeholder="회사 소개글을 입력하세요." value={companyForm.introduction} onChange={e => setCompanyForm({ ...companyForm, introduction: e.target.value })} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-200 outline-none focus:border-[#FF7D00] text-sm font-bold resize-none" />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button type="submit" disabled={isCompanySubmitting || !isBnVerified} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${isCompanySubmitting || !isBnVerified ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' : 'bg-[#FF7D00] text-white hover:brightness-110'}`}>
                                        {isCompanySubmitting ? '저장 중...' : !isBnVerified ? '번호인증 필요' : '저장'}
                                    </button>
                                    <button type="button" onClick={() => setIsEditingCompany(false)} className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-sm font-black">
                                        취소
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* 액션 버튼 */}
                    {!isEditingProfile && !isEditingCompany && (
                        <div className="bg-white rounded-2xl p-2 border border-zinc-200 shadow-sm">
                            <button onClick={() => setIsEditingProfile(true)} className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 rounded-xl transition group">
                                <div className="flex items-center gap-3 font-bold text-sm text-zinc-700 group-hover:text-[#FF7D00]">
                                    <User size={16} className="text-zinc-400 group-hover:text-[#FF7D00]" />
                                    프로필 편집
                                </div>
                                <ChevronRight size={14} className="text-zinc-300 group-hover:text-[#FF7D00]" />
                            </button>
                            <button onClick={() => setIsEditingCompany(true)} className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 rounded-xl transition group">
                                <div className="flex items-center gap-3 font-bold text-sm text-zinc-700 group-hover:text-[#FF7D00]">
                                    <Settings size={16} className="text-zinc-400 group-hover:text-[#FF7D00]" />
                                    기업 정보 수정
                                </div>
                                <ChevronRight size={14} className="text-zinc-300 group-hover:text-[#FF7D00]" />
                            </button>
                            <hr className="my-1 border-zinc-100" />
                            <button
                                className="w-full flex items-center gap-3 p-4 hover:bg-red-50 rounded-xl transition text-sm font-bold text-red-500"
                                onClick={() => { localStorage.removeItem('accessToken'); router.push('/login'); }}
                            >
                                <LogOut size={16} className="text-red-400" />
                                로그아웃
                            </button>
                        </div>
                    )}
                </aside>

                {/* ===== 오른쪽 메인 컨텐츠 ===== */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 헤더 */}
                    <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black tracking-tight">
                                My_Projects <span className="text-[#FF7D00] ml-1">[{totalCount}]</span>
                            </h2>
                            <p className="text-[10px] text-zinc-400 font-mono uppercase mt-1">MANAGE_YOUR_MISSIONS</p>
                        </div>
                        <div className="flex gap-3 text-center">
                            <div className="px-4 py-2 bg-orange-50 rounded-xl">
                                <p className="font-black text-[#FF7D00]">{activeCount}</p>
                                <p className="text-[10px] text-zinc-500 font-mono">진행중</p>
                            </div>
                            <div className="px-4 py-2 bg-zinc-50 rounded-xl">
                                <p className="font-black text-zinc-700">{totalCount - activeCount}</p>
                                <p className="text-[10px] text-zinc-500 font-mono">완료</p>
                            </div>
                        </div>
                    </div>

                    {/* 프로젝트 목록 */}
                    <div>
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
                                        transition={{ delay: idx * 0.08 }}
                                        key={project.projectId || idx}
                                        className="group bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 transition-all hover:border-[#FF7D00] hover:shadow-lg hover:shadow-orange-100/50"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className={`inline-block px-3 py-1 text-[10px] font-black tracking-widest rounded-lg mb-3 font-mono uppercase ${
                                                    project.status === "모집 중" ? "bg-[#FF7D00]/10 text-[#FF7D00]" :
                                                    project.status === "진행 중" ? "bg-orange-50 text-[#FF7D00]" :
                                                    "bg-zinc-100 text-zinc-500"
                                                }`}>
                                                    {project.status || '상태 없음'}
                                                </span>
                                                <h3 className="text-lg font-bold group-hover:text-[#FF7D00] transition-colors">
                                                    {project.projectName || '프로젝트 이름이 없습니다.'}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-50">
                                            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 font-bold">
                                                <Briefcase size={13} />
                                                <span>DEADLINE: {project.deadline || '미정'}</span>
                                            </div>
                                            <button className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-black uppercase tracking-widest font-mono hover:bg-zinc-200 transition-all">
                                                DETAILS
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-zinc-200">
                                <Briefcase className="w-10 h-10 text-zinc-200 mx-auto mb-4" />
                                <h3 className="text-zinc-400 font-bold text-base italic uppercase font-mono tracking-tighter">Null: No_Projects_Found</h3>
                                <p className="text-zinc-400 text-xs font-mono mt-2">등록된 프로젝트가 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}