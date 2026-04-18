'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Settings, LogOut, ChevronRight, Phone, Landmark, Globe, FileText, CheckCircle2, Save, X, Loader2, Upload } from 'lucide-react';
import { logout } from '@/app/lib/authEvents';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';

interface SettingsTabProps {
    onUpdateSuccess: (updatedData: any) => void;
}

export default function SettingsTab({ onUpdateSuccess }: SettingsTabProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBnVerified, setIsBnVerified] = useState(false);
    const [isLogoUploading, setIsLogoUploading] = useState(false);
    const logoFileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        nickname: '',
        phoneNum: '',
        representativeName: '',
        companyName: '',
        bn: '',
        homepageUrl: '',
        introduction: '',
        logoUrl: '',
        grade: '',
        verificationStatus: '',
        rating: 0,
        totalProjects: 0
    });

    const [originalData, setOriginalData] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/client/profile');
            const profileData = {
                nickname: data.nickname || '',
                phoneNum: data.phoneNum || '',
                representativeName: data.representativeName || '',
                companyName: data.companyName || '',
                bn: data.bn || '',
                homepageUrl: data.homepageUrl || '',
                introduction: data.introduction || '',
                logoUrl: data.logoUrl || '',
                grade: data.grade || 'NORMAL',
                verificationStatus: data.verificationStatus || 'PENDING',
                rating: data.rating || 0,
                totalProjects: data.totalProjects || 0
            };
            setFormData(profileData);
            setOriginalData(profileData);
            if (data.bn?.match(/^\d{3}-\d{2}-\d{5}$/)) setIsBnVerified(true);
        } catch (err) {
            console.error("데이터 로드 실패", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLogoUploading(true);
        const uploadForm = new FormData();
        uploadForm.append('file', file);

        try {
            const { data } = await api.post('/images/portfolio', uploadForm);
            setFormData(prev => ({ ...prev, logoUrl: data.imageUrl }));
            alert('로고 이미지가 업로드되었습니다. 저장 버튼을 눌러야 반영됩니다.');
        } catch (err) {
            alert('이미지 업로드 실패');
        } finally {
            setIsLogoUploading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBnCheck = () => {
        if (formData.bn.match(/^\d{3}-\d{2}-\d{5}$/)) {
            setIsBnVerified(true);
            alert("사업자 번호가 인증되었습니다.");
        } else {
            alert("사업자번호 형식을 확인해주세요. (000-00-00000)");
            setIsBnVerified(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBnVerified && (formData.bn || formData.companyName)) {
            alert("사업자 번호 인증이 필요합니다.");
            return;
        }
        setIsSubmitting(true);
        try {
            await api.put('/client/profile', formData);
            alert("정보가 성공적으로 수정되었습니다.");
            setOriginalData(formData);
            onUpdateSuccess(formData);
            setIsEditing(false);
        } catch (err) {
            alert("수정 실패: 양식을 확인해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="py-24 flex flex-col items-center justify-center gap-4 text-zinc-400 font-mono text-xs animate-pulse"><Loader2 className="animate-spin text-[#FF7D00]" /> LOADING_SETTINGS...</div>;

    return (
        <div className="space-y-12">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-sm font-black uppercase font-mono tracking-[0.3em] text-zinc-400">Account Settings</h2>
                    <p className="text-[10px] text-zinc-400 font-mono uppercase mt-1 italic">Manage your identity and business profile</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl text-xs font-black tracking-widest hover:bg-[#FF7D00] transition-all shadow-xl shadow-zinc-200 uppercase font-mono"
                    >
                        <Settings size={14} /> Edit_Profile
                    </button>
                )}
            </div>

            {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 프로필 이미지(로고) 요약 */}
                    <div className="md:col-span-2 bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
                        <div className="w-24 h-24 rounded-[2rem] bg-zinc-50 border-4 border-white shadow-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {originalData?.logoUrl ? (
                                <img src={originalData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <User className="text-zinc-200" size={40} />
                            )}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                                <h3 className="text-2xl font-black text-zinc-900 tracking-tighter">{originalData?.companyName || originalData?.nickname}</h3>
                                {originalData?.verificationStatus === 'VERIFIED' && (
                                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black rounded-full border border-green-100 flex items-center gap-1"><CheckCircle2 size={10} /> VERIFIED_BUSINESS</span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-400 font-medium uppercase font-mono tracking-widest italic">{originalData?.representativeName || 'REPRESENTATIVE_PENDING'}</p>
                        </div>

                        {/* 📊 미니 통계 바 */}
                        <div className="flex gap-4 p-2 bg-zinc-50 rounded-3xl border border-zinc-100">
                            <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-zinc-100 text-center min-w-[100px]">
                                <p className="text-[9px] font-black text-zinc-400 uppercase font-mono mb-1">Grade</p>
                                <p className="text-sm font-black text-[#FF7D00] font-mono">{originalData?.grade}</p>
                            </div>
                            <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-zinc-100 text-center min-w-[100px]">
                                <p className="text-[9px] font-black text-zinc-400 uppercase font-mono mb-1">Projects</p>
                                <p className="text-sm font-black text-zinc-900 font-mono">{originalData?.totalProjects}</p>
                            </div>
                            <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-zinc-100 text-center min-w-[100px]">
                                <p className="text-[9px] font-black text-zinc-400 uppercase font-mono mb-1">Rating</p>
                                <p className="text-sm font-black text-zinc-900 font-mono">★ {originalData?.rating?.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>

                    {/* 소개글 요약 */}
                    <div className="md:col-span-2 bg-zinc-50 rounded-[2.5rem] p-10 border border-zinc-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-200/50 pb-4">
                            <p className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-widest flex items-center gap-2"><FileText size={14} className="text-[#FF7D00]" /> Company_Introduction</p>
                            {originalData?.homepageUrl && (
                                <a href={originalData.homepageUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black text-[#7A4FFF] hover:underline flex items-center gap-1 font-mono uppercase tracking-widest"><Globe size={12} /> Website</a>
                            )}
                        </div>
                        <p className="text-sm text-zinc-600 leading-relaxed font-medium italic">"{originalData?.introduction || '회사 소개가 등록되지 않았습니다.'}"</p>
                    </div>

                    {/* 개인 정보 요약 */}
                    <div className="bg-zinc-50 rounded-[2.5rem] p-10 border border-zinc-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-200/50">
                            <div className="p-3 bg-orange-100 rounded-2xl text-[#FF7D00]"><User size={20} /></div>
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">개인 프로필</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-widest mb-1">Nickname</p>
                                <p className="font-black text-zinc-800 text-lg">{originalData?.nickname || '미설정'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-widest mb-1">Contact</p>
                                <p className="font-black text-zinc-800 text-lg">{originalData?.phoneNum || '미설정'}</p>
                            </div>
                        </div>
                    </div>

                    {/* 기업 정보 요약 */}
                    <div className="bg-zinc-50 rounded-[2.5rem] p-10 border border-zinc-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-200/50">
                            <div className="p-3 bg-purple-100 rounded-2xl text-[#7A4FFF]"><Landmark size={20} /></div>
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">기업 정보</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-widest mb-1">Company_Name</p>
                                <p className="font-black text-zinc-800 text-lg">{originalData?.companyName || '미설정'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-widest mb-1">Business_No</p>
                                <p className="font-mono font-black text-zinc-800 text-lg">{originalData?.bn || '미설정'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 pt-8 border-t border-zinc-100 flex justify-end">
                        <button
                            onClick={() => { logout(); router.push('/login'); }}
                            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest font-mono hover:bg-red-100 transition-all"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* 로고 업로드 섹션 */}
                    <div className="bg-zinc-50 rounded-[3rem] p-8 md:p-10 border border-zinc-200 shadow-inner flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group w-32 h-32 flex-shrink-0">
                            <div className="w-full h-full rounded-[2.5rem] bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                                {isLogoUploading ? (
                                    <Loader2 className="animate-spin text-[#FF7D00]" size={32} />
                                ) : formData.logoUrl ? (
                                    <img src={formData.logoUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="text-zinc-100" size={48} />
                                )}
                            </div>
                            <label className="absolute inset-0 bg-black/60 rounded-[2.5rem] flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload size={24} className="mb-1" />
                                <span className="text-[9px] font-black font-mono">CHANGE</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isLogoUploading} />
                            </label>
                        </div>
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-black text-zinc-900 tracking-tighter mb-2">기업 로고 변경</h3>
                            <p className="text-sm text-zinc-500 font-medium leading-relaxed">회사를 상징하는 로고를 업로드해주세요.<br /><span className="text-[#FF7D00]">DevNear</span> 활동 시 프로필 이미지로 사용됩니다.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* 개인 정보 수정 섹션 */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b-2 border-[#FF7D00]/20">
                                <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] font-mono italic">Personal_Profile</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-black text-zinc-400 uppercase font-mono mb-2 tracking-[0.2em] flex items-center gap-2">
                                        <User size={12} className="text-[#FF7D00]" /> Nickname *
                                    </label>
                                    <input type="text" required value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:border-[#FF7D00] outline-none transition-all shadow-inner" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-zinc-400 uppercase font-mono mb-2 tracking-[0.2em] flex items-center gap-2">
                                        <Phone size={12} className="text-[#FF7D00]" /> Phone_Number *
                                    </label>
                                    <input type="tel" required value={formData.phoneNum} onChange={(e) => setFormData({ ...formData, phoneNum: e.target.value })} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:border-[#FF7D00] outline-none transition-all shadow-inner" placeholder="010-0000-0000" />
                                </div>
                            </div>
                        </div>

                        {/* 기업 정보 수정 섹션 */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b-2 border-purple-200">
                                <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] font-mono italic">Business_Identity</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-zinc-400 uppercase font-mono mb-2 tracking-[0.2em]">Representative</label>
                                        <input type="text" value={formData.representativeName} onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })} className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold focus:border-[#7A4FFF] outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-zinc-400 uppercase font-mono mb-2 tracking-[0.2em]">Company_Name</label>
                                        <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold focus:border-[#7A4FFF] outline-none transition-all" />
                                    </div>
                                </div>

                                <div className="p-6 bg-purple-50/50 rounded-[2rem] border border-purple-100">
                                    <label className="block text-[11px] font-black text-[#7A4FFF] uppercase font-mono mb-3 tracking-[0.2em] flex justify-between items-center">
                                        <span className="flex items-center gap-2"><Landmark size={12} /> Business_No</span>
                                        {isBnVerified && <span className="text-green-600 flex items-center gap-1 font-black text-[9px] bg-white px-2 py-0.5 rounded-full border border-green-100 shadow-sm"><CheckCircle2 size={12} /> VERIFIED</span>}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="000-00-00000"
                                            value={formData.bn}
                                            onChange={(e) => { setFormData({ ...formData, bn: e.target.value }); setIsBnVerified(false); }}
                                            className={`flex-[3] px-5 py-3.5 bg-white border ${isBnVerified ? 'border-green-300' : 'border-zinc-200'} rounded-xl text-sm font-mono font-black tracking-widest focus:border-[#7A4FFF] outline-none shadow-inner`}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleBnCheck}
                                            className={`flex-1 min-w-[80px] py-3.5 rounded-xl text-[10px] font-black transition-all ${isBnVerified ? 'bg-green-500 text-white cursor-default' : 'bg-zinc-900 text-white hover:bg-[#7A4FFF]'}`}
                                        >
                                            {isBnVerified ? '인증됨' : '인증'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-zinc-400 uppercase font-mono mb-2 tracking-[0.2em] flex items-center gap-2">
                                        <Globe size={12} className="text-[#7A4FFF]" /> Official_Website
                                    </label>
                                    <input type="url" placeholder="https://..." value={formData.homepageUrl} onChange={(e) => setFormData({ ...formData, homepageUrl: e.target.value })} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:border-[#7A4FFF] outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-black text-zinc-400 uppercase font-mono mb-2 tracking-[0.2em] flex items-center gap-2">
                                <FileText size={12} className="text-[#FF7D00]" /> Company_Introduction
                            </label>
                            <textarea rows={4} placeholder="회사 소개글을 입력하세요." value={formData.introduction} onChange={(e) => setFormData({ ...formData, introduction: e.target.value })} className="w-full px-8 py-6 bg-zinc-50 border border-zinc-200 rounded-[2.5rem] text-sm font-medium focus:border-[#FF7D00] outline-none resize-none shadow-inner leading-relaxed" />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-10 border-t border-zinc-100">
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setFormData(originalData);
                                setIsBnVerified(originalData.bn?.match(/^\d{3}-\d{2}-\d{5}$/) ? true : false);
                            }}
                            className="flex-1 py-5 bg-zinc-100 text-zinc-500 rounded-3xl font-black text-xs uppercase tracking-widest font-mono hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                        >
                            <X size={16} /> Cancel_Changes
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (!!formData.bn && !isBnVerified) || isLogoUploading}
                            className={`flex-[2] py-5 rounded-3xl text-white font-black text-xs uppercase tracking-widest font-mono shadow-xl transition-all flex items-center justify-center gap-2 ${isSubmitting || (!!formData.bn && !isBnVerified) || isLogoUploading ? 'bg-zinc-200 cursor-not-allowed shadow-none text-zinc-400' : 'bg-zinc-950 hover:bg-[#FF7D00] shadow-zinc-200 hover:-translate-y-1'}`}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            {isSubmitting ? 'UPDATING...' : 'Confirm_and_Save'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
