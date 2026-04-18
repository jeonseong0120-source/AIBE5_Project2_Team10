'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Settings, LogOut, Phone, Landmark, Globe, FileText, CheckCircle2, Save, X, Loader2, Upload, Activity } from 'lucide-react';
import { logout } from '@/app/lib/authEvents';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';

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
        setIsSubmitting(true);
        try {
            await api.put('/client/profile', formData);
            alert("회원 정보가 수정되었습니다.");
            setOriginalData(formData);
            onUpdateSuccess(formData);
            setIsEditing(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            alert("수정 실패: 양식을 확인해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-zinc-400 font-mono text-xs animate-pulse">
            <Loader2 className="animate-spin text-[#FF7D00]" /> 
            SYNCING_ACCOUNT_DATA...
        </div>
    );

    return (
        <div className="space-y-8">
            <AnimatePresence mode="wait">
                {!isEditing ? (
                    <motion.div 
                        key="view"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-10"
                    >
                        {/* 🏆 SAME HEADER AS FREELANCER MYPAGE */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[2rem] bg-zinc-100 border-4 border-white shadow-xl overflow-hidden flex-shrink-0">
                                    {originalData?.logoUrl ? (
                                        <img src={originalData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                            <User size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-3xl font-black tracking-tighter text-zinc-900">
                                            {originalData?.companyName || originalData?.nickname}
                                        </h2>
                                        {originalData?.verificationStatus === 'VERIFIED' && (
                                            <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[9px] font-black rounded-full border border-green-100 flex items-center gap-1 shadow-sm">
                                                <CheckCircle2 size={10} /> VERIFIED
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-[#FF7D00] font-mono font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                        <Activity size={12} className="animate-pulse" /> {originalData?.grade || 'NORMAL'}_GRADE_CLIENT
                                    </p>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => { setIsEditing(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="h-12 px-6 bg-zinc-950 hover:bg-[#FF7D00] text-white shadow-xl shadow-zinc-200 rounded-2xl text-xs font-black transition-all font-mono tracking-widest uppercase flex items-center gap-2 group"
                            >
                                <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" /> 프로필 편집하기
                            </button>
                        </div>

                        {/* 📝 기업 소개글 (Moved Up) */}
                        <div className="bg-zinc-50 rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm space-y-4">
                            <p className="text-[10px] font-black font-mono uppercase text-[#FF7D00] tracking-widest mb-2 border-b border-zinc-200/50 pb-3 flex items-center gap-2">
                                <FileText size={14} /> 기업 소개글
                                {originalData?.homepageUrl && (
                                    <a href={originalData.homepageUrl} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 hover:text-zinc-600 transition-colors">
                                        <Globe size={12} /> <span className="text-[9px] lowercase italic">website_visit</span>
                                    </a>
                                )}
                            </p>
                            <p className="text-sm text-zinc-700 leading-relaxed italic font-medium">
                                "{originalData?.introduction || '작성된 소개글이 없습니다.'}"
                            </p>
                        </div>

                        {/* 📝 기업 인증 및 대표 정보 */}
                        <div className="bg-zinc-50 rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm space-y-5">
                            <p className="text-[10px] font-black font-mono uppercase text-[#FF7D00] tracking-widest mb-2 border-b border-zinc-200/50 pb-3 flex items-center gap-2">
                                <Landmark size={14} /> 기업 인증 및 대표 정보
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">사업자명</span>
                                    <span className="font-black text-zinc-900 text-lg">{originalData?.companyName || '미설정'}</span>
                                </div>
                                <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-zinc-200/50 pt-4 md:pt-0 md:pl-6">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">대표자 이름</span>
                                    <span className="font-black text-zinc-900 text-lg">{originalData?.representativeName || '미설정'}</span>
                                </div>
                                <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-zinc-200/50 pt-4 md:pt-0 md:pl-6">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Business No</span>
                                    <span className="font-black text-zinc-800 text-lg font-mono">{originalData?.bn || '미등록'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-50 rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm space-y-4">
                            <p className="text-[10px] font-black font-mono uppercase text-[#FF7D00] tracking-widest mb-2 border-b border-zinc-200/50 pb-3 flex items-center gap-2">
                                <Phone size={14} /> 개인 연락처 및 식별 정보
                            </p>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">닉네임</span>
                                    <span className="font-black text-zinc-900 text-lg">{originalData?.nickname || '미설정'}</span>
                                </div>
                                <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-zinc-200/50 pt-4 md:pt-0 md:pl-6">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">연락처</span>
                                    <span className="font-black text-zinc-900 text-lg font-mono">{originalData?.phoneNum || '미설정'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Logout Footer Style Same as Freelancer Push-aside buttons */}
                        <div className="pt-8 flex justify-end">
                            <button
                                onClick={() => { if(confirm('로그아웃 하시겠습니까?')) { logout(); router.push('/login'); } }}
                                className="px-8 py-4 rounded-xl bg-red-50 text-red-500 font-black text-[10px] uppercase font-mono tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-100"
                            >
                                <LogOut size={16} className="inline mr-2" /> Sign_Out
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.form 
                        key="edit"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleSubmit}
                        className="space-y-8"
                    >
                        {/* 📸 EDIT HEADER: SAME AS FREELANCER */}
                        <div className="bg-orange-50/50 rounded-[2rem] p-6 border border-orange-100 flex items-center gap-6 shadow-sm mb-6">
                            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg relative bg-zinc-100 flex-shrink-0 group overflow-hidden">
                                {isLogoUploading ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-200 animate-pulse">
                                        <Loader2 className="animate-spin text-[#FF7D00] mb-1" size={20} />
                                        <span className="text-[8px] font-mono font-black text-zinc-400">LOADING</span>
                                    </div>
                                ) : formData.logoUrl ? (
                                    <img src={formData.logoUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                        <User size={32} />
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Upload size={20} className="mb-1" />
                                    <span className="text-[9px] font-black font-mono">CHANGE</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isLogoUploading} />
                                </label>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-zinc-900 tracking-tight">기업 로고 업데이트</h3>
                                <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">회사를 상징하는 공식 로고를 업로드해주세요.<br />고급스러운 로고는 비즈니스의 첫인상입니다.</p>
                            </div>
                        </div>

                        {/* ⌨️ FORM GRID: SAME AS FREELANCER */}
                        <div className="bg-zinc-50 rounded-[2.5rem] p-8 md:p-10 border border-zinc-200 shadow-inner space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">관리자 닉네임</label>
                                    <input type="text" required value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} className="w-full bg-white p-5 rounded-2xl border border-zinc-200 outline-none focus:border-[#FF7D00] hover:border-[#FF7D00]/50 text-sm font-black shadow-sm transition-all focus:ring-4 focus:ring-[#FF7D00]/10" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">연락처</label>
                                    <input type="tel" required value={formData.phoneNum} onChange={(e) => setFormData({ ...formData, phoneNum: e.target.value })} className="w-full bg-white p-5 rounded-2xl border border-zinc-200 outline-none focus:border-[#FF7D00] hover:border-[#FF7D00]/50 text-sm font-black shadow-sm transition-all focus:ring-4 focus:ring-[#FF7D00]/10 font-mono" placeholder="010-0000-0000" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">대표자 명</label>
                                    <input type="text" value={formData.representativeName} onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })} className="w-full bg-white p-5 rounded-2xl border border-zinc-200 outline-none focus:border-[#FF7D00] hover:border-[#FF7D00]/50 text-sm font-black shadow-sm transition-all focus:ring-4 focus:ring-[#FF7D00]/10" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">법인명/기업명</label>
                                    <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="w-full bg-white p-5 rounded-2xl border border-zinc-200 outline-none focus:border-[#FF7D00] hover:border-[#FF7D00]/50 text-sm font-black shadow-sm transition-all focus:ring-4 focus:ring-[#FF7D00]/10" />
                                </div>
                                
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">사업자 등록번호</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="000-00-00000"
                                            value={formData.bn}
                                            onChange={(e) => { setFormData({ ...formData, bn: e.target.value }); setIsBnVerified(false); }}
                                            className={`flex-[3] bg-white p-5 rounded-2xl border ${isBnVerified ? 'border-green-300' : 'border-zinc-200'} outline-none focus:border-[#FF7D00] text-sm font-mono font-black tracking-widest shadow-sm transition-all`}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleBnCheck}
                                            className={`flex-1 min-w-[100px] rounded-2xl text-xs font-black transition-all ${isBnVerified ? 'bg-green-500 text-white' : 'bg-zinc-950 text-white hover:bg-[#FF7D00]'}`}
                                        >
                                            {isBnVerified ? '인증완료' : '번호인증'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">회사 웹사이트 (URL)</label>
                                    <input type="url" placeholder="https://..." value={formData.homepageUrl} onChange={(e) => setFormData({ ...formData, homepageUrl: e.target.value })} className="w-full bg-white p-5 rounded-2xl border border-zinc-200 outline-none focus:border-[#FF7D00] hover:border-[#FF7D00]/50 text-sm font-medium shadow-sm transition-all" />
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase font-black text-zinc-400">회사 소개글</label>
                                    <textarea rows={4} value={formData.introduction} onChange={(e) => setFormData({ ...formData, introduction: e.target.value })} className="w-full bg-white p-5 rounded-2xl border border-zinc-200 outline-none focus:border-[#FF7D00] hover:border-[#FF7D00]/50 text-sm font-medium shadow-sm transition-all resize-none leading-relaxed" placeholder="회사의 비전이나 강점을 설명해주세요." />
                                </div>
                            </div>
                        </div>

                        {/* SUBMIT BUTTONS: SAME AS FREELANCER */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData(originalData);
                                    setIsBnVerified(originalData.bn?.match(/^\d{3}-\d{2}-\d{5}$/) ? true : false);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="flex-[1] py-5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-[1.5rem] text-xs font-black transition-colors uppercase tracking-widest font-mono"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || (!!formData.bn && !isBnVerified) || isLogoUploading}
                                className={`flex-[2] py-5 rounded-[1.5rem] text-white font-black text-xs uppercase tracking-widest font-mono flex items-center justify-center gap-2 shadow-xl transition-all ${isSubmitting || (!!formData.bn && !isBnVerified) || isLogoUploading ? 'bg-zinc-300 cursor-not-allowed' : 'bg-zinc-950 hover:bg-[#FF7D00] hover:-translate-y-1'}`}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                {isSubmitting ? '수정 중...' : '설정 저장하기'}
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}
