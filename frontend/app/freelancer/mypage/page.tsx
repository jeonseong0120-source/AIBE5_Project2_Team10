'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Briefcase, Star, Award, Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { NotificationBell } from '@/components/notifications/NotificationProvider';

// New Components
import MypageSidebar from '@/components/layout/MypageSidebar';
import MypageNavbar from '@/components/layout/MypageNavbar';
import MypageProfileTab from '@/components/freelancer_mypage/MypageProfileTab';
import MypagePortfolioTab from '@/components/freelancer_mypage/MypagePortfolioTab';
import MypageReviewTab from '@/components/freelancer_mypage/MypageReviewTab';
import MypageGradeTab from '@/components/freelancer_mypage/MypageGradeTab';
import PortfolioFormModal from '@/components/freelancer_mypage/PortfolioFormModal';
import PortfolioDetailModal from '@/components/freelancer_mypage/PortfolioDetailModal';
import BookmarkTab from '../../../components/freelancer_mypage/MypageBookmarksTab';

const TABS = [
    { id: 'profile', label: 'MY PROFILE', icon: UserIcon },
    { id: 'portfolio', label: 'PORTFOLIO', icon: Briefcase },
    { id: 'reviews', label: 'REVIEWS', icon: Star },
    { id: 'grade', label: 'RANK', icon: Award },
    { id: 'bookmarks', label: 'BOOKMARKS', icon: Bookmark },
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

const EMPTY_PORTFOLIO_FORM = { id: null as number | null | undefined, title: '', desc: '', thumbnailUrl: '', portfolioImages: [] as string[], skills: [] as number[] };

export default function FreelancerMyPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');
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
    const [portfolioForm, setPortfolioForm] = useState(EMPTY_PORTFOLIO_FORM);
    const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // 업로드 로딩 상태 관리
    const [isProfileUploading, setIsProfileUploading] = useState(false);
    const [isThumbUploading, setIsThumbUploading] = useState(false);
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

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
        if (activeTab === 'reviews' && reviews.length === 0 && profile?.id) fetchReviews(profile.id);
    }, [activeTab, authorized, profile?.id, portfolios.length, reviews.length]);

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
        if (isTogglingStatus) return;
        setIsTogglingStatus(true);
        try {
            const newStatus = !profile.isActive;
            await api.patch('/v1/freelancers/status', { isActive: newStatus });
            setProfile((prev: any) => ({ ...prev, isActive: newStatus }));
            setEditProfileData((prev: any) => ({ ...prev, isActive: newStatus }));
        } catch (error) {
            alert('상태 변경 실패');
        } finally {
            setIsTogglingStatus(false);
        }
    }

    const toggleSkill = (skillId: number) => {
        if (mySkillIds.includes(skillId)) {
            setMySkillIds(mySkillIds.filter(id => id !== skillId));
        } else {
            setMySkillIds([...mySkillIds, skillId]);
        }
    };

    const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsProfileUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const { data } = await api.post('/images/profile', formData);
            const newImageUrl = data.imageUrl;
            setProfile((prev: any) => ({ ...prev, profileImageUrl: newImageUrl }));
            setEditProfileData((prev: any) => ({ ...prev, profileImageUrl: newImageUrl }));
            alert('프로필 이미지가 변경되었습니다.');
        } catch (error: any) {
            alert('프로필 업로드 실패');
            console.error(error);
        } finally {
            setIsProfileUploading(false);
        }
    };

    const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsThumbUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const { data } = await api.post('/images/portfolio', formData);
            setPortfolioForm(prev => ({ ...prev, thumbnailUrl: data.imageUrl }));
        } catch (error: any) {
            alert('썸네일 업로드 실패');
        } finally {
            setIsThumbUploading(false);
        }
    };

    const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const remainingSlots = 10 - portfolioForm.portfolioImages.length;
        if (files.length > remainingSlots) {
            alert(`최대 ${remainingSlots}장만 더 업로드할 수 있습니다.`);
            return;
        }
        setIsBulkUploading(true);
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append('files', file));
        try {
            const { data } = await api.post('/images/portfolios/bulk', formData);
            setPortfolioForm(prev => ({ ...prev, portfolioImages: [...prev.portfolioImages, ...data.imageUrls].slice(0, 10) }));
        } catch (error: any) {
            alert('다중 이미지 업로드 실패');
        } finally {
            setIsBulkUploading(false);
        }
    };

    const removePortfolioImage = (indexToRemove: number) => {
        setPortfolioForm(prev => ({ ...prev, portfolioImages: prev.portfolioImages.filter((_, idx) => idx !== indexToRemove) }));
    };

    const togglePortfolioSkill = (skillId: number) => {
        setPortfolioForm(prev => ({ ...prev, skills: prev.skills.includes(skillId) ? prev.skills.filter(id => id !== skillId) : [...prev.skills, skillId] }));
    };

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
        }
    };

    if (!authorized) return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-[#7A4FFF] font-black text-xl animate-pulse uppercase font-mono tracking-[0.2em]">
            SYSTEM_AUTHORIZING...
        </div>
    );
    if (!profile && !isEditingProfile) return null;

    const navItems = [
        { label: 'DASHBOARD', path: '/freelancer/dashboard' },
        { label: 'EXPLORE', path: '/freelancer/explore' },
        { label: 'MY_PROFILE', path: '/freelancer/mypage', active: true },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-24 relative scroll-smooth font-sans">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px), linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px, 100px 100px, 100px 100px' }} />
            </div>

            <MypageNavbar
                userType="FREELANCER"
                userName={profile?.userName}
                profileImage={profile?.profileImageUrl}
                navItems={navItems}
                accentColor="#7A4FFF"
            />

            {/* 🎯 레이아웃 뼈대: 그리드 [300px(사이드바) + 1fr(메인 콘텐츠)] */}
            <main className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start relative z-10">
                <MypageSidebar
                    tabs={TABS}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    accentColor="#7A4FFF"
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
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                <div className="w-10 h-10 border-4 border-[#7A4FFF]/20 border-t-[#7A4FFF] rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                {activeTab === 'profile' && (
                                    <MypageProfileTab
                                        profile={profile}
                                        isEditingProfile={isEditingProfile}
                                        setIsEditingProfile={setIsEditingProfile}
                                        editProfileData={editProfileData}
                                        setEditProfileData={setEditProfileData}
                                        mySkillIds={mySkillIds}
                                        toggleSkill={toggleSkill}
                                        skillSearchQuery={skillSearchQuery}
                                        setSkillSearchQuery={setSkillSearchQuery}
                                        allGlobalSkills={allGlobalSkills}
                                        handleProfileAndSkillUpdate={handleProfileAndSkillUpdate}
                                        isProfileUploading={isProfileUploading}
                                        profileFileInputRef={profileFileInputRef}
                                        handleProfileImageUpload={handleProfileImageUpload}
                                        handleToggleStatus={handleToggleStatus}
                                        isTogglingStatus={isTogglingStatus}
                                        validationError={validationError}
                                        setValidationError={setValidationError}
                                        setMySkillIds={setMySkillIds}
                                    />
                                )}
                                {activeTab === 'portfolio' && (
                                    <MypagePortfolioTab
                                        portfolios={portfolios}
                                        setIsPortfolioModalOpen={setIsPortfolioModalOpen}
                                        setPortfolioForm={setPortfolioForm}
                                        setPortfolioSkillSearchQuery={setPortfolioSkillSearchQuery}
                                        setSelectedPortfolio={setSelectedPortfolio}
                                        setActiveImageIndex={setActiveImageIndex}
                                        emptyPortfolioForm={EMPTY_PORTFOLIO_FORM}
                                    />
                                )}
                                {activeTab === 'reviews' && (
                                    <MypageReviewTab reviews={reviews} profile={profile} />
                                )}
                                {activeTab === 'grade' && (
                                    <MypageGradeTab profile={profile} />
                                )}
                                {activeTab === 'bookmarks' && (
                                    <BookmarkTab />
                                )}
                            </>
                        )}
                    </motion.div>
                </div>
            </main>

            <PortfolioFormModal
                isOpen={isPortfolioModalOpen}
                onClose={() => { setIsPortfolioModalOpen(false); setPortfolioForm(EMPTY_PORTFOLIO_FORM); setPortfolioSkillSearchQuery(''); }}
                portfolioForm={portfolioForm}
                setPortfolioForm={setPortfolioForm}
                portfolioSkillSearchQuery={portfolioSkillSearchQuery}
                setPortfolioSkillSearchQuery={setPortfolioSkillSearchQuery}
                allGlobalSkills={allGlobalSkills}
                isThumbUploading={isThumbUploading}
                isBulkUploading={isBulkUploading}
                thumbFileInputRef={thumbFileInputRef}
                bulkFileInputRef={bulkFileInputRef}
                handleThumbUpload={handleThumbUpload}
                handleBulkImageUpload={handleBulkImageUpload}
                removePortfolioImage={removePortfolioImage}
                togglePortfolioSkill={togglePortfolioSkill}
                handleSavePortfolio={handleSavePortfolio}
            />

            <PortfolioDetailModal
                selectedPortfolio={selectedPortfolio}
                setSelectedPortfolio={setSelectedPortfolio}
                activeImageIndex={activeImageIndex}
                setActiveImageIndex={setActiveImageIndex}
                handleDeletePortfolio={handleDeletePortfolio}
                setIsPortfolioModalOpen={setIsPortfolioModalOpen}
                setPortfolioForm={setPortfolioForm}
            />
        </div>
    );
}