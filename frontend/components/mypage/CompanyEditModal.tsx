'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, Globe, FileText, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/app/lib/axios';

interface CompanyEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CompanyEditModal({ isOpen, onClose, onSuccess }: CompanyEditModalProps) {
    const [editForm, setEditForm] = useState({
        representativeName: '',
        companyName: '',
        bn: '',
        homepageUrl: '',
        introduction: '',
        nickname: '',
        phoneNum: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBnVerified, setIsBnVerified] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const { data } = await api.get('/client/profile');
                    // [AI 리뷰 반영] 서버 데이터로 전체를 덮어쓰지 않고, 기존 상태 구조를 유지하며 병합합니다.
                    setEditForm(prev => ({
                        ...prev,
                        ...data,
                        // 만약 서버에서 nickname이 오지 않았다면 이전 값이나 빈 문자열을 유지
                        nickname: data.nickname || prev.nickname || '',
                        phoneNum: data.phoneNum || prev.phoneNum || ''
                    }));
                    if (data.bn?.match(/^\d{3}-\d{2}-\d{5}$/)) setIsBnVerified(true);
                } catch (err) { console.error("데이터 로드 실패", err); }
            };
            fetchData();
        }
    }, [isOpen]);

    const handleBnCheck = () => {
        if (editForm.bn.match(/^\d{3}-\d{2}-\d{5}$/)) {
            setIsBnVerified(true);
            alert("사업자 번호가 인증되었습니다.");
        } else {
            alert("사업자번호 형식을 확인해주세요. (000-00-00000)");
            setIsBnVerified(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBnVerified) { alert("사업자 번호 인증이 필요합니다."); return; }
        setIsSubmitting(true);
        try {
            await api.put('/client/profile', editForm);
            alert("기업 정보가 성공적으로 수정되었습니다.");
            onSuccess();
            onClose();
        } catch (err) { alert("수정 실패: 양식을 확인해주세요."); }
        finally { setIsSubmitting(false); }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
                    >
                        <button onClick={onClose} className="absolute top-8 right-8 text-zinc-400 hover:text-zinc-900 transition-colors"><X className="w-6 h-6" /></button>

                        <h2 className="text-2xl font-black tracking-tight mb-2 text-[#FF7D00]">기업 정보 수정</h2>
                        <p className="text-sm text-zinc-500 mb-10 font-medium font-mono uppercase tracking-tighter">System_Business_Identity_Management</p>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* 대표자 성함 & 회사명 (그리드로 배치) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[11px] font-black text-zinc-400 uppercase font-mono mb-2 tracking-[0.2em]">Representative *</label>
                                    <input type="text" required value={editForm.representativeName} onChange={(e)=>setEditForm({...editForm, representativeName: e.target.value})} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold focus:border-[#FF7D00] outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-zinc-400 uppercase font-mono mb-2 tracking-[0.2em]">Company_Name *</label>
                                    <input type="text" required value={editForm.companyName} onChange={(e)=>setEditForm({...editForm, companyName: e.target.value})} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold focus:border-[#FF7D00] outline-none transition-all" />
                                </div>
                            </div>

                            {/* 🔍 사업자 번호 (단독 행 배치로 시원하게 확장!) */}
                            <div className="bg-orange-50/30 p-6 rounded-[2rem] border border-orange-100">
                                <label className="block text-[11px] font-black text-[#FF7D00] uppercase font-mono mb-3 tracking-[0.2em] flex justify-between items-center">
                                    <span className="flex items-center gap-2"><Landmark className="w-3.5 h-3.5" /> Business_Registration_Number *</span>
                                    {isBnVerified && <span className="text-green-600 flex items-center gap-1 font-black"><CheckCircle2 className="w-3.5 h-3.5"/> VERIFIED</span>}
                                </label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text" required placeholder="000-00-00000"
                                        value={editForm.bn}
                                        onChange={(e)=>{setEditForm({...editForm, bn: e.target.value}); setIsBnVerified(false);}}
                                        className={`flex-[3] px-6 py-4 bg-white border ${isBnVerified ? 'border-green-300' : 'border-zinc-200'} rounded-2xl text-lg font-mono font-black tracking-widest focus:border-[#FF7D00] outline-none shadow-inner transition-all`}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleBnCheck}
                                        className={`flex-1 min-w-[100px] py-4 rounded-2xl text-xs font-black transition-all shadow-md ${isBnVerified ? 'bg-green-500 text-white cursor-default' : 'bg-zinc-900 text-white hover:bg-[#FF7D00] active:scale-95'}`}
                                    >
                                        {isBnVerified ? '인증완료' : '번호인증'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-3 font-medium px-1">하이픈(-)을 포함한 10자리 숫자를 정확히 입력해주세요.</p>
                            </div>

                            {/* 홈페이지 URL */}
                            <div>
                                <label className="block text-[11px] font-black text-zinc-400 uppercase font-mono mb-2 tracking-[0.2em] flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-[#FF7D00]" /> Official_Website
                                </label>
                                <input type="url" placeholder="https://..." value={editForm.homepageUrl} onChange={(e)=>setEditForm({...editForm, homepageUrl: e.target.value})} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:border-[#FF7D00] outline-none transition-all" />
                            </div>

                            {/* 회사 소개 */}
                            <div>
                                <label className="block text-[11px] font-black text-zinc-400 uppercase font-mono mb-2 tracking-[0.2em] flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-[#FF7D00]" /> Company_Introduction
                                </label>
                                <textarea rows={3} placeholder="회사 소개글을 입력하세요." value={editForm.introduction} onChange={(e)=>setEditForm({...editForm, introduction: e.target.value})} className="w-full px-6 py-5 bg-zinc-50 border border-zinc-100 rounded-[2rem] text-sm font-medium focus:border-[#FF7D00] outline-none resize-none transition-all" />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !isBnVerified}
                                className={`w-full py-5 rounded-[1.8rem] text-white font-black text-sm tracking-[0.2em] shadow-xl transition-all uppercase font-mono ${isSubmitting || !isBnVerified ? 'bg-zinc-200 cursor-not-allowed shadow-none text-zinc-400' : 'bg-[#FF7D00] shadow-orange-200 hover:brightness-110 hover:-translate-y-1 active:translate-y-0'}`}
                            >
                                {isSubmitting ? 'Processing...' : isBnVerified ? 'Confirm_and_Update' : 'Verify_Registration_First'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
