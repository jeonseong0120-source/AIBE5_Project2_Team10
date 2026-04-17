'use client';

import { Settings, User as UserIcon, Loader2, Upload, Save, MapPin, Clock, Activity, X } from 'lucide-react';

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
    setMySkillIds
}: MypageProfileTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-xl font-black tracking-tighter">마이 프로필</h2>
                    <p className="text-[10px] text-zinc-400 font-mono uppercase mt-1">MANAGE_YOUR_PROFILE</p>
                </div>
                {!isEditingProfile && (
                    <button 
                        onClick={() => setIsEditingProfile(true)} 
                        className="h-10 px-5 bg-zinc-900 hover:bg-black text-white shadow-md rounded-xl text-[10px] font-black transition-colors font-mono tracking-widest uppercase flex items-center gap-2"
                    >
                        <Settings size={14} /> 편집 켜기
                    </button>
                )}
            </div>

            {/* ====== 마이 프로필 헤더 ====== */}
            <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 mb-6">
                {/* 프로필 이미지 */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl relative bg-zinc-100 flex-shrink-0 group overflow-hidden">
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

                <div className="flex flex-col justify-center py-2 h-full gap-2">
                    <h1 className="text-2xl font-black tracking-tight">{profile?.userName || 'Unknown'}</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <span className={`inline-block px-3 py-1 text-[10px] font-black tracking-widest font-mono uppercase rounded-full border ${profile?.isActive ? 'bg-[#7A4FFF]/10 text-[#7A4FFF] border-[#7A4FFF]/20' : 'bg-red-50 text-red-500 border-red-100'}`}>
                            {profile?.isActive ? '활동중 (ACTIVE)' : '휴식중 (REST)'}
                        </span>

                        {/* 상태 변경 토글 스위치 */}
                        <button 
                            onClick={handleToggleStatus}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7A4FFF] focus:ring-offset-2 hover:opacity-80 shadow-sm ${profile?.isActive ? 'bg-[#7A4FFF]' : 'bg-zinc-300'}`}
                            role="switch"
                            aria-checked={profile?.isActive}
                            type="button"
                        >
                            <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profile?.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
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
                                <select 
                                    value={editProfileData.location} 
                                    onChange={e => setEditProfileData({ ...editProfileData, location: e.target.value })} 
                                    className="w-full bg-white p-4 rounded-xl border border-zinc-200 outline-none focus:border-[#7A4FFF] hover:border-[#7A4FFF]/50 text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-[#7A4FFF]/10"
                                >
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
                                <select 
                                    value={editProfileData.workStyle} 
                                    onChange={e => setEditProfileData({ ...editProfileData, workStyle: e.target.value })} 
                                    className="w-full bg-white p-4 rounded-xl border border-zinc-200 outline-none focus:border-[#7A4FFF] hover:border-[#7A4FFF]/50 text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-[#7A4FFF]/10"
                                >
                                    <option value="ONLINE">온라인 (ONLINE)</option>
                                    <option value="OFFLINE">오프라인 (OFFLINE)</option>
                                    <option value="HYBRID">하이브리드 (HYBRID)</option>
                                </select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">소개글</label>
                                <textarea 
                                    rows={4} 
                                    value={editProfileData.introduction} 
                                    onChange={e => setEditProfileData({ ...editProfileData, introduction: e.target.value })} 
                                    className="w-full bg-white p-4 rounded-xl border border-zinc-200 outline-none focus:border-[#7A4FFF] hover:border-[#7A4FFF]/50 text-sm font-bold shadow-sm transition-all resize-none focus:ring-4 focus:ring-[#7A4FFF]/10" 
                                    placeholder="자신의 강점을 어필해주세요." 
                                />
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
                        <button 
                            onClick={() => { 
                                setIsEditingProfile(false); 
                                setMySkillIds((profile?.skills || []).map((s: any) => s.skillId || s.id)); 
                                setValidationError(''); 
                            }} 
                            className="flex-[1] py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl text-sm font-black transition-colors"
                        >
                            취소
                        </button>
                        <button 
                            onClick={handleProfileAndSkillUpdate} 
                            className="flex-[2] py-4 bg-[#7A4FFF] hover:bg-purple-600 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        >
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
    );
}
