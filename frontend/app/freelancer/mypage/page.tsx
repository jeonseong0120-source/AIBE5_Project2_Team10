'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Code2, Briefcase, Star, Award, Settings, Save, MapPin, Activity, Plus, X, Clock, Image as ImageIcon, Upload, Loader2, Send, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { NotificationBell } from '@/components/notifications/NotificationProvider';
import PortfolioDetailModal from '@/components/portfolio/PortfolioDetailModal';

const TABS = [
    { id: 'profile', label: 'MY PROFILE', icon: UserIcon },
    { id: 'portfolio', label: 'PORTFOLIO', icon: Briefcase },
    { id: 'reviews', label: 'REVIEWS', icon: Star },
    { id: 'grade', label: 'RANK', icon: Award },
];

const LOCATION_COORDS: Record<string, { lat: number, lng: number }> = {
    '서울': { lat: 37.5665, lng: 126.9780 },
    '경기': { lat: 37.4138, lng: 127.5183 },
    '인천': { lat: 37.4563, lng: 126.7052 },
    '부산': { lat: 35.1796, lng: 129.0756 },
    '대구': { lat: 35.8714, lng: 128.6014 },
    '원격': { lat: 0, lng: 0 },
    '': { lat: 37.5665, lng: 126.9780 }
};

export default function FreelancerMyPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('portfolio');
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    const [profile, setProfile] = useState<any>(null);
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [userId, setUserId] = useState<number | null>(null);
    const [allGlobalSkills, setAllGlobalSkills] = useState<any[]>([]);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editProfileData, setEditProfileData] = useState<any>({});
    const [mySkillIds, setMySkillIds] = useState<number[]>([]);
    const [skillSearchQuery, setSkillSearchQuery] = useState('');
    const [validationError, setValidationError] = useState('');

    const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
    const [portfolioSkillSearchQuery, setPortfolioSkillSearchQuery] = useState('');
    const [portfolioForm, setPortfolioForm] = useState<{ id?: number | null, title: string, desc: string, thumbnailUrl: string, portfolioImages: string[], skills: number[] }>({ title: '', desc: '', thumbnailUrl: '', portfolioImages: [], skills: [] });
    const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);

    // 업로드 로딩 상태 관리
    const [isProfileUploading, setIsProfileUploading] = useState(false);
    const [isThumbUploading, setIsThumbUploading] = useState(false);
    const [isBulkUploading, setIsBulkUploading] = useState(false);

    // 숨김 파일 입력용 ref
    const profileFileInputRef = useRef<HTMLInputElement>(null);
    const thumbFileInputRef = useRef<HTMLInputElement>(null);
    const bulkFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("로그인이 필요합니다.");
                router.replace("/login");
                return;
            }

            try {
                const userRes = await api.get("/v1/users/me");
                const role = userRes.data.role;
                if (role === "GUEST" || role === "ROLE_GUEST") {
                    router.replace("/onboarding");
                    return;
                }
                if (role === "CLIENT" || role === "ROLE_CLIENT") {
                    alert("프리랜서 전용 화면입니다.");
                    router.replace("/dashboard");
                    return;
                }

                setUserId(userRes.data.user_id || userRes.data.id);
                setAuthorized(true);

                await Promise.all([fetchProfile(), fetchGlobalSkills()]);
            } catch (err) {
                console.error("접근 권한 확인 실패", err);
                router.replace("/login");
            }
        };
        init();
    }, [router]);

    useEffect(() => {
        if (!authorized) return;
        if (activeTab === 'portfolio' && portfolios.length === 0) fetchPortfolios();
        if (activeTab === 'reviews' && reviews.length === 0 && userId) fetchReviews(userId);
    }, [activeTab, authorized, userId]);

    const fetchGlobalSkills = async () => {
        try {
            const { data } = await api.get('/v1/skills');
            setAllGlobalSkills(data || []);
        } catch (e) { console.error("스킬 목록 조회 실패", e); }
    }

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/v1/freelancers/me');
            if (data) {
                setProfile(data);
                setEditProfileData({
                    profileImageUrl: data.profileImageUrl || '',
                    introduction: data.introduction || '',
                    location: data.location || '',
                    latitude: data.latitude || 37.5665,
                    longitude: data.longitude || 126.9780,
                    hourlyRate: data.hourlyRate || 0,
                    workStyle: data.workStyle || 'ONLINE',
                    isActive: data.isActive !== false,
                    skills: data.skills || []
                });
                setMySkillIds((data.skills || []).map((s: any) => s.skillId || s.id));
            }
        } catch (error) {
            console.error("프로필 로드 실패", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPortfolios = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/portfolios/me');
            setPortfolios(data || []);
        } catch (error) {
            console.error("포트폴리오 로드 실패", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async (id: number) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reviews/freelancers/${id}`);
            setReviews(data || []);
        } catch (error) {
            console.error("리뷰 로드 실패", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileAndSkillUpdate = async () => {
        setValidationError('');

        if (mySkillIds.length === 0) {
            setValidationError('최소 1개 이상의 스킬을 선택해야 합니다.');
            return;
        }

        const hRate = Number(editProfileData.hourlyRate?.toString().replace(/,/g, ''));
        if (isNaN(hRate) || hRate < 0) {
            setValidationError('시급은 0 이상이어야 합니다.');
            return;
        }

        const locationKey = editProfileData.location || '서울';
        const coords = LOCATION_COORDS[locationKey] || LOCATION_COORDS['서울'];

        try {
            const requestBody = {
                profileImageUrl: editProfileData.profileImageUrl || null,
                introduction: editProfileData.introduction || '',
                location: locationKey,
                latitude: coords.lat,
                longitude: coords.lng,
                hourlyRate: hRate,
                workStyle: editProfileData.workStyle || 'ONLINE',
                isActive: editProfileData.isActive !== false,
                skillIds: mySkillIds
            };

            await api.put('/v1/freelancers/me', requestBody);
            alert('정보가 업데이트 되었습니다.');
            setIsEditingProfile(false);
            fetchProfile();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || '모든 필수값을 확인해주세요.';
            setValidationError(errorMsg);
            console.error(error);
        }
    };

    const handleToggleStatus = async () => {
        try {
            const newStatus = !profile.isActive;
            await api.patch('/v1/freelancers/status', { isActive: newStatus });
            setProfile({ ...profile, isActive: newStatus });
            setEditProfileData({ ...editProfileData, isActive: newStatus });
            alert(newStatus ? '활동중으로 변경되었습니다.' : '휴식중으로 변경되었습니다.');
        } catch (error) {
            alert('상태 변경 실패');
        }
    }

    const toggleSkill = (skillId: number) => {
        if (mySkillIds.includes(skillId)) {
            setMySkillIds(mySkillIds.filter(id => id !== skillId));
        } else {
            setMySkillIds([...mySkillIds, skillId]);
        }
    };

    // =====================================
    // 💡 이미지 업로드 로직 (Cloudinary API 연동)
    // =====================================

    // 1. 프로필 이미지 업로드
    const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProfileUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/images/profile', formData);
            // DB에 즉시 반영되므로 프론트 상태만 갱신
            const newImageUrl = data.imageUrl;
            setProfile({ ...profile, profileImageUrl: newImageUrl });
            setEditProfileData({ ...editProfileData, profileImageUrl: newImageUrl });
            alert('프로필 이미지가 변경되었습니다.');
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류';
            alert('프로필 업로드 실패: ' + errorMsg);
            console.error(error);
        } finally {
            setIsProfileUploading(false);
        }
    };

    // 2. 포트폴리오 썸네일 단일 업로드
    const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsThumbUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/images/portfolio', formData);
            setPortfolioForm({ ...portfolioForm, thumbnailUrl: data.imageUrl });
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류';
            alert('썸네일 업로드 실패: ' + errorMsg);
            console.error(error);
        } finally {
            setIsThumbUploading(false);
        }
    };

    // 3. 포트폴리오 다중 이미지 업로드
    const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = 10 - portfolioForm.portfolioImages.length;
        if (remainingSlots <= 0) {
            alert("이미지는 최대 10장까지 등록할 수 있습니다.");
            return;
        }
        if (files.length > remainingSlots) {
            alert(`최대 ${remainingSlots}장만 더 업로드할 수 있습니다.`);
            return;
        }

        setIsBulkUploading(true);
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append('files', file));

        try {
            const { data } = await api.post('/images/portfolios/bulk', formData);
            // 기존 이미지 + 새로 업로드된 이미지
            setPortfolioForm({
                ...portfolioForm,
                portfolioImages: [...portfolioForm.portfolioImages, ...data.imageUrls].slice(0, 10)
            });
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류';
            alert('다중 이미지 업로드 실패: ' + errorMsg);
            console.error(error);
        } finally {
            setIsBulkUploading(false);
        }
    };

    const removePortfolioImage = (indexToRemove: number) => {
        setPortfolioForm(prev => ({
            ...prev,
            portfolioImages: prev.portfolioImages.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    const togglePortfolioSkill = (skillId: number) => {
        setPortfolioForm(prev => ({
            ...prev,
            skills: prev.skills.includes(skillId) ? prev.skills.filter(id => id !== skillId) : [...prev.skills, skillId]
        }));
    };

    const EMPTY_PORTFOLIO_FORM = { id: null as number | null | undefined, title: '', desc: '', thumbnailUrl: '', portfolioImages: [] as string[], skills: [] as number[] };

    const handleSavePortfolio = async () => {
        if (!portfolioForm.title || !portfolioForm.desc) {
            alert("제목과 내용을 입력해주세요.");
            return;
        }
        if (portfolioForm.skills.length === 0) {
            alert("사용 기술을 1개 이상 선택해주세요.");
            return;
        }

        try {
            const requestBody = {
                title: portfolioForm.title,
                desc: portfolioForm.desc,
                thumbnailUrl: portfolioForm.thumbnailUrl || null,
                portfolioImages: portfolioForm.portfolioImages.length > 0 ? portfolioForm.portfolioImages : ["https://placehold.co/600x400?text=No+Image"],
                skills: portfolioForm.skills
            };
            
            if (portfolioForm.id) {
                await api.put(`/portfolios/${portfolioForm.id}`, requestBody);
                alert('포트폴리오가 수정되었습니다.');
            } else {
                await api.post('/portfolios', requestBody);
                alert('포트폴리오가 등록되었습니다.');
            }
            
            setIsPortfolioModalOpen(false);
            fetchPortfolios();
            setPortfolioForm(EMPTY_PORTFOLIO_FORM);
            setPortfolioSkillSearchQuery('');
        } catch (e) {
            alert('상세 정보를 확인해주세요.');
            console.error(e);
        }
    };

    const handleDeletePortfolio = async (id: number) => {
        if (!confirm("이 포트폴리오를 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/portfolios/${id}`);
            alert("포트폴리오가 삭제되었습니다.");
            setSelectedPortfolio(null);
            fetchPortfolios();
        } catch (err) {
            alert("포트폴리오 삭제에 실패했습니다.");
            console.error(err);
        }
    };

    if (!authorized) return <div className="min-h-screen bg-white flex items-center justify-center text-[#7A4FFF] font-black tracking-widest animate-pulse font-mono uppercase">System_Authorizing...</div>;
    if (!profile && !isEditingProfile) return null;

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 font-sans">
            {/* Nav */}
            <nav className="w-full py-5 px-10 bg-white/80 backdrop-blur-xl border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/freelancer/explore")}>
                    <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
                </div>
                <div className="flex gap-4 items-center md:gap-6">
                    <button onClick={() => router.push('/freelancer/dashboard')} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 tracking-widest transition uppercase font-mono">
                        DASHBOARD
                    </button>
                    <button onClick={() => router.push('/freelancer/explore')} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 tracking-widest transition uppercase font-mono">
                        EXPLORE
                    </button>
                    <button onClick={() => router.push('/freelancer/mypage')} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 tracking-widest transition uppercase font-mono">
                        MY_PROFILE
                    </button>
                    <NotificationBell />
                    <div className="w-8 h-8 rounded-full bg-[#7A4FFF] border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-white font-bold text-xs">
                        {profile?.userName ? profile.userName.charAt(0) : 'U'}
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">

                {/* ===== 왼쪽 사이드바 ===== */}
                <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">

                    {/* 프로필 이미지 + 이름 + 상태 */}
                    <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col items-center text-center gap-4">
                        {/* 프로필 이미지 */}
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl relative bg-zinc-100 flex-shrink-0 group overflow-hidden">
                            {isProfileUploading ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-200 animate-pulse">
                                    <Loader2 className="animate-spin mb-1" size={20} />
                                    <span className="text-[9px] font-mono font-black">UPLOADING</span>
                                </div>
                            ) : profile?.profileImageUrl ? (
                                <img src={profile.profileImageUrl} alt="profile" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <div className="w-full h-full bg-zinc-200 rounded-full flex items-center justify-center text-zinc-400">
                                    <UserIcon size={32} />
                                </div>
                            )}
                            {isEditingProfile && !isProfileUploading && (
                                <button
                                    type="button"
                                    aria-label="프로필 이미지 변경"
                                    className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                                    onClick={() => profileFileInputRef.current?.click()}
                                >
                                    <Upload size={20} className="mb-1" />
                                    <span className="text-[9px] font-mono font-bold">CHANGE</span>
                                </button>
                            )}
                            <input type="file" ref={profileFileInputRef} className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                        </div>

                        <div>
                            <h1 className="text-xl font-black tracking-tight">{profile?.userName || 'Unknown'}</h1>
                            <span className={`mt-1 inline-block px-3 py-1 text-[10px] font-black tracking-widest font-mono uppercase rounded-full border ${profile?.isActive ? 'bg-[#7A4FFF]/10 text-[#7A4FFF] border-[#7A4FFF]/20' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                {profile?.isActive ? '활동중 (ACTIVE)' : '휴식중 (REST)'}
                            </span>
                        </div>

                        {/* 한 줄 요약 통계 */}
                        <div className="w-full flex justify-around pt-3 border-t border-zinc-100 text-center">
                            <div>
                                <p className="font-black text-lg">{profile?.averageRating?.toFixed(1) || '0.0'}</p>
                                <p className="text-[10px] text-zinc-400 font-mono">평점</p>
                            </div>
                            <div>
                                <p className="font-black text-lg">{profile?.completedProjects || 0}</p>
                                <p className="text-[10px] text-zinc-400 font-mono">완료</p>
                            </div>
                            <div>
                                <p className="font-black text-lg">{profile?.reviewCount || 0}</p>
                                <p className="text-[10px] text-zinc-400 font-mono">리뷰</p>
                            </div>
                        </div>
                    </div>

                    {/* 글로벌 액션 버튼 */}
                    <div className="bg-white rounded-2xl p-2 border border-zinc-200 shadow-sm mt-4">
                        <button onClick={handleToggleStatus} className={`w-full flex items-center gap-3 p-4 hover:bg-zinc-50 rounded-xl transition text-sm font-bold ${profile?.isActive ? 'text-red-500' : 'text-[#7A4FFF]'}`}>
                            <Activity size={16} />
                            {profile?.isActive ? '휴식중으로 전환' : '활동중으로 전환'}
                        </button>
                        <hr className="my-1 border-zinc-100" />
                        <button onClick={() => { localStorage.removeItem('accessToken'); router.push('/login'); }} className="w-full flex items-center gap-3 p-4 hover:bg-red-50 rounded-xl transition text-sm font-bold text-red-500">
                            <X size={16} />
                            로그아웃
                        </button>
                    </div>

                    {/* 왼쪽 사이드바 탭 메뉴 */}
                    <div className="bg-white rounded-2xl p-3 border border-zinc-200 shadow-sm mt-6">
                        <div className="flex flex-col gap-1">
                            {TABS.map(tab => (
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
                </aside>

                {/* ===== 오른쪽 메인 컨텐츠 ===== */}
                <div className="space-y-6 min-w-0">

                    {/* 상단 통계 (기존 탭 자리 대체) */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm mb-6">
                        <div className="flex flex-col md:flex-row justify-between w-full h-full gap-6 md:gap-0 md:divide-x divide-zinc-100">
                            {/* 지원 현황 */}
                            <div className="flex-1 flex items-center gap-5 md:justify-center">
                                <div className="w-14 h-14 rounded-full bg-[#ff5a5f] text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Send size={24} className="-ml-1" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[13px] font-bold text-zinc-500 mb-1">지원 현황</span>
                                    <span className="text-2xl font-black text-zinc-900 leading-none font-mono">0</span>
                                </div>
                            </div>
                            
                            {/* 받은 제안 */}
                            <div className="flex-1 flex items-center gap-5 md:justify-center">
                                <div className="w-14 h-14 rounded-full bg-[#00b4ff] text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Inbox size={24} />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[13px] font-bold text-zinc-500 mb-1">받은 제안</span>
                                    <span className="text-2xl font-black text-zinc-900 leading-none font-mono">0</span>
                                </div>
                            </div>
                            
                            {/* 스크랩 */}
                            <div className="flex-1 flex items-center gap-5 md:justify-center">
                                <div className="w-14 h-14 rounded-full bg-[#ffa900] text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Star size={24} className="fill-current" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[13px] font-bold text-zinc-500 mb-1">스크랩 (관심 공고)</span>
                                    <span className="text-2xl font-black text-zinc-900 leading-none font-mono">0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 탭 본문 */}
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200 shadow-sm min-h-[500px]"
                    >
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                <div className="w-8 h-8 border-4 border-[#7A4FFF]/20 border-t-[#7A4FFF] rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* [TAB 0] PROFILE */}
                                {activeTab === 'profile' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <h2 className="text-xl font-black tracking-tighter">마이 프로필</h2>
                                                <p className="text-[10px] text-zinc-400 font-mono uppercase mt-1">MANAGE_YOUR_PROFILE</p>
                                            </div>
                                            {!isEditingProfile && (
                                                <button onClick={() => setIsEditingProfile(true)} className="h-10 px-5 bg-zinc-900 hover:bg-black text-white shadow-md rounded-xl text-[10px] font-black transition-colors font-mono tracking-widest uppercase flex items-center gap-2">
                                                    <Settings size={14} /> 편집 켜기
                                                </button>
                                            )}
                                        </div>

                                        {!isEditingProfile ? (
                                            <div className="space-y-8">
                                                <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-4">
                                                    <p className="text-[10px] font-black font-mono uppercase text-[#7A4FFF] tracking-widest mb-2 border-b border-zinc-200 pb-2">기본 정보</p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="flex items-center gap-3 text-sm text-zinc-600">
                                                            <MapPin size={16} className="text-zinc-400 shrink-0" />
                                                            <span className="font-bold">{profile?.location || '지역 미설정'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-zinc-600">
                                                            <Clock size={16} className="text-zinc-400 shrink-0" />
                                                            <span className="font-bold">{profile?.hourlyRate ? `${profile.hourlyRate.toLocaleString()}원/시` : '시급 미설정'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-zinc-600">
                                                            <Activity size={16} className="text-zinc-400 shrink-0" />
                                                            <span className="font-bold">{profile?.workStyle || '방식 미설정'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-4">
                                                    <p className="text-[10px] font-black font-mono uppercase text-[#7A4FFF] tracking-widest mb-2 border-b border-zinc-200 pb-2">소개글</p>
                                                    <p className="text-sm text-zinc-600 leading-relaxed max-w-2xl">{profile?.introduction || '작성된 소개글이 없습니다.'}</p>
                                                </div>

                                                <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-4">
                                                    <p className="text-[10px] font-black font-mono uppercase text-[#7A4FFF] tracking-widest mb-2 border-b border-zinc-200 pb-2">보유 기술</p>
                                                    {(profile?.skills || []).length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {(profile.skills).map((s: any, idx: number) => {
                                                                const sId = s.skillId || s.id;
                                                                return (
                                                                    <span key={`skill-${sId || idx}-${idx}`} className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 shadow-sm rounded-full text-xs font-bold hover:border-[#7A4FFF]/30 hover:bg-[#7A4FFF]/5 transition-colors">
                                                                        #{s.name}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-zinc-500">등록된 기술 스택이 없습니다.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="bg-zinc-50 rounded-2xl p-6 md:p-8 border border-zinc-200 shadow-inner space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">활동 지역</label>
                                                            <select value={editProfileData.location} onChange={e => setEditProfileData({ ...editProfileData, location: e.target.value })} className="w-full bg-white p-4 rounded-xl border border-zinc-200 outline-none focus:border-[#7A4FFF] hover:border-[#7A4FFF]/50 text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-[#7A4FFF]/10">
                                                                <option value="">선택 안함</option>
                                                                <option value="서울">서울</option><option value="경기">경기</option><option value="인천">인천</option>
                                                                <option value="부산">부산</option><option value="대구">대구</option><option value="원격">원격 (Remote)</option>
                                                            </select>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">희망 시급 (원)</label>
                                                            <input
                                                                type="text"
                                                                value={editProfileData.hourlyRate === '' ? '' : Number(editProfileData.hourlyRate).toLocaleString()}
                                                                onChange={e => {
                                                                    const rawValue = e.target.value.replace(/[^\d]/g, '');
                                                                    setEditProfileData({ ...editProfileData, hourlyRate: rawValue ? parseInt(rawValue, 10) : '' });
                                                                }}
                                                                className="w-full bg-white p-4 rounded-xl border border-zinc-200 outline-none focus:border-[#7A4FFF] hover:border-[#7A4FFF]/50 text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-[#7A4FFF]/10"
                                                                placeholder="예: 50,000"
                                                            />
                                                        </div>

                                                        <div className="space-y-2 md:col-span-2">
                                                            <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">작업 방식</label>
                                                            <select value={editProfileData.workStyle} onChange={e => setEditProfileData({ ...editProfileData, workStyle: e.target.value })} className="w-full bg-white p-4 rounded-xl border border-zinc-200 outline-none focus:border-[#7A4FFF] hover:border-[#7A4FFF]/50 text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-[#7A4FFF]/10">
                                                                <option value="ONLINE">온라인 (ONLINE)</option>
                                                                <option value="OFFLINE">오프라인 (OFFLINE)</option>
                                                                <option value="HYBRID">하이브리드 (HYBRID)</option>
                                                            </select>
                                                        </div>

                                                        <div className="space-y-2 md:col-span-2">
                                                            <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">소개글</label>
                                                            <textarea rows={4} value={editProfileData.introduction} onChange={e => setEditProfileData({ ...editProfileData, introduction: e.target.value })} className="w-full bg-white p-4 rounded-xl border border-zinc-200 outline-none focus:border-[#7A4FFF] hover:border-[#7A4FFF]/50 text-sm font-bold shadow-sm transition-all resize-none focus:ring-4 focus:ring-[#7A4FFF]/10" placeholder="자신의 강점을 어필해주세요." />
                                                        </div>

                                                        {/* 스킬 편집 */}
                                                        <div className="space-y-3 md:col-span-2 border-t border-zinc-100 pt-6">
                                                            <p className="text-[10px] font-black font-mono uppercase text-[#7A4FFF] tracking-widest mb-2">보유 기술 편집</p>
                                                            
                                                            <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-white rounded-xl border border-zinc-200">
                                                                {mySkillIds.length === 0 ? (
                                                                    <span className="text-zinc-400 font-mono text-xs my-auto">선택된 스킬이 없습니다.</span>
                                                                ) : (
                                                                    mySkillIds.map((skillId, idx) => {
                                                                        const skillObj = allGlobalSkills.find(s => (s.skillId || s.id) === skillId);
                                                                        return (
                                                                            <span key={`my-skill-${skillId || idx}-${idx}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#7A4FFF]/10 border border-[#7A4FFF]/20 text-[#7A4FFF]">
                                                                                #{skillObj ? skillObj.name : skillId}
                                                                                <button onClick={() => toggleSkill(skillId)} className="text-[#7A4FFF]/60 hover:text-red-500 transition-colors ml-1"><X size={12} /></button>
                                                                            </span>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>

                                                            <div className="relative mt-2">
                                                                <input className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-200 outline-none text-sm font-bold focus:border-[#FF7D00] shadow-sm transition-all focus:ring-4 focus:ring-[#FF7D00]/10" placeholder="스킬 검색하여 추가하기..." value={skillSearchQuery} onChange={e => setSkillSearchQuery(e.target.value)} />
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto no-scrollbar p-2 bg-white rounded-xl border border-zinc-100 shadow-inner">
                                                                {allGlobalSkills
                                                                    .filter(s => s.name.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                                                                    .map((skill, idx) => {
                                                                        const sId = skill.skillId || skill.id;
                                                                        const isSelected = mySkillIds.includes(sId);
                                                                        return (
                                                                            <button key={`global-skill-${sId || idx}-${idx}`} onClick={() => toggleSkill(sId)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${isSelected ? 'bg-[#FF7D00]/10 border-[#FF7D00]/30 text-[#FF7D00]' : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-[#7A4FFF] hover:text-[#7A4FFF]'}`}>
                                                                                {isSelected ? '✓ ' : '+ '}{skill.name}
                                                                            </button>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <button onClick={() => { setIsEditingProfile(false); setMySkillIds((profile?.skills || []).map((s: any) => s.skillId || s.id)); setValidationError(''); }} className="flex-[1] py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl text-sm font-black transition-colors">
                                                        취소
                                                    </button>
                                                    <button onClick={handleProfileAndSkillUpdate} className="flex-[2] py-4 bg-[#7A4FFF] hover:bg-purple-600 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                                        <Save size={18} /> 수정 완료
                                                    </button>
                                                </div>
                                                {validationError && (
                                                    <div className="text-sm text-red-500 font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100">
                                                        🚨 {validationError}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* [TAB 1] Portfolio */}
                                {activeTab === 'portfolio' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-xl font-black tracking-tighter">포트폴리오</h2>
                                                <p className="text-[10px] text-zinc-400 font-mono uppercase mt-1">SHOWCASE_YOUR_MISSIONS</p>
                                            </div>
                                            <button onClick={() => { setPortfolioForm({ id: null, title: '', desc: '', thumbnailUrl: '', portfolioImages: [], skills: [] }); setPortfolioSkillSearchQuery(''); setIsPortfolioModalOpen(true); }} className="h-10 px-5 bg-[#7A4FFF] hover:bg-purple-600 shadow-md text-white rounded-xl text-[10px] font-black transition-colors font-mono tracking-widest uppercase flex items-center gap-2">
                                                <Plus size={14} /> 새 작업물 등록
                                            </button>
                                        </div>

                                        {portfolios.length === 0 ? (
                                            <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                                                <ImageIcon className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
                                                <h3 className="text-zinc-500 font-black text-sm mb-2">등록된 포트폴리오(작업물)가 없습니다.</h3>
                                                <p className="text-zinc-400 text-xs font-mono">강점을 어필할 프로젝트 결과물을 등록하세요.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {portfolios.map(p => (
                                                    <div key={p.id} onClick={() => { setSelectedPortfolio(p); }} className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white group cursor-pointer hover:border-[#FF7D00] hover:shadow-xl transition-all flex flex-col">
                                                        <div className="w-full aspect-[4/3] bg-zinc-100 overflow-hidden relative border-b border-zinc-100">
                                                            <img
                                                                src={p.thumbnailUrl || p.portfolioImages?.[0] || "https://placehold.co/400x300?text=No+Image"}
                                                                alt="thumb"
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                onError={(e) => { e.currentTarget.src = "https://placehold.co/400x300?text=No+Image" }}
                                                            />
                                                        </div>
                                                        <div className="p-4 flex flex-col flex-1 bg-white">
                                                            <h3 className="font-black text-sm mb-1 leading-tight text-zinc-900 group-hover:text-[#FF7D00] transition-colors line-clamp-1">{p.title}</h3>
                                                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-2 flex-1">{p.desc}</p>
                                                            {p.skills && p.skills.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 pt-2 border-t border-zinc-100">
                                                                    {p.skills.slice(0, 2).map((s: any, idx: number) => {
                                                                        const sId = s.skillId || s.id;
                                                                        return (
                                                                            <span key={`p-skill-${sId || idx}-${idx}`} className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-bold">#{s.name}</span>
                                                                        );
                                                                    })}
                                                                    {p.skills.length > 2 && <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-bold">+{p.skills.length - 2}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* [TAB 2] Reviews */}
                                {activeTab === 'reviews' && (
                                    <div className="space-y-8">
                                        <div className="bg-zinc-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
                                            <div className="absolute right-0 top-0 opacity-10"><Star size={200} /></div>
                                            <h3 className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 mb-2">Total_Performance_Score</h3>
                                            <div className="flex items-end gap-4 mb-2">
                                                <span className="text-5xl font-black">{profile?.averageRating?.toFixed(1) || '0.0'}</span>
                                                <div className="flex pb-2 text-[#FF7D00]">
                                                    {[...Array(5)].map((_, idx) => (
                                                        <Star key={idx} size={20} fill={idx < Math.floor(profile?.averageRating || 0) ? "currentColor" : "none"} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase">Based on <strong className="text-white">{profile?.reviewCount || 0}</strong> completed missions</p>
                                            <div className="flex gap-6 mt-8 pt-6 border-t border-zinc-800">
                                                <div className="flex-1"><p className="text-[10px] text-zinc-500 font-bold mb-1">작업 품질</p>
                                                    <div className="h-1.5 bg-zinc-800 rounded-full"><div className="h-full bg-[#7A4FFF] rounded-full" style={{ width: `${(profile?.averageRating || 0) / 5 * 100}%` }}></div></div>
                                                </div>
                                                <div className="flex-1"><p className="text-[10px] text-zinc-500 font-bold mb-1">일정 준수</p>
                                                    <div className="h-1.5 bg-zinc-800 rounded-full"><div className="h-full bg-[#FF7D00] rounded-full" style={{ width: `${Math.min(100, ((profile?.averageRating || 0) / 5) * 110)}%` }}></div></div>
                                                </div>
                                                <div className="flex-1"><p className="text-[10px] text-zinc-500 font-bold mb-1">의사 소통</p>
                                                    <div className="h-1.5 bg-zinc-800 rounded-full"><div className="h-full bg-[#34d399] rounded-full" style={{ width: `${Math.max(10, ((profile?.averageRating || 0) / 5) * 90)}%` }}></div></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-black text-sm text-zinc-900 mb-4 flex items-center gap-2">최근 리뷰 <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full text-[10px]">{reviews.length}</span></h3>
                                            {reviews.length === 0 ? (
                                                <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                                                    <p className="text-zinc-400 text-xs font-mono font-bold tracking-widest uppercase">No_Feedback_Yet</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {reviews.map((r, i) => (
                                                        <div key={r.id || i} className="p-6 border border-zinc-100 bg-zinc-50 rounded-2xl hover:bg-white hover:border-zinc-200 transition-colors shadow-sm">
                                                            <div className="flex items-center gap-1 text-[#FF7D00] mb-3">
                                                                {[...Array(5)].map((_, idx) => (
                                                                    <Star key={idx} size={14} fill={idx < Math.floor(r.averageScore) ? "currentColor" : "none"} strokeWidth={1.5} />
                                                                ))}
                                                                <span className="font-black text-sm text-zinc-900 ml-2">{r.averageScore}</span>
                                                            </div>
                                                            <p className="text-sm text-zinc-600 leading-relaxed font-medium">{r.comment}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* [TAB 3] Grade */}
                                {activeTab === 'grade' && (
                                    <div className="py-10 space-y-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-zinc-900 to-zinc-700 flex items-center justify-center text-[#FF7D00] shadow-2xl relative mb-6">
                                                <Award size={44} className="relative z-10" />
                                                <div className="absolute inset-0 border-[3px] border-[#FF7D00]/20 rounded-full animate-ping" />
                                            </div>
                                            <p className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase mb-2">등급 정보 / SECURITY_CLEARANCE</p>
                                            <h2 className="text-3xl font-black text-zinc-900 tracking-tighter mb-4">
                                                {profile?.gradeName || 'CLASS-D (일반)'}
                                            </h2>
                                            <p className="text-xs text-zinc-500 max-w-sm mx-auto font-medium">최고의 퍼포먼스를 보여주고 다음 등급으로 인증하여 클래스를 업그레이드 하세요.</p>
                                        </div>
                                        <div className="w-full bg-zinc-50 p-8 rounded-2xl border border-zinc-100">
                                            <div className="flex justify-between items-center mb-6 border-b border-zinc-200 pb-4">
                                                <h3 className="text-xs font-black font-mono tracking-widest uppercase text-zinc-900 flex items-center gap-2">
                                                    <Activity size={14} className="text-[#7A4FFF]" /> NEXT_LEVEL_REQUIREMENTS
                                                </h3>
                                                <span className="text-[10px] font-bold text-[#FF7D00] bg-[#FF7D00]/10 px-2 py-1 rounded">목표: 일반 → 인증프리랜서</span>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-xs font-bold text-zinc-500">완료한 프로젝트 (3건 이상)</span>
                                                        <span className="font-black text-sm text-zinc-900">{profile?.completedProjects || 0} / 3</span>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#7A4FFF]" style={{ width: `${Math.min(100, ((profile?.completedProjects || 0) / 3) * 100)}%` }} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-xs font-bold text-zinc-500">평균 평점 (4.0 이상)</span>
                                                        <span className="font-black text-sm text-zinc-900">{profile?.averageRating?.toFixed(1) || '0.0'} / 4.0</span>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#FF7D00]" style={{ width: `${Math.min(100, ((profile?.averageRating || 0) / 4) * 100)}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </div>
            </main>
            {/* ====== 포트폴리오 등록 모달 ====== */}
            <AnimatePresence>
                {isPortfolioModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col overflow-hidden bg-white"
                    >
                        <button onClick={() => { setIsPortfolioModalOpen(false); setPortfolioForm({ id: null, title: '', desc: '', thumbnailUrl: '', portfolioImages: [], skills: [] }); setPortfolioSkillSearchQuery(''); }} className="absolute right-6 top-6 z-10 rounded-full bg-zinc-100 p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900" aria-label="Close modal"><X size={20} /></button>

                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-6">
                            <div className="shrink-0 border-b border-zinc-100 px-8 pb-6 pt-10 md:px-12 md:pt-12">
                                <h2 className="mb-2 text-2xl font-black tracking-tight md:text-3xl">포트폴리오 등록</h2>
                                <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">UPLOAD_NEW_RECORD</p>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8 no-scrollbar md:px-12">
                                <div className="mx-auto max-w-3xl space-y-6 pb-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black font-mono uppercase text-zinc-400">제목 / Title *</label>
                                        <input type="text" value={portfolioForm.title} onChange={e => setPortfolioForm({ ...portfolioForm, title: e.target.value })} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:border-[#7A4FFF] outline-none" placeholder="프로젝트 제목을 입력하세요." />
                                    </div>

                                    <input type="file" accept="image/*" className="hidden" ref={thumbFileInputRef} onChange={handleThumbUpload} />
                                    <input type="file" accept="image/*" multiple className="hidden" ref={bulkFileInputRef} onChange={handleBulkImageUpload} />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black font-mono uppercase text-zinc-400 flex justify-between">
                                                썸네일 (대표 이미지) {isThumbUploading && <Loader2 size={12} className="animate-spin text-[#7A4FFF]" />}
                                            </label>
                                            <button type="button" aria-label="썸네일 이미지 업로드" onClick={() => !isThumbUploading && thumbFileInputRef.current?.click()} className={`relative h-48 w-full overflow-hidden rounded-2xl border-2 border-dashed transition-all md:h-56 flex flex-col items-center justify-center cursor-pointer ${portfolioForm.thumbnailUrl ? 'border-[#7A4FFF] bg-purple-50' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'}`}>
                                                {portfolioForm.thumbnailUrl ? (
                                                    <img src={portfolioForm.thumbnailUrl} alt="thumb" className="absolute inset-0 h-full w-full object-cover" />
                                                ) : (
                                                    <span className="relative z-10 flex flex-col items-center">
                                                        <ImageIcon className="mb-2 text-zinc-300" size={32} />
                                                        <span className="text-xs font-bold text-zinc-400">썸네일 업로드</span>
                                                    </span>
                                                )}
                                                {isThumbUploading && (
                                                    <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-sm" />
                                                )}
                                            </button>
                                        </div>

                                        <div className="flex flex-col space-y-2">
                                            <label className="text-[10px] font-black font-mono uppercase text-zinc-400 flex justify-between">
                                                상세 이미지 (최대 10장) {isBulkUploading && <Loader2 size={12} className="animate-spin text-[#7A4FFF]" />}
                                            </label>
                                            <button type="button" aria-label="상세 이미지 업로드" onClick={() => !isBulkUploading && bulkFileInputRef.current?.click()} className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition-all hover:bg-zinc-100 md:h-56">
                                                <Upload className="mb-2 text-zinc-300" size={32} />
                                                <span className="text-xs font-bold text-zinc-400">다중 이미지 업로드</span>
                                                <span className="mt-1 text-[10px] text-zinc-400">({portfolioForm.portfolioImages.length}/10)</span>
                                            </button>
                                        </div>
                                    </div>

                                    {portfolioForm.portfolioImages.length > 0 && (
                                        <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar">
                                            {portfolioForm.portfolioImages.map((imgUrl, idx) => (
                                                <div key={idx} className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-zinc-200 shadow-sm md:h-32 md:w-32">
                                                    <img src={imgUrl} alt="preview" className="h-full w-full object-cover" />
                                                    <button type="button" onClick={() => removePortfolioImage(idx)} className="absolute right-1.5 top-1.5 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black font-mono uppercase text-zinc-400">상세 설명 / Description *</label>
                                        <textarea rows={5} value={portfolioForm.desc} onChange={e => setPortfolioForm({ ...portfolioForm, desc: e.target.value })} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:border-[#7A4FFF] outline-none resize-none" placeholder="수행한 역할과 성과를 상세히 적어주세요." />
                                    </div>

                                    {/* 포트폴리오 스킬 선택 */}
                                    <div className="space-y-3 border-t border-zinc-100 pt-6">
                                        <label className="text-[10px] font-black font-mono uppercase text-zinc-400">사용 기술 / Tech Stack</label>
                                        
                                        <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                                            {portfolioForm.skills.length === 0 ? (
                                                <span className="text-zinc-400 font-mono text-xs my-auto">선택된 기술이 없습니다.</span>
                                            ) : (
                                                portfolioForm.skills.map((skillId, idx) => {
                                                    const skillObj = allGlobalSkills.find(s => (s.skillId || s.id) === skillId);
                                                    return (
                                                        <span key={`port-skill-${skillId || idx}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#7A4FFF]/10 border border-[#7A4FFF]/20 text-[#7A4FFF]">
                                                            #{skillObj ? skillObj.name : skillId}
                                                            <button onClick={() => togglePortfolioSkill(skillId)} className="text-[#7A4FFF]/60 hover:text-red-500 transition-colors ml-1"><X size={12} /></button>
                                                        </span>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <div className="relative mt-2">
                                            <input className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 outline-none text-sm font-bold focus:border-[#FF7D00] shadow-sm transition-all focus:ring-2 focus:ring-[#FF7D00]/10" placeholder="기술 검색하여 추가..." value={portfolioSkillSearchQuery} onChange={e => setPortfolioSkillSearchQuery(e.target.value)} />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto no-scrollbar p-2 bg-zinc-50 rounded-xl border border-zinc-100 shadow-inner">
                                            {allGlobalSkills
                                                .filter(s => s.name.toLowerCase().includes(portfolioSkillSearchQuery.toLowerCase()))
                                                .map((skill, idx) => {
                                                    const sId = skill.skillId || skill.id;
                                                    const isSelected = portfolioForm.skills.includes(sId);
                                                    return (
                                                        <button key={`global-port-skill-${sId || idx}`} onClick={() => togglePortfolioSkill(sId)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${isSelected ? 'bg-[#FF7D00]/10 border-[#FF7D00]/30 text-[#FF7D00]' : 'bg-white border-zinc-200 text-zinc-500 hover:border-[#7A4FFF] hover:text-[#7A4FFF]'}`}>
                                                            {isSelected ? '✓ ' : '+ '}{skill.name}
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 border-t border-zinc-100 bg-white px-8 py-4 md:px-12">
                                <div className="mx-auto flex max-w-3xl gap-4">
                                    <button onClick={() => { setIsPortfolioModalOpen(false); setPortfolioForm({ id: null, title: '', desc: '', thumbnailUrl: '', portfolioImages: [], skills: [] }); setPortfolioSkillSearchQuery(''); }} className="flex-1 rounded-xl bg-zinc-100 py-4 text-sm font-black text-zinc-900 transition-colors hover:bg-zinc-200">취소</button>
                                    <button onClick={handleSavePortfolio} className="flex-1 rounded-xl bg-zinc-900 py-4 text-sm font-black text-white shadow-xl transition-colors hover:bg-black">등록하기</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <PortfolioDetailModal
                portfolio={selectedPortfolio}
                initialImageIndex={0}
                onClose={() => setSelectedPortfolio(null)}
                readOnly={false}
                onEdit={() => {
                    const sp = selectedPortfolio;
                    if (!sp) return;
                    setPortfolioForm({
                        id: sp.id,
                        title: sp.title,
                        desc: sp.desc,
                        thumbnailUrl: sp.thumbnailUrl || '',
                        portfolioImages: sp.portfolioImages || [],
                        skills: sp.skills ? sp.skills.map((s: { skillId?: number; id?: number }) => s.skillId || s.id) : [],
                    });
                    setSelectedPortfolio(null);
                    setIsPortfolioModalOpen(true);
                }}
                onDelete={(id) => {
                    void handleDeletePortfolio(id);
                }}
            />
        </div>
    );
}