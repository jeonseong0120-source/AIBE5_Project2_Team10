'use client';

import { MAX_SELECTED_SKILLS } from '@/app/lib/skillLimits';
import { Settings, User as UserIcon, Loader2, Upload, Save, MapPin, Clock, Activity, X, CheckCircle2, Globe, Cpu, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export interface Skill {
    id?: number;
    skillId?: number;
    name: string;
}

export interface FreelancerProfile {
    profileImageUrl?: string;
    nickname?: string;
    userName?: string;
    workStyle?: 'ONLINE' | 'OFFLINE' | 'HYBRID';
    hourlyRate?: number;
    introduction?: string;
    location?: string;
    isActive?: boolean;
    latitude?: number;
    longitude?: number;
    skills?: Skill[];
}

export interface EditableFreelancerProfile {
    profileImageUrl?: string;
    userName?: string;
    workStyle?: 'ONLINE' | 'OFFLINE' | 'HYBRID' | string;
    hourlyRate?: number | string;
    introduction?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
    skills?: Skill[];
}

interface MypageProfileTabProps {
    profile: FreelancerProfile | null;
    isEditingProfile: boolean;
    setIsEditingProfile: (val: boolean) => void;
    editProfileData: EditableFreelancerProfile;
    setEditProfileData: (data: Partial<EditableFreelancerProfile>) => void;
    mySkillIds: number[];
    toggleSkill: (skillId: number) => void;
    skillSearchQuery: string;
    setSkillSearchQuery: (val: string) => void;
    allGlobalSkills: Skill[];
    handleProfileAndSkillUpdate: () => void;
    isProfileUploading: boolean;
    profileFileInputRef: React.RefObject<HTMLInputElement | null>;
    handleProfileImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleToggleStatus: () => void;
    validationError: string;
    setValidationError: (val: string) => void;
    setMySkillIds: (ids: number[]) => void;
    isTogglingStatus: boolean;
}

export default function MypageProfileTab({
    profile,
    isEditingProfile,
    setIsEditingProfile,
    editProfileData,
    setEditProfileData,
    mySkillIds,
    toggleSkill,
    skillSearchQuery,
    setSkillSearchQuery,
    allGlobalSkills,
    handleProfileAndSkillUpdate,
    isProfileUploading,
    profileFileInputRef,
    handleProfileImageUpload,
    handleToggleStatus,
    validationError,
    setValidationError,
    setMySkillIds,
    isTogglingStatus
}: MypageProfileTabProps) {
    return (
        <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
                {!isEditingProfile ? (
                    <motion.div 
                        key="view"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="space-y-6 pb-8"
                    >
                        {/* 🏆 Refined Profile Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-8">
                                <div className="relative group">
                                    <div className={`absolute -inset-1 rounded-[2.5rem] bg-gradient-to-tr from-[#7A4FFF] to-[#B393FF] opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-500 ${profile?.isActive ? 'opacity-30 blur-md' : 'opacity-0'}`} />
                                    <div className="relative w-28 h-28 rounded-[2.2rem] bg-white border border-zinc-100 shadow-2xl overflow-hidden flex-shrink-0">
                                        {profile?.profileImageUrl ? (
                                            <Image 
                                                src={profile.profileImageUrl} 
                                                alt={profile?.userName || "profile"} 
                                                fill 
                                                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-50 text-zinc-300">
                                                <UserIcon size={40} strokeWidth={1.5} />
                                            </div>
                                        )}
                                    </div>
                                    {profile?.isActive && (
                                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-zinc-100">
                                            <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-5xl font-black tracking-tighter text-zinc-900 leading-none">
                                        {profile?.userName || '사용자'}
                                    </h2>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => { setIsEditingProfile(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="h-14 px-8 bg-zinc-900 hover:bg-[#7A4FFF] text-white shadow-xl shadow-zinc-200/50 hover:shadow-[#7A4FFF]/30 rounded-2xl text-[13px] font-bold transition-all duration-300 flex items-center gap-3 group active:scale-95"
                            >
                                <Settings size={18} className="group-hover:rotate-180 transition-transform duration-700 ease-out" /> 
                                프로필 상세 관리
                            </button>
                        </div>

                        {/* ⚡️ Refined Status Dashboard Card (Compact) - Increased top margin for breathing room */}
                        <div className={`mt-10 relative overflow-hidden rounded-[2.5rem] p-[2px] transition-all duration-700 ${
                            profile?.isActive 
                                ? 'bg-gradient-to-br from-[#7A4FFF] to-indigo-400 shadow-lg shadow-[#7A4FFF]/10' 
                                : 'bg-zinc-200 shadow-sm'
                        }`}>
                            <div className="bg-white rounded-[2.4rem] p-7 md:p-8 relative overflow-hidden">
                                {/* Decorative Background elements */}
                                <div className={`absolute top-0 right-0 w-64 h-64 -mr-16 -mt-16 rounded-full opacity-[0.02] pointer-events-none transition-colors duration-700 ${profile?.isActive ? 'bg-[#7A4FFF]' : 'bg-zinc-900'}`} />

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-6 text-left">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 ${
                                            profile?.isActive 
                                                ? 'bg-[#7A4FFF]/10 text-[#7A4FFF] scale-105' 
                                                : 'bg-zinc-50 text-zinc-400 scale-100'
                                        }`}>
                                            <Zap size={28} className={profile?.isActive ? 'animate-pulse' : ''} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                                                {profile?.isActive ? '새로운 프로젝트 기회를 찾는 중' : '현재 프로필 정비 및 휴식 중'}
                                            </h3>
                                            <p className="text-[13px] text-zinc-500 font-medium leading-relaxed max-w-sm">
                                                {profile?.isActive 
                                                    ? '클라이언트로부터 직접적인 프로젝트 제안을 받을 수 있는 활성 상태입니다.' 
                                                    : '잠시 협업 제안을 받지 않는 비활성 상태입니다. 준비가 되면 다시 활성화하세요.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-5 px-6 py-4 bg-zinc-50/80 rounded-[1.5rem] border border-zinc-100/50">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">활동 모드 전환</span>
                                        <button
                                            onClick={handleToggleStatus}
                                            disabled={isTogglingStatus}
                                            className={`group relative inline-flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus:outline-none ${
                                                profile?.isActive 
                                                    ? 'bg-[#7A4FFF] shadow-md shadow-[#7A4FFF]/30' 
                                                    : 'bg-zinc-300'
                                            }`}
                                            role="switch"
                                            aria-checked={profile?.isActive}
                                            type="button"
                                        >
                                            <span 
                                                className={`pointer-events-none flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                                                    profile?.isActive ? 'translate-x-8' : 'translate-x-0'
                                                }`}
                                            >
                                                {isTogglingStatus ? (
                                                    <Loader2 size={12} className="text-zinc-400 animate-spin" />
                                                ) : profile?.isActive ? (
                                                    <CheckCircle2 size={12} className="text-[#7A4FFF]" />
                                                ) : (
                                                    <X size={12} className="text-zinc-400" />
                                                )}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 📊 Refined Info Sections (Compact) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Basic Info Card */}
                            <div className="bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-xl shadow-zinc-200/40 space-y-7 flex flex-col justify-between transition-all hover:shadow-zinc-200/60">
                                <div className="flex items-center justify-between border-b border-zinc-50 pb-4">
                                    <p className="text-sm font-black text-[#7A4FFF] tracking-[0.1em] uppercase">
                                        핵심 활동 지표
                                    </p>
                                    <Globe size={14} className="text-zinc-300" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={12} /> 주요 활동 지역</span>
                                        <p className="font-black text-zinc-900 text-lg tracking-tight leading-none">{profile?.location || '지역 미설정'}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Clock size={12} /> 희망 프로젝트 시급</span>
                                        <p className="font-black text-zinc-900 text-lg tracking-tight leading-none">
                                            {profile?.hourlyRate ? `₩${profile.hourlyRate.toLocaleString()}` : '상담 후 결정'}
                                        </p>
                                    </div>
                                    <div className="space-y-1.5 col-span-2 pt-5 border-t border-zinc-50">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Activity size={12} /> 선호 협업 방식</span>
                                        <p className="font-black text-zinc-900 text-lg tracking-tight leading-none">
                                            {profile?.workStyle === 'ONLINE' ? '온라인' : profile?.workStyle === 'OFFLINE' ? '오프라인' : '하이브리드'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tech Stack Card */}
                            <div className="bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-xl shadow-zinc-200/40 space-y-7 flex flex-col transition-all hover:shadow-zinc-200/60">
                                <div className="flex items-center justify-between border-b border-zinc-50 pb-4">
                                    <p className="text-sm font-black text-[#7A4FFF] tracking-[0.1em] uppercase">
                                        핵심 기술 역량
                                    </p>
                                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Total {(profile?.skills || []).length}</span>
                                </div>
                                <div className="flex flex-wrap gap-2.5 flex-1 content-start max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
                                    {(profile?.skills || []).length > 0 ? (
                                        (profile!.skills!).map((s, idx) => (
                                            <span 
                                                key={`skill-${s.skillId || s.id || idx}`} 
                                                className="px-4 py-2.5 bg-zinc-50 text-zinc-800 border border-zinc-100 rounded-xl text-[11px] font-bold hover:border-[#7A4FFF]/20 hover:bg-[#7A4FFF]/5 transition-all duration-300 cursor-default leading-none"
                                            >
                                                {s.name}
                                            </span>
                                        ))
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-zinc-50 rounded-2xl py-10">
                                            <p className="text-[11px] text-zinc-300 font-bold italic tracking-wider">보유하신 전문 기술을 등록해주세요.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Introduction Card (Refined White Theme) */}
                            <div className="bg-white rounded-[2rem] p-8 md:col-span-2 border border-zinc-100 shadow-xl shadow-zinc-200/40 relative overflow-hidden group transition-all hover:shadow-zinc-200/60">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7A4FFF]/20" />
                                <div className="relative z-10 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-black text-[#7A4FFF] tracking-[0.1em] uppercase">
                                            핵심 커리어 소개
                                        </p>
                                        <div className="text-zinc-100 group-hover:text-[#7A4FFF]/10 transition-colors duration-500">
                                            <span className="text-5xl font-serif">"</span>
                                        </div>
                                    </div>
                                    <blockquote className="text-base md:text-[17px] text-zinc-700 leading-[1.8] font-medium tracking-tight">
                                        {profile?.introduction || '당신이 가진 강점과 비즈니스 가치를 클라이언트에게 들려주세요.'}
                                    </blockquote>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="edit"
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="space-y-6 pb-12"
                    >
                        {/* 📸 Edit Header - Refined & Compact */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-xl shadow-zinc-200/40 flex flex-col md:flex-row items-center gap-8">
                            <div className="relative group">
                                <div className="w-28 h-28 rounded-[2rem] border-4 border-zinc-50 shadow-md relative bg-zinc-100 flex-shrink-0 group overflow-hidden">
                                    {isProfileUploading ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-200 animate-pulse">
                                            <Loader2 className="animate-spin mb-1" size={24} />
                                        </div>
                                    ) : editProfileData?.profileImageUrl ? (
                                        <Image 
                                            src={editProfileData.profileImageUrl} 
                                            alt="profile" 
                                            fill 
                                            className="object-cover transition-transform duration-500 group-hover:scale-110" 
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-300">
                                            <UserIcon size={32} strokeWidth={1.5} />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className="absolute inset-0 bg-zinc-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm cursor-pointer text-white"
                                        onClick={() => profileFileInputRef.current?.click()}
                                    >
                                        <Upload size={20} className="mb-1" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">이미지 교체</span>
                                    </button>
                                    <input type="file" ref={profileFileInputRef} className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                                </div>
                            </div>
                            <div className="flex-1 space-y-2 text-center md:text-left">
                                <h3 className="text-xl font-black text-zinc-900 tracking-tight">전문가 정보 커스터마이징</h3>
                                <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                                    전문성을 가장 잘 표현할 수 있는 프로필 사진과 정보를 등록해주세요.<br />
                                    모든 변경 사항은 실시간으로 저장되지 않으며, 완료 버튼을 통해 확정됩니다.
                                </p>
                            </div>
                        </div>

                        {/* 📝 Edit Form - Sophisticated & Compact */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-zinc-100 shadow-xl shadow-zinc-200/40 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black tracking-[0.1em] uppercase text-zinc-400 pl-1 flex items-center gap-2">
                                        <UserIcon size={12} /> 활동 닉네임
                                    </label>
                                    <input
                                        type="text"
                                        value={editProfileData.userName || ''}
                                        onChange={e => setEditProfileData({ ...editProfileData, userName: e.target.value })}
                                        className="w-full bg-zinc-50/50 px-5 py-4 rounded-2xl border border-zinc-100 outline-none focus:border-[#7A4FFF] focus:bg-white text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-[#7A4FFF]/5"
                                        placeholder="클라이언트에게 보여질 이름을 입력하세요."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black tracking-[0.1em] uppercase text-zinc-400 pl-1 flex items-center gap-2">
                                        <MapPin size={12} /> 주요 활동 지역
                                    </label>
                                    <select
                                        value={editProfileData.location}
                                        onChange={e => setEditProfileData({ ...editProfileData, location: e.target.value })}
                                        className="w-full bg-zinc-50/50 px-5 py-4 rounded-2xl border border-zinc-100 outline-none focus:border-[#7A4FFF] focus:bg-white text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-[#7A4FFF]/5"
                                    >
                                        <option value="">지역 선택</option>
                                        {['서울', '경기', '인천', '부산', '대구', '원격'].map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black tracking-[0.1em] uppercase text-zinc-400 pl-1 flex items-center gap-2">
                                        <Clock size={12} /> 희망 프로젝트 시급 (KRW)
                                    </label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">₩</span>
                                        <input
                                            type="text"
                                            value={editProfileData.hourlyRate === '' ? '' : Number(editProfileData.hourlyRate).toLocaleString()}
                                            onChange={e => {
                                                const rawValue = e.target.value.replace(/[^\d]/g, '');
                                                setEditProfileData({ ...editProfileData, hourlyRate: rawValue ? parseInt(rawValue, 10) : '' });
                                            }}
                                            className="w-full bg-zinc-50/50 pl-10 pr-5 py-4 rounded-2xl border border-zinc-100 outline-none focus:border-[#7A4FFF] focus:bg-white text-sm font-black shadow-sm transition-all focus:ring-4 focus:ring-[#7A4FFF]/5 font-mono"
                                            placeholder="예: 50,000"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black tracking-[0.1em] uppercase text-zinc-400 pl-1 flex items-center gap-2">
                                        <Activity size={12} /> 선호하는 협업 스타일
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'ONLINE', label: '온라인' },
                                            { id: 'OFFLINE', label: '오프라인' },
                                            { id: 'HYBRID', label: '하이브리드' }
                                        ].map(style => (
                                            <button
                                                key={style.id}
                                                type="button"
                                                onClick={() => setEditProfileData({ ...editProfileData, workStyle: style.id })}
                                                className={`py-3.5 rounded-xl border-2 font-bold text-xs transition-all ${
                                                    editProfileData.workStyle === style.id 
                                                        ? 'bg-[#7A4FFF] border-[#7A4FFF] text-white shadow-md shadow-[#7A4FFF]/20' 
                                                        : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'
                                                }`}
                                            >
                                                {style.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                    <div className="flex items-center justify-between pl-1">
                                        <label className="text-[11px] font-black tracking-[0.1em] uppercase text-zinc-400 flex items-center gap-2">
                                            <Sparkles size={12} /> 전문가 커리어 소개
                                        </label>
                                        <span className={`text-[10px] font-mono font-bold ${(editProfileData.introduction?.length || 0) > 3500 ? 'text-orange-500' : 'text-zinc-400'}`}>
                                            {(editProfileData.introduction?.length ?? 0).toLocaleString()} / 4,000
                                        </span>
                                    </div>
                                    <textarea
                                        rows={5}
                                        maxLength={4000}
                                        value={editProfileData.introduction || ''}
                                        onChange={e => setEditProfileData({ ...editProfileData, introduction: e.target.value })}
                                        className="w-full min-h-[10rem] bg-zinc-50/50 px-5 py-5 rounded-2xl border border-zinc-100 outline-none focus:border-[#7A4FFF] focus:bg-white text-sm font-medium shadow-sm transition-all focus:ring-4 focus:ring-[#7A4FFF]/5 leading-relaxed resize-none"
                                        placeholder="클라이언트의 비즈니스 가치를 높이는 당신만의 전문성과 성공 사례를 들려주세요."
                                    />
                                </div>

                                {/* Skills Editor Section - Enhanced UI */}
                                <div className="space-y-6 md:col-span-2 pt-8 border-t border-zinc-50">
                                    <div className="flex items-baseline justify-between pl-1">
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-black tracking-[0.1em] uppercase text-[#7A4FFF] flex items-center gap-2">
                                                <Cpu size={12} /> 핵심 테크니컬 역량
                                            </label>
                                            <p className="text-[10px] font-medium text-zinc-400">당신의 전문 분야를 가장 잘 나타내는 기술을 {MAX_SELECTED_SKILLS}개까지 선택하세요.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                                mySkillIds.length >= MAX_SELECTED_SKILLS ? 'bg-orange-100 text-orange-600' : 'bg-zinc-100 text-zinc-500'
                                            }`}>
                                                {mySkillIds.length} / {MAX_SELECTED_SKILLS}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 p-5 bg-zinc-50/80 rounded-2xl border border-zinc-100 shadow-inner min-h-[4rem]">
                                        {mySkillIds.length === 0 ? (
                                            <div className="w-full flex items-center justify-center py-2">
                                                <p className="text-[11px] text-zinc-300 font-bold italic tracking-wider">클라이언트가 당신을 찾을 수 있도록 기술 스택을 추가해주세요.</p>
                                            </div>
                                        ) : (
                                            mySkillIds.map((skillId, idx) => {
                                                const skillObj = allGlobalSkills.find(s => (s.skillId || s.id) === skillId);
                                                return (
                                                    <motion.span 
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        key={`selected-${skillId}-${idx}`} 
                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-zinc-900 text-white shadow-sm"
                                                    >
                                                        {skillObj ? skillObj.name : skillId}
                                                        <button 
                                                            type="button"
                                                            onClick={() => toggleSkill(skillId)} 
                                                            className="text-zinc-400 hover:text-white transition-colors"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </motion.span>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <input 
                                                className="w-full pl-5 pr-12 py-4 rounded-xl bg-white border border-zinc-200 outline-none text-[13px] font-bold focus:border-[#7A4FFF] shadow-sm transition-all focus:ring-4 focus:ring-[#7A4FFF]/5" 
                                                placeholder="보유하신 기술 스택을 검색해보세요. (예: React, Node.js, Spring...)" 
                                                value={skillSearchQuery} 
                                                onChange={e => setSkillSearchQuery(e.target.value)} 
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#7A4FFF] transition-colors">
                                                <Settings size={16} className={skillSearchQuery ? 'animate-spin-slow' : ''} />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto custom-scrollbar p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                                            {allGlobalSkills
                                                .filter(s => s.name.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                                                .map((skill, idx) => {
                                                    const sId = (skill.skillId || skill.id) as number;
                                                    const isSelected = mySkillIds.includes(sId);
                                                    const atCap = !isSelected && mySkillIds.length >= MAX_SELECTED_SKILLS;
                                                    return (
                                                        <button
                                                            key={`opt-${sId}-${idx}`}
                                                            type="button"
                                                            disabled={atCap}
                                                            onClick={() => toggleSkill(sId)}
                                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                                                                isSelected
                                                                    ? 'bg-[#7A4FFF] border-[#7A4FFF] text-white shadow-sm'
                                                                    : atCap
                                                                      ? 'opacity-20 cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300'
                                                                      : 'bg-zinc-50/50 border-zinc-200 text-zinc-500 hover:border-[#7A4FFF] hover:text-[#7A4FFF] hover:bg-white'
                                                            }`}
                                                        >
                                                            {isSelected ? '✓ ' : '+ '}
                                                            {skill.name}
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🎮 Form Actions - Premium & Compact */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditingProfile(false);
                                    setEditProfileData({
                                        userName: profile?.userName || '',
                                        profileImageUrl: profile?.profileImageUrl || '',
                                        introduction: profile?.introduction || '',
                                        location: profile?.location || '',
                                        latitude: profile?.latitude || 37.5665,
                                        longitude: profile?.longitude || 126.9780,
                                        hourlyRate: profile?.hourlyRate || 0,
                                        workStyle: profile?.workStyle || 'ONLINE',
                                        isActive: profile?.isActive !== false,
                                        skills: profile?.skills || []
                                    });
                                    setMySkillIds((profile?.skills || []).map((s: Skill) => (s.skillId || s.id) as number));
                                    setValidationError('');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="flex-1 py-4.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-2xl text-sm font-black transition-all uppercase tracking-widest active:scale-[0.98]"
                            >
                                변경 취소
                            </button>
                            <button
                                onClick={handleProfileAndSkillUpdate}
                                className="flex-[1.5] py-4.5 bg-zinc-900 hover:bg-[#7A4FFF] text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg hover:shadow-[#7A4FFF]/20 transition-all uppercase tracking-widest active:scale-[0.98]"
                            >
                                <Save size={16} /> 업데이트 완료
                            </button>
                        </div>
                        
                        {validationError && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-red-500 font-black tracking-widest text-center bg-red-50 py-4 rounded-2xl border border-red-100 flex items-center justify-center gap-2"
                            >
                                <span className="text-sm">🚨</span> {validationError}
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

    );
}