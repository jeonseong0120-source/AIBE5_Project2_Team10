'use client';

import { Settings, User as UserIcon, Loader2, Upload, Save, MapPin, Clock, Activity, X, CheckCircle2 } from 'lucide-react';

interface MypageProfileTabProps {
    profile: any;
    isEditingProfile: boolean;
    setIsEditingProfile: (val: boolean) => void;
    editProfileData: any;
    setEditProfileData: (data: any) => void;
    mySkillIds: number[];
    toggleSkill: (skillId: number) => void;
    skillSearchQuery: string;
    setSkillSearchQuery: (val: string) => void;
    allGlobalSkills: any[];
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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-zinc-100 border-4 border-white shadow-xl overflow-hidden flex-shrink-0">
                        {profile?.profileImageUrl ? (
                            <img src={profile.profileImageUrl} alt="profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                <UserIcon size={32} />
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter text-zinc-900">{profile?.userName || '사용자'}</h2>
                        <p className="text-[10px] text-[#7A4FFF] font-mono font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                            <Activity size={12} /> {profile?.isActive ? 'ACTIVE_STATUS' : 'AWAY_STATUS'}
                        </p>
                    </div>
                </div>
                {!isEditingProfile && (
                    <button
                        onClick={() => setIsEditingProfile(true)}
                        className="h-12 px-6 bg-zinc-950 hover:bg-[#7A4FFF] text-white shadow-xl shadow-zinc-200 rounded-2xl text-xs font-black transition-all font-mono tracking-widest uppercase flex items-center gap-2 group"
                    >
                        <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" /> 프로필 편집하기
                    </button>
                )}
            </div>

            {/* ⚡️ 고급 활동 상태 마스터 컨트롤 */}
            {!isEditingProfile && (
                <div className={`relative overflow-hidden rounded-[2.5rem] p-8 border transition-all duration-500 ${
                    profile?.isActive 
                        ? 'bg-gradient-to-br from-green-50/50 to-emerald-50/30 border-green-100 shadow-lg shadow-green-100/20' 
                        : 'bg-gradient-to-br from-zinc-50 to-zinc-100/50 border-zinc-200/60 shadow-inner'
                }`}>
                    {/* Decorative Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03] pointer-events-none transform translate-x-16 -translate-y-16">
                        <Activity size={256} className={profile?.isActive ? 'text-green-600' : 'text-zinc-400'} />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6 text-center md:text-left">
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${
                                profile?.isActive 
                                    ? 'bg-white text-green-500 shadow-xl shadow-green-200/50 scale-110' 
                                    : 'bg-zinc-200/50 text-zinc-400'
                            }`}>
                                <Activity size={32} className={profile?.isActive ? 'animate-pulse' : ''} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-zinc-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${profile?.isActive ? 'bg-green-500' : 'bg-zinc-400'} animate-pulse`}></span>
                                    {profile?.isActive ? '현재 프로젝트 제안 받는 중' : '잠시 휴식 중입니다'}
                                </h3>
                                <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed max-w-[280px]">
                                    {profile?.isActive 
                                        ? '클라이언트들이 당신의 프로필을 발견하고 프로젝트를 제안할 수 있는 상태입니다.' 
                                        : '프로필이 검색 결과에 노출되지 않으며 새로운 제안을 받지 않습니다.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <span className="text-[10px] font-black font-mono uppercase tracking-[0.2em] text-zinc-400">Availability_Toggle</span>
                            <button
                                onClick={handleToggleStatus}
                                className={`group relative inline-flex h-10 w-20 shrink-0 cursor-pointer items-center rounded-full border-4 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 ${
                                    profile?.isActive 
                                        ? 'bg-green-500 focus:ring-green-500/20 shadow-lg shadow-green-500/40' 
                                        : 'bg-zinc-300 focus:ring-zinc-300/20'
                                }`}
                                role="switch"
                                aria-checked={profile?.isActive}
                                type="button"
                            >
                                <span className="sr-only">Toggle Status</span>
                                <span 
                                    className={`pointer-events-none flex items-center justify-center h-8 w-8 transform rounded-full bg-white shadow-xl ring-0 transition duration-300 ease-in-out ${
                                        profile?.isActive ? 'translate-x-10' : 'translate-x-0'
                                    }`}
                                >
                                    {isTogglingStatus ? (
                                        <Loader2 size={16} className="text-zinc-400 animate-spin" />
                                    ) : profile?.isActive ? (
                                        <CheckCircle2 size={16} className="text-green-500" />
                                    ) : (
                                        <X size={16} className="text-zinc-400" />
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditingProfile && (
                <div className="bg-purple-50/50 rounded-[2rem] p-6 border border-purple-100 flex items-center gap-6 shadow-sm mb-6">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg relative bg-zinc-100 flex-shrink-0 group overflow-hidden">
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
                        <button
                            type="button"
                            className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                            onClick={() => profileFileInputRef.current?.click()}
                        >
                            <Upload size={20} className="mb-1" />
                            <span className="text-[9px] font-mono font-bold">CHANGE</span>
                        </button>
                        <input type="file" ref={profileFileInputRef} className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-zinc-900 tracking-tight">프로필 사진 변경</h3>
                        <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">나를 잘 나타낼 수 있는 사진을 업로드해주세요.<br />클라이언트에게 신뢰감을 줄 수 있습니다.</p>
                    </div>
                </div>
            )}

            {!isEditingProfile ? (
                <div className="space-y-6">
                    <div className="bg-zinc-50 rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm space-y-5">
                        <p className="text-[10px] font-black font-mono uppercase text-[#7A4FFF] tracking-widest mb-2 border-b border-zinc-200/50 pb-3 flex items-center gap-2"><UserIcon size={14} /> 기본 정보</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={12} /> 지역</span>
                                <span className="font-black text-zinc-900 text-lg">{profile?.location || '미설정'}</span>
                            </div>
                            <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-zinc-200/50 pt-4 md:pt-0 md:pl-6">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Clock size={12} /> 희망 시급</span>
                                <span className="font-black text-zinc-900 text-lg">{profile?.hourlyRate ? `₩${profile.hourlyRate.toLocaleString()}` : '미설정'}</span>
                            </div>
                            <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-zinc-200/50 pt-4 md:pt-0 md:pl-6">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Activity size={12} /> 근무 방식</span>
                                <span className="font-black text-zinc-900 text-lg">{profile?.workStyle || '미설정'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-50 rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm space-y-4">
                        <p className="text-[10px] font-black font-mono uppercase text-[#7A4FFF] tracking-widest mb-2 border-b border-zinc-200/50 pb-3">소개글</p>
                        <p className="text-sm text-zinc-700 leading-relaxed max-w-3xl italic font-medium">"{profile?.introduction || '작성된 소개글이 없습니다.'}"</p>
                    </div>

                    <div className="bg-zinc-50 rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm space-y-4">
                        <p className="text-[10px] font-black font-mono uppercase text-[#7A4FFF] tracking-widest mb-2 border-b border-zinc-200/50 pb-3">보유 기술 스택</p>
                        {(profile?.skills || []).length > 0 ? (
                            <div className="flex flex-wrap gap-2.5">
                                {(profile.skills).map((s: any, idx: number) => {
                                    const sId = s.skillId || s.id;
                                    return (
                                        <span key={`skill-${sId || idx}-${idx}`} className="px-5 py-2.5 bg-white border border-zinc-200 text-zinc-800 shadow-sm rounded-xl text-xs font-black hover:border-[#7A4FFF]/40 hover:bg-[#7A4FFF]/5 transition-colors uppercase tracking-wider">
                                            #{s.name}
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400 italic">등록된 기술 스택이 없습니다.</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-zinc-50 rounded-[2.5rem] p-8 md:p-10 border border-zinc-200 shadow-inner space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">활동 지역</label>
                                <select
                                    value={editProfileData.location}
                                    onChange={e => setEditProfileData({ ...editProfileData, location: e.target.value })}
                                    className="w-full bg-white p-5 rounded-2xl border border-zinc-200 outline-none focus:border-[#7A4FFF] hover:border-[#7A4FFF]/50 text-sm font-black shadow-sm transition-all focus:ring-4 focus:ring-[#7A4FFF]/10"
                                >
                                    <option value="">선택 안함</option>
                                    <option value="서울">서울</option><option value="경기">경기</option><option value="인천">인천</option>
                                    <option value="부산">부산</option><option value="대구">대구</option><option value="원격">원격 (Remote)</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">희망 시급 (원)</label>
                                <input
                                    type="text"
                                    value={editProfileData.hourlyRate === '' ? '' : Number(editProfileData.hourlyRate).toLocaleString()}
                                    onChange={e => {
                                        const rawValue = e.target.value.replace(/[^\d]/g, '');
                                        setEditProfileData({ ...editProfileData, hourlyRate: rawValue ? parseInt(rawValue, 10) : '' });
                                    }}
                                    className="w-full bg-white p-5 rounded-2xl border border-zinc-200 outline-none focus:border-[#7A4FFF] hover:border-[#7A4FFF]/50 text-sm font-black shadow-sm transition-all focus:ring-4 focus:ring-[#7A4FFF]/10 font-mono"
                                    placeholder="예: 50,000"
                                />
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">작업 방식</label>
                                <select
                                    value={editProfileData.workStyle}
                                    onChange={e => setEditProfileData({ ...editProfileData, workStyle: e.target.value })}
                                    className="w-full bg-white p-5 rounded-2xl border border-zinc-200 outline-none focus:border-[#7A4FFF] hover:border-[#7A4FFF]/50 text-sm font-black shadow-sm transition-all focus:ring-4 focus:ring-[#7A4FFF]/10"
                                >
                                    <option value="ONLINE">온라인 (ONLINE)</option>
                                    <option value="OFFLINE">오프라인 (OFFLINE)</option>
                                    <option value="HYBRID">하이브리드 (HYBRID)</option>
                                </select>
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">소개글</label>
                                <textarea
                                    rows={4}
                                    value={editProfileData.introduction}
                                    onChange={e => setEditProfileData({ ...editProfileData, introduction: e.target.value })}
                                    className="w-full bg-white p-5 rounded-2xl border border-zinc-200 outline-none focus:border-[#7A4FFF] hover:border-[#7A4FFF]/50 text-sm font-medium shadow-sm transition-all resize-none focus:ring-4 focus:ring-[#7A4FFF]/10 leading-relaxed"
                                    placeholder="자신의 강점을 어필해주세요."
                                />
                            </div>

                            {/* 스킬 편집 */}
                            <div className="space-y-4 md:col-span-2 border-t border-zinc-200/50 pt-8 mt-2">
                                <p className="text-[10px] font-black font-mono uppercase text-[#7A4FFF] tracking-widest mb-4">보유 기술 편집</p>

                                <div className="flex flex-wrap gap-2.5 min-h-[60px] p-5 bg-white rounded-2xl border border-zinc-200 shadow-inner">
                                    {mySkillIds.length === 0 ? (
                                        <span className="text-zinc-400 font-mono text-xs my-auto italic">선택된 스킬이 없습니다. 검색하여 추가하세요.</span>
                                    ) : (
                                        mySkillIds.map((skillId, idx) => {
                                            const skillObj = allGlobalSkills.find(s => (s.skillId || s.id) === skillId);
                                            return (
                                                <span key={`my-skill-${skillId || idx}-${idx}`} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-[#7A4FFF] text-white shadow-md">
                                                    {skillObj ? skillObj.name : skillId}
                                                    <button onClick={() => toggleSkill(skillId)} className="text-white/70 hover:text-white transition-colors ml-1"><X size={14} /></button>
                                                </span>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="relative mt-4">
                                    <input className="w-full px-5 py-4 rounded-2xl bg-white border border-zinc-200 outline-none text-sm font-black focus:border-[#FF7D00] shadow-sm transition-all focus:ring-4 focus:ring-[#FF7D00]/10" placeholder="스킬 검색하여 추가하기..." value={skillSearchQuery} onChange={e => setSkillSearchQuery(e.target.value)} />
                                </div>
                                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto custom-scrollbar p-4 bg-white rounded-2xl border border-zinc-100 shadow-inner mt-2">
                                    {allGlobalSkills
                                        .filter(s => s.name.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                                        .map((skill, idx) => {
                                            const sId = skill.skillId || skill.id;
                                            const isSelected = mySkillIds.includes(sId);
                                            return (
                                                <button key={`global-skill-${sId || idx}-${idx}`} onClick={() => toggleSkill(sId)} className={`px-4 py-2 rounded-xl text-[11px] font-black border transition-all tracking-wider ${isSelected ? 'bg-[#FF7D00] border-[#FF7D00] text-white shadow-md' : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-[#7A4FFF] hover:text-[#7A4FFF]'}`}>
                                                    {isSelected ? '✓ ' : '+ '}{skill.name}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                setIsEditingProfile(false);
                                setEditProfileData({
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
                                setMySkillIds((profile?.skills || []).map((s: any) => s.skillId || s.id));
                                setValidationError('');
                            }}
                            className="flex-[1] py-5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-[1.5rem] text-xs font-black transition-colors uppercase tracking-widest font-mono"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleProfileAndSkillUpdate}
                            className="flex-[2] py-5 bg-zinc-950 hover:bg-[#7A4FFF] text-white rounded-[1.5rem] text-xs font-black flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:shadow-purple-200 hover:-translate-y-1 transition-all uppercase tracking-widest font-mono"
                        >
                            <Save size={16} /> 수정 완료
                        </button>
                    </div>
                    {validationError && (
                        <div className="text-xs text-red-500 font-black tracking-widest text-center bg-red-50 py-4 rounded-2xl border border-red-100 uppercase font-mono">
                            🚨 {validationError}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}