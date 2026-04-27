'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Settings, Phone, Landmark, Globe, FileText, CheckCircle2, Save, Loader2, Upload, Activity } from 'lucide-react';
import api from '@/app/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { dnAlert } from '@/lib/swal';

interface SettingsTabProps {
    onUpdateSuccess: (updatedData: any) => void;
}

export default function SettingsTab({ onUpdateSuccess }: SettingsTabProps) {
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
            await dnAlert('로고 이미지가 업로드되었습니다. 저장 버튼을 눌러야 반영됩니다.', 'success');
        } catch (err) {
            await dnAlert('이미지 업로드 실패', 'error');
        } finally {
            setIsLogoUploading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBnCheck = async () => {
        // 사업자번호 형식만 검증 (실제 인증은 제출 시 서버에서 수행됨)
        if (formData.bn.match(/^\d{3}-\d{2}-\d{5}$/)) {
            setIsBnVerified(true);
            await dnAlert("사업자번호 형식이 확인되었습니다. 실제 상세 인증은 저장 시 서버에서 처리됩니다.", 'success');
        } else {
            await dnAlert("사업자번호 형식을 확인해주세요. (000-00-00000)", 'warning');
            setIsBnVerified(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put('/client/profile', formData);
            await dnAlert("회원 정보가 수정되었습니다.", 'success');
            setOriginalData(formData);
            onUpdateSuccess(formData);
            setIsEditing(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            await dnAlert("수정 실패: 양식을 확인해주세요.", 'error');
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
        <div className="space-y-12">
            <AnimatePresence mode="wait">
                {!isEditing ? (
                    <motion.div 
                        key="view"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-10"
                    >
                        {/* 🏆 Profile Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                            <div className="flex items-center gap-8">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-zinc-100 shadow-2xl shadow-zinc-200/50 overflow-hidden flex-shrink-0 flex items-center justify-center relative group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF7D00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {originalData?.logoUrl ? (
                                        <img src={originalData.logoUrl} alt="Logo" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <User size={36} className="text-zinc-200" />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-5xl font-black tracking-tighter text-zinc-900 leading-none">
                                            {originalData?.companyName || originalData?.nickname || '클라이언트'}
                                        </h2>
                                        {originalData?.verificationStatus === 'VERIFIED' && (
                                            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                                                <CheckCircle2 size={12} /> 공식 인증 파트너
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-[#FF7D00] font-black tracking-[0.2em] uppercase flex items-center gap-2">
                                        <Activity size={12} className="animate-pulse" /> {originalData?.grade || 'NORMAL'} CLASS CLIENT
                                    </p>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => { setIsEditing(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="h-14 px-10 bg-zinc-900 hover:bg-[#FF7D00] text-white shadow-2xl shadow-zinc-200 rounded-[1.5rem] text-[13px] font-black transition-all flex items-center gap-3 group active:scale-95"
                            >
                                <Settings size={16} className="group-hover:rotate-180 transition-transform duration-700" /> 프로필 상세 관리
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 📝 Business Vision Section */}
                            <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-xl shadow-zinc-200/40 relative overflow-hidden group transition-all hover:shadow-zinc-200/60 md:col-span-2">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FF7D00]/20" />
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center justify-between border-b border-zinc-50 pb-5">
                                        <p className="text-sm font-black text-[#FF7D00] tracking-[0.1em] uppercase">
                                            비즈니스 가치 소개
                                        </p>
                                        {originalData?.homepageUrl && (
                                            <a href={originalData.homepageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-[#FF7D00] transition-colors">
                                                <Globe size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">OFFICIAL WEB</span>
                                            </a>
                                        )}
                                    </div>
                                    <blockquote className="text-base md:text-[18px] text-zinc-700 leading-[1.8] font-medium tracking-tight">
                                        {originalData?.introduction ? (
                                            `"${originalData.introduction}"`
                                        ) : (
                                            <span className="text-zinc-300 italic">아직 등록된 비즈니스 소개글이 없습니다. 기업의 비전과 가치를 프리랜서들에게 공유해주세요.</span>
                                        )}
                                    </blockquote>
                                </div>
                            </div>

                            {/* 🏛️ Official Info Card */}
                            <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-xl shadow-zinc-200/40 space-y-8 transition-all hover:shadow-zinc-200/60">
                                <div className="flex items-center justify-between border-b border-zinc-50 pb-5">
                                    <p className="text-sm font-black text-[#FF7D00] tracking-[0.1em] uppercase">
                                        기업 공식 등록 정보
                                    </p>
                                    <Landmark size={16} className="text-zinc-200" />
                                </div>
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">법인명/기업명</span>
                                            <p className="font-black text-zinc-950 text-xl tracking-tight leading-none">{originalData?.companyName || '미설정'}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">대표자 이름</span>
                                            <p className="font-black text-zinc-950 text-xl tracking-tight leading-none">{originalData?.representativeName || '미설정'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 pt-6 border-t border-zinc-50">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">사업자 등록번호</span>
                                        <p className="font-black text-zinc-950 text-2xl tracking-[0.05em] font-mono leading-none">{originalData?.bn || '미설정'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 👤 Partner Contact Card */}
                            <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-xl shadow-zinc-200/40 space-y-8 transition-all hover:shadow-zinc-200/60">
                                <div className="flex items-center justify-between border-b border-zinc-50 pb-5">
                                    <p className="text-sm font-black text-[#FF7D00] tracking-[0.1em] uppercase">
                                        파트너 담당자 정보
                                    </p>
                                    <User size={16} className="text-zinc-200" />
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">활동 닉네임</span>
                                        <p className="font-black text-zinc-950 text-xl tracking-tight leading-none">{originalData?.nickname || '미설정'}</p>
                                    </div>
                                    <div className="space-y-1.5 pt-6 border-t border-zinc-50">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">직통 연락처</span>
                                        <p className="font-black text-zinc-950 text-2xl tracking-[0.05em] font-mono leading-none">{originalData?.phoneNum || '미설정'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.form 
                        key="edit"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onSubmit={handleSubmit}
                        className="space-y-10"
                    >
                        {/* 📸 Edit Header */}
                        <div className="bg-orange-50/30 rounded-[3rem] p-8 border border-orange-100/50 flex flex-col md:flex-row items-center gap-10 shadow-sm">
                            <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-2xl relative bg-zinc-100 flex-shrink-0 group overflow-hidden">
                                {isLogoUploading ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/10 backdrop-blur-sm z-20">
                                        <Loader2 className="animate-spin text-[#FF7D00] mb-2" size={24} />
                                        <span className="text-[10px] font-black text-[#FF7D00] tracking-widest">UPLOADING</span>
                                    </div>
                                ) : formData.logoUrl ? (
                                    <img src={formData.logoUrl} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-200">
                                        <User size={48} />
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-zinc-900/80 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-10">
                                    <Upload size={24} className="mb-2 transform -translate-y-2 group-hover:translate-y-0 transition-transform" />
                                    <span className="text-[10px] font-black tracking-widest">CHANGE LOGO</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isLogoUploading} />
                                </label>
                            </div>
                            <div className="text-center md:text-left space-y-3">
                                <h3 className="text-2xl font-black text-zinc-900 tracking-tight">클라이언트 프로필 커스터마이징</h3>
                                <p className="text-[13px] text-zinc-500 font-medium leading-relaxed max-w-md">기업을 상징하는 공식 로고를 업로드하고 정보를 업데이트하세요.<br />신뢰도 높은 프로필은 더 우수한 프리랜서와의 매칭으로 이어집니다.</p>
                            </div>
                        </div>

                        {/* ⌨️ Edit Form */}
                        <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-zinc-100 shadow-2xl shadow-zinc-200/40 space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black tracking-[0.1em] uppercase text-zinc-400 pl-1">활동 닉네임</label>
                                    <input type="text" required value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} className="w-full bg-zinc-50/50 px-6 py-5 rounded-[1.5rem] border border-zinc-100 outline-none focus:border-[#FF7D00] focus:bg-white text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-[#FF7D00]/5" placeholder="담당자 닉네임을 입력하세요." />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black tracking-[0.1em] uppercase text-zinc-400 pl-1">담당자 연락처</label>
                                    <input type="tel" required value={formData.phoneNum} onChange={(e) => setFormData({ ...formData, phoneNum: e.target.value })} className="w-full bg-zinc-50/50 px-6 py-5 rounded-[1.5rem] border border-zinc-100 outline-none focus:border-[#FF7D00] focus:bg-white text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-[#FF7D00]/5 font-mono" placeholder="010-0000-0000" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black tracking-[0.1em] uppercase text-zinc-400 pl-1">대표자 성함</label>
                                    <input type="text" value={formData.representativeName} onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })} className="w-full bg-zinc-50/50 px-6 py-5 rounded-[1.5rem] border border-zinc-100 outline-none focus:border-[#FF7D00] focus:bg-white text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-[#FF7D00]/5" placeholder="공식 대표자 이름을 입력하세요." />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black tracking-[0.1em] uppercase text-zinc-400 pl-1">법인 및 기업명</label>
                                    <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="w-full bg-zinc-50/50 px-6 py-5 rounded-[1.5rem] border border-zinc-100 outline-none focus:border-[#FF7D00] focus:bg-white text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-[#FF7D00]/5" placeholder="공식 기업명을 입력하세요." />
                                </div>
                                
                                <div className="space-y-3 md:col-span-2 pt-6 border-t border-zinc-50">
                                    <label className="text-[11px] font-black tracking-[0.1em] uppercase text-[#FF7D00] pl-1">사업자 등록번호 인증</label>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <input
                                            type="text"
                                            placeholder="000-00-00000"
                                            value={formData.bn}
                                            onChange={(e) => { setFormData({ ...formData, bn: e.target.value }); setIsBnVerified(false); }}
                                            className={`flex-[3] bg-zinc-50/50 px-6 py-5 rounded-[1.5rem] border ${isBnVerified ? 'border-emerald-300 bg-emerald-50/30' : 'border-zinc-100'} outline-none focus:border-[#FF7D00] text-sm font-mono font-black tracking-widest shadow-sm transition-all`}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleBnCheck}
                                            className={`flex-1 min-h-[60px] rounded-[1.5rem] text-[11px] font-black transition-all uppercase tracking-widest ${isBnVerified ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-zinc-900 text-white hover:bg-[#FF7D00] shadow-lg shadow-zinc-100 hover:shadow-[#FF7D00]/20'}`}
                                        >
                                            {isBnVerified ? '인증 완료' : '진위 확인'}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-medium pl-1">정확한 파트너 등급 산정을 위해 사업자 번호 인증이 권장됩니다.</p>
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black tracking-[0.1em] uppercase text-zinc-400 pl-1">공식 웹사이트 URL</label>
                                    <input type="url" placeholder="https://www.your-company.com" value={formData.homepageUrl} onChange={(e) => setFormData({ ...formData, homepageUrl: e.target.value })} className="w-full bg-zinc-50/50 px-6 py-5 rounded-[1.5rem] border border-zinc-100 outline-none focus:border-[#FF7D00] focus:bg-white text-sm font-medium shadow-sm transition-all focus:ring-4 focus:ring-[#FF7D00]/5" />
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                    <div className="flex items-center justify-between pl-1">
                                        <label className="text-[11px] font-black tracking-[0.1em] uppercase text-zinc-400">비즈니스 가치 소개</label>
                                    </div>
                                    <textarea rows={6} value={formData.introduction} onChange={(e) => setFormData({ ...formData, introduction: e.target.value })} className="w-full bg-zinc-50/50 px-6 py-6 rounded-[2rem] border border-zinc-100 outline-none focus:border-[#FF7D00] focus:bg-white text-sm font-medium shadow-sm transition-all focus:ring-4 focus:ring-[#FF7D00]/5 resize-none leading-relaxed" placeholder="기업의 미션과 프리랜서들에게 제공할 수 있는 가치를 설명해주세요." />
                                </div>
                            </div>
                        </div>

                        {/* 🎮 Actions */}
                        <div className="flex flex-col md:flex-row gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData(originalData);
                                    setIsBnVerified(originalData.bn?.match(/^\d{3}-\d{2}-\d{5}$/) ? true : false);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="flex-1 py-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-[1.5rem] text-sm font-black transition-all uppercase tracking-widest active:scale-95"
                            >
                                변경 취소
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || (!!formData.bn && !isBnVerified) || isLogoUploading}
                                className={`flex-[1.5] py-5 rounded-[1.5rem] text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${isSubmitting || (!!formData.bn && !isBnVerified) || isLogoUploading ? 'bg-zinc-200 cursor-not-allowed text-zinc-400 shadow-none' : 'bg-zinc-950 hover:bg-[#FF7D00] shadow-[#FF7D00]/10 hover:shadow-[#FF7D00]/20'}`}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {isSubmitting ? '데이터 동기화 중...' : '업데이트 완료'}
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}
