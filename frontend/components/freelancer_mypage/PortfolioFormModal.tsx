'use client';

import { MAX_SELECTED_SKILLS } from '@/app/lib/skillLimits';
import api from '@/app/lib/axios';
import { useEffect, useState } from 'react';
import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Image as ImageIcon, Upload } from 'lucide-react';

type PortfolioFormState = {
    id: number | null | undefined;
    title: string;
    desc: string;
    thumbnailUrl: string;
    portfolioImages: string[];
    skills: number[];
};

type GlobalSkill = {
    id?: number;
    skillId?: number;
    name: string;
};

interface PortfolioFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    portfolioForm: PortfolioFormState;
    setPortfolioForm: Dispatch<SetStateAction<PortfolioFormState>>;
    portfolioSkillSearchQuery: string;
    setPortfolioSkillSearchQuery: (val: string) => void;
    allGlobalSkills: GlobalSkill[];
    isThumbUploading: boolean;
    isBulkUploading: boolean;
    thumbFileInputRef: RefObject<HTMLInputElement | null>;
    bulkFileInputRef: RefObject<HTMLInputElement | null>;
    handleThumbUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    handleBulkImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    removePortfolioImage: (idx: number) => void;
    togglePortfolioSkill: (id: number) => void;
    handleSavePortfolio: () => void;
}

type SuggestedSkill = {
    skillId: number;
    name: string;
    score: number;
};

export default function PortfolioFormModal({
    isOpen,
    onClose,
    portfolioForm,
    setPortfolioForm,
    portfolioSkillSearchQuery,
    setPortfolioSkillSearchQuery,
    allGlobalSkills,
    isThumbUploading,
    isBulkUploading,
    thumbFileInputRef,
    bulkFileInputRef,
    handleThumbUpload,
    handleBulkImageUpload,
    removePortfolioImage,
    togglePortfolioSkill,
    handleSavePortfolio
}: PortfolioFormModalProps) {
    const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);
    const [suggestError, setSuggestError] = useState<string | null>(null);
    const [suggestedSkills, setSuggestedSkills] = useState<SuggestedSkill[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setSuggestError(null);
            setSuggestedSkills([]);
            setIsSuggestingSkills(false);
        }
    }, [isOpen]);

    const handleSuggestPortfolioSkills = async () => {
        setSuggestError(null);
        setSuggestedSkills([]);
        const source = portfolioForm.desc?.trim() ?? '';
        if (!source) {
            setSuggestError('먼저 상세 설명을 입력해 주세요.');
            return;
        }
        setIsSuggestingSkills(true);
        try {
            const { data } = await api.post<SuggestedSkill[]>('/v1/skills/suggest', {
                text: source,
                context: 'portfolio',
                limit: Math.min(MAX_SELECTED_SKILLS, 20)
            });
            const suggestions = (data ?? []).filter((item) => Number.isFinite(item.skillId));
            if (suggestions.length === 0) {
                setSuggestError('추출된 추천 스킬이 없습니다.');
                return;
            }
            setSuggestedSkills(suggestions);
        } catch (err: unknown) {
            const message =
                typeof err === 'object' &&
                err !== null &&
                'response' in err &&
                typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                    : null;
            setSuggestError(message || '스킬 자동추출에 실패했습니다.');
        } finally {
            setIsSuggestingSkills(false);
        }
    };

    const applySuggestedSkill = (skillId: number) => {
        setPortfolioForm((prev) => {
            if (prev.skills.includes(skillId)) {
                setSuggestError('이미 선택된 기술입니다.');
                return prev;
            }
            if (prev.skills.length >= MAX_SELECTED_SKILLS) {
                setSuggestError(`사용 기술은 최대 ${MAX_SELECTED_SKILLS}개까지 선택할 수 있습니다.`);
                return prev;
            }
            return { ...prev, skills: [...prev.skills, skillId] };
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl relative"
                role="dialog"
                aria-modal="true"
                aria-labelledby="portfolio-modal-title"
            >
                <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 transition-colors bg-zinc-100 p-2 rounded-full" aria-label="Close modal"><X size={20} /></button>

                <div className="p-8 md:p-10">
                    <h2 id="portfolio-modal-title" className="text-2xl font-black tracking-tight mb-2">{portfolioForm.id ? '포트폴리오 수정' : '포트폴리오 등록'}</h2>
                    <p className="text-xs text-zinc-500 mb-8 font-mono tracking-widest uppercase border-b border-zinc-100 pb-6">{portfolioForm.id ? 'UPDATE_RECORD' : 'UPLOAD_NEW_RECORD'}</p>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black font-mono uppercase text-zinc-400">제목 / Title *</label>
                            <input type="text" value={portfolioForm.title} onChange={e => setPortfolioForm(prev => ({ ...prev, title: e.target.value }))} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:border-[#7A4FFF] outline-none" placeholder="프로젝트 제목을 입력하세요." />
                        </div>

                        <input type="file" accept="image/*" className="hidden" ref={thumbFileInputRef} onChange={handleThumbUpload} />
                        <input type="file" accept="image/*" multiple className="hidden" ref={bulkFileInputRef} onChange={handleBulkImageUpload} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black font-mono uppercase text-zinc-400 flex justify-between">
                                    썸네일 (대표 이미지) {isThumbUploading && <Loader2 size={12} className="animate-spin text-[#7A4FFF]" />}
                                </label>
                                <button type="button" aria-label="썸네일 이미지 업로드" onClick={() => !isThumbUploading && thumbFileInputRef.current?.click()} className={`h-32 w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all relative ${portfolioForm.thumbnailUrl ? 'border-[#7A4FFF] bg-purple-50' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'}`}>
                                    {portfolioForm.thumbnailUrl ? (
                                        <img src={portfolioForm.thumbnailUrl} alt="thumb" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <ImageIcon className="text-zinc-300 mb-2" size={24} />
                                            <span className="text-[10px] font-bold text-zinc-400">썸네일 업로드</span>
                                        </>
                                    )}
                                    {isThumbUploading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm" />}
                                </button>
                            </div>

                            <div className="space-y-2 flex flex-col">
                                <label className="text-[10px] font-black font-mono uppercase text-zinc-400 flex justify-between">
                                    상세 이미지 (최대 10장) {isBulkUploading && <Loader2 size={12} className="animate-spin text-[#7A4FFF]" />}
                                </label>
                                <button type="button" aria-label="상세 이미지 업로드" onClick={() => !isBulkUploading && bulkFileInputRef.current?.click()} className="h-32 w-full border-2 border-dashed border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
                                    <Upload className="text-zinc-300 mb-2" size={24} />
                                    <span className="text-[10px] font-bold text-zinc-400">다중 이미지 업로드</span>
                                    <span className="text-[9px] text-zinc-400 mt-1">({portfolioForm.portfolioImages.length}/10)</span>
                                </button>
                            </div>
                        </div>

                        {portfolioForm.portfolioImages.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                                {portfolioForm.portfolioImages.map((imgUrl: string, idx: number) => (
                                    <div key={idx} className="w-16 h-16 rounded-lg relative flex-shrink-0 group shadow-sm border border-zinc-100 overflow-hidden">
                                        <img src={imgUrl} alt="preview" className="w-full h-full object-cover" />
                                        <button onClick={() => removePortfolioImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="이미지 삭제">
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black font-mono uppercase text-zinc-400">상세 설명 / Description *</label>
                            <textarea rows={5} value={portfolioForm.desc} onChange={e => setPortfolioForm(prev => ({ ...prev, desc: e.target.value }))} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:border-[#7A4FFF] outline-none resize-none" placeholder="수행한 역할과 성과를 상세히 적어주세요." />
                        </div>

                        {/* 포트폴리오 스킬 선택 */}
                        <div className="space-y-3 border-t border-zinc-100 pt-6">
                            <label className="text-[10px] font-black font-mono uppercase text-zinc-400">
                                사용 기술 / Tech Stack{" "}
                                <span className="font-sans text-zinc-500">
                                    ({portfolioForm.skills.length}/{MAX_SELECTED_SKILLS})
                                </span>
                            </label>

                            <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                                {portfolioForm.skills.length === 0 ? (
                                    <span className="text-zinc-400 font-mono text-xs my-auto">선택된 기술이 없습니다.</span>
                                ) : (
                                    portfolioForm.skills.map((skillId: number, idx: number) => {
                                        const skillObj = allGlobalSkills.find((s) => (s.skillId || s.id) === skillId);
                                        return (
                                            <span key={`port-skill-${skillId || idx}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#7A4FFF]/10 border border-[#7A4FFF]/20 text-[#7A4FFF]">
                                                #{skillObj ? skillObj.name : skillId}
                                                <button onClick={() => togglePortfolioSkill(skillId)} className="text-[#7A4FFF]/60 hover:text-red-500 transition-colors ml-1" aria-label="스킬 삭제"><X size={12} /></button>
                                            </span>
                                        );
                                    })
                                )}
                            </div>

                            <div className="relative mt-2">
                                <input className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 outline-none text-sm font-bold focus:border-[#FF7D00] shadow-sm transition-all focus:ring-2 focus:ring-[#FF7D00]/10" placeholder="기술 검색하여 추가..." value={portfolioSkillSearchQuery} onChange={e => setPortfolioSkillSearchQuery(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => void handleSuggestPortfolioSkills()}
                                    disabled={isSuggestingSkills}
                                    className="rounded-lg border border-[#7A4FFF]/40 bg-purple-50 px-3 py-2 text-[11px] font-black text-[#7A4FFF] transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSuggestingSkills ? '추출 중...' : 'overview에서 스킬 자동추출'}
                                </button>
                                {suggestError && <p className="text-[11px] font-semibold text-red-600">{suggestError}</p>}
                            </div>
                            {suggestedSkills.length > 0 && (
                                <div className="rounded-lg border border-[#7A4FFF]/30 bg-purple-50/60 p-3">
                                    <p className="mb-2 text-[11px] font-black text-[#7A4FFF]">추천 스킬 (클릭해서 추가)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestedSkills.map((skill) => {
                                            const selected = portfolioForm.skills.includes(skill.skillId);
                                            return (
                                                <button
                                                    key={`portfolio-suggested-skill-${skill.skillId}`}
                                                    type="button"
                                                    disabled={selected}
                                                    onClick={() => applySuggestedSkill(skill.skillId)}
                                                    className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                                                        selected
                                                            ? 'cursor-not-allowed border-zinc-200 bg-zinc-200 text-zinc-500'
                                                            : 'border-[#7A4FFF]/40 bg-white text-[#7A4FFF] hover:bg-[#7A4FFF] hover:text-white'
                                                    }`}
                                                >
                                                    {selected ? '선택됨 ' : '+ '}
                                                    {skill.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-1.5 max-h-[260px] overflow-y-auto no-scrollbar p-2 bg-zinc-50 rounded-xl border border-zinc-100 shadow-inner">
                                {allGlobalSkills
                                    .filter((s) => s.name.toLowerCase().includes(portfolioSkillSearchQuery.toLowerCase()))
                                    .map((skill, idx) => {
                                        const sId = skill.skillId || skill.id;
                                        if (sId == null) return null;
                                        const isSelected = portfolioForm.skills.includes(sId);
                                        const atCap = !isSelected && portfolioForm.skills.length >= MAX_SELECTED_SKILLS;
                                        return (
                                            <button
                                                key={`global-port-skill-${sId || idx}`}
                                                type="button"
                                                disabled={atCap}
                                                onClick={() => togglePortfolioSkill(sId)}
                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                                                    isSelected
                                                        ? 'bg-[#FF7D00]/10 border-[#FF7D00]/30 text-[#FF7D00]'
                                                        : atCap
                                                          ? 'cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-300'
                                                          : 'bg-white border-zinc-200 text-zinc-500 hover:border-[#7A4FFF] hover:text-[#7A4FFF]'
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

                    <div className="flex gap-4 mt-8">
                        <button onClick={onClose} className="flex-1 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-black rounded-xl text-sm transition-colors">취소</button>
                        <button onClick={handleSavePortfolio} className="flex-1 py-4 bg-zinc-900 hover:bg-black text-white font-black rounded-xl text-sm transition-colors shadow-xl">등록하기</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
