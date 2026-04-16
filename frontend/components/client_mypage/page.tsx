'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/app/lib/axios';

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newNickname: string) => void;
}

export default function ProfileEditModal({ isOpen, onClose, onSuccess }: ProfileEditModalProps) {
    const [editForm, setEditForm] = useState({
        nickname: '',        // 🔍 이제 닉네임을 직접 수정합니다!
        phoneNum: '',
        representativeName: '', companyName: '', bn: '', homepageUrl: '', introduction: '' // 유지를 위한 필드
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const { data } = await api.get('/client/profile');
                    // [AI 리뷰 반영] 서버 데이터로 전체를 덮어쓰지 않고, 기존 상태 구조를 유지하며 병합합니다.
                    setEditForm(prev => ({
                        ...prev,
                        ...data,
                        nickname: data.nickname || prev.nickname || '',
                        phoneNum: data.phoneNum || prev.phoneNum || ''
                    }));
                } catch (err) { console.error(err); }
            };
            fetchData();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // ⚠️ 주의: 백엔드 PUT DTO에 nickname 필드가 있어야 저장됩니다!
            await api.put('/client/profile', editForm);
            alert("개인 프로필이 수정되었습니다.");
            onSuccess(editForm.nickname);
            onClose();
        } catch (err) { alert("수정 실패: 양식을 확인해주세요."); }
        finally { setIsSubmitting(false); }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
                        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900"><X className="w-6 h-6" /></button>
                        <h2 className="text-2xl font-black tracking-tight mb-2 text-[#FF7D00]">개인 프로필 편집</h2>
                        <p className="text-sm text-zinc-500 mb-8 font-medium">서비스에서 사용될 닉네임을 설정하세요.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-zinc-600 uppercase font-mono mb-2 tracking-widest flex items-center gap-2">
                                    <User className="w-3 h-3 text-[#FF7D00]" /> User_Nickname
                                </label>
                                <input type="text" required value={editForm.nickname} onChange={(e)=>setEditForm({...editForm, nickname: e.target.value})} className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:border-[#FF7D00] outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-600 uppercase font-mono mb-2 tracking-widest flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-[#FF7D00]" /> Contact_Number
                                </label>
                                <input type="tel" required value={editForm.phoneNum} onChange={(e)=>setEditForm({...editForm, phoneNum: e.target.value})} className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:border-[#FF7D00] outline-none transition-all" />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-2xl bg-[#FF7D00] text-white font-black text-sm tracking-widest shadow-lg hover:brightness-110 transition-all uppercase font-mono">
                                {isSubmitting ? 'Updating...' : 'Save_Profile'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
