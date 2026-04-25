'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, SlidersHorizontal, MapPin, Briefcase, Cpu, RotateCcw, Banknote } from 'lucide-react';
import { SKILL_CATEGORIES } from '@/constants/skills';
import { useState, useEffect } from 'react';

interface FilterSidebarProps {
    mode: 'CLIENT' | 'FREELANCER';
    selectedSkills: string[];
    onSkillChange: (skills: string[]) => void;
    selectedLocation: string;
    onLocationChange: (loc: string) => void;
    workStyle: string;
    onWorkStyleChange: (style: string) => void;
    onReset: () => void;
    minPrice?: number;
    maxPrice?: number;
    onPriceChange: (min: number | undefined, max: number | undefined) => void;
}

export default function FilterSidebar({
    mode,
    selectedSkills,
    onSkillChange,
    selectedLocation,
    onLocationChange,
    workStyle,
    onWorkStyleChange,
    onReset,
    minPrice,
    maxPrice,
    onPriceChange
}: FilterSidebarProps) {
    const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
    const [prevSelectedSkills, setPrevSelectedSkills] = useState<string[]>([]);

    // 🎯 스택이 새롭게 선택되어 개수가 0 -> 1이 되는 카테고리만 자동으로 엽니다.
    useEffect(() => {
        // 새로 추가된 스택 찾기
        const addedSkills = selectedSkills.filter(s => !prevSelectedSkills.includes(s));
        
        if (addedSkills.length > 0) {
            // 새로 추가된 스택이 속한 카테고리들 찾기
            const categoriesToOpen = SKILL_CATEGORIES.filter(cat => 
                cat.skills.some(skill => addedSkills.includes(skill))
            ).map(cat => cat.id);

            if (categoriesToOpen.length > 0) {
                setOpenCategories(prev => {
                    const next = new Set(prev);
                    categoriesToOpen.forEach(id => next.add(id));
                    return next;
                });
            }
        }
        
        setPrevSelectedSkills(selectedSkills);
    }, [selectedSkills, prevSelectedSkills]);

    const toggleCategory = (id: string, isOpen: boolean) => {
        setOpenCategories(prev => {
            const next = new Set(prev);
            if (isOpen) next.add(id);
            else next.delete(id);
            return next;
        });
    };

    const isClient = mode === 'CLIENT';
    const accentColor = isClient ? '#FF7D00' : '#7A4FFF';
    const accentBg = isClient ? 'bg-[#FF7D00]' : 'bg-[#7A4FFF]';
    const accentText = isClient ? 'text-[#FF7D00]' : 'text-[#7A4FFF]';
    const accentBorder = isClient ? 'border-[#FF7D00]' : 'border-[#7A4FFF]';
    const accentShadow = isClient ? 'shadow-orange-500/20' : 'shadow-purple-500/20';

    const locations = ['전국', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
    const workStyles = [
        { label: '전체', value: '' },
        { label: '온라인', value: 'ONLINE' },
        { label: '오프라인', value: 'OFFLINE' }
    ];

    // 🎯 실제로 기본값이 아닌 필터가 적용되었는지 확인 (전체/'' 제외)
    const hasFilters = selectedSkills.length > 0 || 
                       selectedLocation !== '' || 
                       (workStyle !== '' && workStyle !== '전체') ||
                       minPrice !== undefined || 
                       maxPrice !== undefined;

    return (
        <aside className="w-full lg:w-72 flex flex-col gap-8 h-fit lg:sticky lg:top-32">
            
            {/* 🔄 Reset Button - Always Visible Dashboard CTA Style */}
            <motion.button
                whileHover={hasFilters ? { scale: 1.02, translateY: -2 } : {}}
                whileTap={hasFilters ? { scale: 0.98 } : {}}
                onClick={hasFilters ? onReset : undefined}
                className={`group relative overflow-hidden flex items-center justify-center gap-3 w-full py-5 rounded-[1.8rem] text-[14px] font-black transition-all shadow-xl tracking-tighter ${
                    hasFilters 
                        ? 'bg-zinc-900 text-white cursor-pointer active:scale-95 shadow-zinc-200' 
                        : 'bg-zinc-100 text-zinc-300 cursor-not-allowed shadow-none'
                }`}
            >
                <RotateCcw size={16} className={`transition-transform duration-500 ${hasFilters ? 'group-hover:rotate-[-180deg]' : ''}`} />
                필터 설정 초기화
            </motion.button>

            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-4 shadow-xl shadow-zinc-200/40 flex flex-col gap-8">
                
                {/* 1. Work Style Section */}
                <section className="px-1">
                    <h3 className="flex items-center gap-2 text-[13px] font-black text-zinc-900 mb-5 px-2">
                        <Briefcase size={14} className={accentText} /> 협업 근무 방식
                    </h3>
                    <div className="flex bg-zinc-100/50 p-1.5 rounded-[1.4rem] border border-zinc-200/30">
                        {workStyles.map((style) => {
                            const isActive = style.label === '전체' 
                                ? (!workStyle || workStyle === '전체' || workStyle === '')
                                : (isClient ? workStyle === style.value : workStyle === style.label);

                            return (
                                <button
                                    key={style.label}
                                    onClick={() => onWorkStyleChange(isClient ? style.value : (style.label === '전체' ? '' : style.label))}
                                    className={`relative flex-1 py-3 rounded-[1rem] text-[13px] font-bold transition-all z-10 ${
                                        isActive
                                            ? 'text-white'
                                            : 'text-zinc-400 hover:text-zinc-600'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId={`workstyle-bg-${mode}`}
                                            className={`absolute inset-0 ${accentBg} rounded-[1rem] shadow-md z-[-1]`}
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    {style.label}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* 2. Skills Section - Categorized Accordion */}
                <section className="px-1">
                    <h3 className="flex items-center gap-2 text-[13px] font-black text-zinc-900 mb-5 px-2">
                        <Cpu size={14} className={accentText} /> 전문 기술 스택
                    </h3>
                    <div className="space-y-2">
                        {SKILL_CATEGORIES.map((cat) => {
                            const selectedInCat = cat.skills.filter(s => selectedSkills.includes(s)).length;
                            
                            // 카테고리명 한글 매핑
                            const categoryLabels: Record<string, string> = {
                                'backend': '백엔드',
                                'frontend': '프론트엔드',
                                'mobile': '모바일 앱',
                                'cloud-data': '클라우드 & 데이터',
                                'etc': '기타 및 도구'
                            };

                            return (
                                <details 
                                    key={cat.id} 
                                    className="group" 
                                    open={openCategories.has(cat.id)}
                                    onToggle={(e) => toggleCategory(cat.id, (e.target as HTMLDetailsElement).open)}
                                >
                                    <summary className="flex items-center justify-between list-none cursor-pointer px-5 py-2.5 rounded-[1.4rem] bg-white/60 hover:bg-white border border-transparent hover:border-zinc-100 transition-all shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${selectedInCat > 0 ? accentBg : 'bg-zinc-200'}`} />
                                            <span className={`text-[14px] font-bold tracking-tight ${selectedInCat > 0 ? 'text-zinc-950' : 'text-zinc-500'}`}>
                                                {categoryLabels[cat.id] || cat.label}
                                            </span>
                                            <AnimatePresence>
                                                {selectedInCat > 0 && (
                                                    <motion.span 
                                                        initial={{ scale: 0.5, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0.5, opacity: 0 }}
                                                        className={`${accentBg} text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[22px] text-center shadow-lg ${accentShadow} border border-white/20`}
                                                    >
                                                        {selectedInCat}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <ChevronDown size={16} className="text-zinc-300 group-open:rotate-180 transition-transform duration-300" />
                                    </summary>
                                    <div className="pt-3 pb-4 px-2 flex flex-wrap gap-2">
                                        {cat.skills.map(s => {
                                            const isSelected = selectedSkills.includes(s);
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => {
                                                        const newSkills = isSelected 
                                                            ? selectedSkills.filter(item => item !== s)
                                                            : [...selectedSkills, s];
                                                        onSkillChange(newSkills);
                                                    }}
                                                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-[1rem] text-[12px] font-bold transition-all border ${
                                                        isSelected 
                                                            ? `${accentBg} ${accentBorder} text-white shadow-md` 
                                                            : 'bg-white/40 border-zinc-100/50 text-zinc-400 hover:border-zinc-200 hover:text-zinc-600'
                                                    }`}
                                                >
                                                    {isSelected && <Check size={12} strokeWidth={4} className="text-white" />}
                                                    {s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </details>
                            );
                        })}
                    </div>
                </section>

                {/* 3. Price Range Section (Budget or Hourly Rate) */}
                <section className="px-1">
                    <h3 className="flex items-center gap-2 text-[13px] font-black text-zinc-900 mb-5 px-2">
                        <Banknote size={14} className={accentText} /> {isClient ? '희망 시급 범위' : '프로젝트 예산 범위'}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: '전체', min: undefined, max: undefined },
                            ...(isClient ? [
                                { label: '5만원 이하', min: 0, max: 50000 },
                                { label: '5~10만원', min: 50000, max: 100000 },
                                { label: '10~15만원', min: 100000, max: 150000 },
                                { label: '15만원 이상', min: 150000, max: 9999999 }
                            ] : [
                                { label: '500만원 이하', min: 0, max: 5000000 },
                                { label: '500~1,000만원', min: 5000000, max: 10000000 },
                                { label: '1,000~2,000만원', min: 10000000, max: 20000000 },
                                { label: '2,000만원 이상', min: 20000000, max: 999999999 }
                            ])
                        ].map((range, index) => {
                            const isSelected = minPrice === range.min && maxPrice === range.max;
                            return (
                                <button
                                    key={range.label}
                                    onClick={() => onPriceChange(range.min, range.max)}
                                    className={`px-1 py-3 rounded-[1.2rem] text-[13px] font-bold transition-all border whitespace-nowrap tracking-tighter ${
                                        index === 0 ? 'col-span-2 py-3.5' : ''
                                    } ${
                                        isSelected 
                                            ? `${accentBg} ${accentBorder} text-white shadow-lg` 
                                            : 'bg-white/40 border-zinc-100/50 text-zinc-400 hover:border-zinc-200 hover:text-zinc-600'
                                    }`}
                                >
                                    {range.label}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* 4. Location Section */}
                <section className="px-1 pb-2">
                    <h3 className="flex items-center gap-2 text-[13px] font-black text-zinc-900 mb-5 px-2">
                        <MapPin size={14} className={accentText} /> 활동 지역
                    </h3>
                    <div className="grid grid-cols-3 gap-2 p-2 bg-zinc-50/50 rounded-[1.8rem] border border-zinc-100/50">
                        {locations.map(loc => {
                            const isActive = (loc === '전국' && selectedLocation === '') || selectedLocation === loc;
                            return (
                                <button
                                    key={loc}
                                    onClick={() => onLocationChange(loc === '전국' ? '' : loc)}
                                    className={`relative flex flex-col items-center justify-center py-3 rounded-[1rem] text-[12px] font-bold transition-all z-10 ${
                                        isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-600 hover:bg-white/80'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId={`location-bg-${mode}`}
                                            className={`absolute inset-0 ${accentBg} rounded-[1rem] shadow-sm z-[-1]`}
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    {loc}
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>
        </aside>
    );
}
