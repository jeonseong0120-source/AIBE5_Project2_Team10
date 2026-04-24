"use client";

import { FormEvent, useState, useEffect } from "react";
import KakaoLocationPicker from "@/components/project/KakaoLocationPicker";
import SkillTagSelector from "@/components/project/SkillTagSelector";
import { MAX_PROJECT_SKILLS } from "@/app/lib/skillLimits";
import api from "@/app/lib/axios";
import { useRouter } from "next/navigation";
import { DollarSign, MapPin, ArrowLeft, X, Type, Activity, List, Cpu, Briefcase, Target, FileText, Globe, Send, ChevronRight, Calendar, Building2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface ProjectEditFormProps {
    projectId: string | number;
    initialData: any;
    embedded?: boolean;
    onClose?: () => void;
    onSaved?: () => void;
}

export default function ProjectEditForm({ projectId, initialData, embedded = false, onClose, onSaved }: ProjectEditFormProps) {
    const router = useRouter();

    const [projectName, setProjectName] = useState(initialData.projectName || "");
    const [budget, setBudget] = useState(String(initialData.budget || ""));
    const [deadline, setDeadline] = useState(initialData.deadline || "");
    const [detail, setDetail] = useState(initialData.detail || "");
    const [online, setOnline] = useState(initialData.online || false);
    const [offline, setOffline] = useState(initialData.offline || false);

    const [location, setLocation] = useState(initialData.location || "");
    const [latitude, setLatitude] = useState(String(initialData.latitude || ""));
    const [longitude, setLongitude] = useState(String(initialData.longitude || ""));

    const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(
        (initialData.skillIds || []).slice(0, MAX_PROJECT_SKILLS)
    );
    const [submitting, setSubmitting] = useState(false);
    const [isSkillsLoading, setIsSkillsLoading] = useState(true);

    // 🔍 [Fix] 동기화 성공 여부 (초기값은 true로 설정하여 수동 선택 시 제출 가능하도록 관리)
    const [cursor, setCursor] = useState({ x: 0, y: 0 });
    const [error, setError] = useState<string | null>(null);
    const [mappingSucceeded, setMappingSucceeded] = useState(true);
    const kakaoJavascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ?? "";

    useEffect(() => {
        const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    useEffect(() => {
        const syncSkillIds = async () => {
            try {
                if (initialData.skillIds && initialData.skillIds.length > 0) {
                    setSelectedSkillIds(initialData.skillIds.slice(0, MAX_PROJECT_SKILLS));
                    setIsSkillsLoading(false);
                    return;
                }

                const res = await api.get("/v1/skills/default");
                const allSkills = res.data;

                if (initialData.skillNames && initialData.skillNames.length > 0) {
                    const matchedIds = allSkills
                        .filter((s: any) => initialData.skillNames.includes(s.name))
                        .map((s: any) => s.skillId);

                    if (matchedIds.length > 0) {
                        setSelectedSkillIds(matchedIds.slice(0, MAX_PROJECT_SKILLS));
                    } else {
                        setMappingSucceeded(false);
                    }
                }
            } catch (err) {
                console.error("기술 목록 동기화 실패:", err);
                setMappingSucceeded(false);
            } finally {
                setIsSkillsLoading(false);
            }
        };
        syncSkillIds();
    }, [initialData.skillNames, initialData.skillIds]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (isSkillsLoading) return setError("기술 목록을 불러오는 중입니다.");

        if (!mappingSucceeded && selectedSkillIds.length === 0) {
            return setError("기술 스택 정보를 불러오지 못했습니다. 수동으로 기술 스택을 다시 선택해 주세요.");
        }

        if (!online && !offline) return setError("근무 방식을 하나 이상 선택해야 합니다.");

        if (Number(budget) <= 0) return setError("예산은 1원 이상이어야 합니다.");
        if (selectedSkillIds.length > MAX_PROJECT_SKILLS) {
            return setError(`기술 스택은 최대 ${MAX_PROJECT_SKILLS}개까지 선택할 수 있습니다.`);
        }

        setSubmitting(true);
        try {
            const payload: any = {
                projectName: projectName.trim(),
                budget: Number(budget),
                deadline,
                detail: detail.trim(),
                online,
                offline,
                skillIds: selectedSkillIds,
                skillNames: []
            };

            if (offline) {
                const lat = Number(latitude);
                const lng = Number(longitude);
                if (!location.trim() || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                    setSubmitting(false);
                    return setError("오프라인 주소 정보를 정확히 입력해 주세요.");
                }
                payload.location = location;
                payload.latitude = lat;
                payload.longitude = lng;
            } else {
                payload.location = null;
                payload.latitude = null;
                payload.longitude = null;
            }

            await api.put(`/projects/${projectId}`, payload);
            if (embedded) {
                onSaved?.();
            } else {
                alert("✅ 프로젝트 수정이 완료되었습니다.");
                router.push("/client/dashboard");
            }
        } catch (err: any) {
            console.error(err);
            setError(`❌ 수정 실패: ${err.response?.data?.message || "서버 오류"}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`${embedded ? "relative" : "min-h-screen bg-zinc-50 relative overflow-hidden font-sans pb-20"}`}>
            {/* 커서 글로우 */}
            {!embedded && <div
                className="pointer-events-none fixed left-0 top-0 z-0 h-[400px] w-[400px] rounded-full bg-[#7A4FFF]/10 blur-[120px] will-change-transform"
                style={{ transform: `translate(${cursor.x - 200}px, ${cursor.y - 200}px)` }}
            />}

            {!embedded && (
                <section className="relative pt-16 pb-12 px-8 bg-white border-b border-zinc-200 overflow-hidden mb-10">
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                    <div className="max-w-xl mx-auto relative z-10">
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => router.back()} className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-400 hover:text-[#7A4FFF] hover:border-[#7A4FFF]/30 hover:bg-purple-50 transition-all group">
                                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-8 h-[2px] bg-[#7A4FFF]"></span>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PROJECT SETTINGS</span>
                                </div>
                                <h1 className="text-4xl font-black tracking-tight text-zinc-950">프로젝트 수정</h1>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <form onSubmit={handleSubmit} className="mx-auto max-w-xl flex flex-col w-full overflow-hidden rounded-[2rem] border border-zinc-200 bg-white/95 shadow-2xl backdrop-blur-xl relative z-10">
                {/* Top Accent Bar */}
                <div className="h-1.5 w-full flex-none bg-gradient-to-r from-[#7A4FFF] via-[#A78BFF] to-[#7A4FFF]" />

                {/* Header Section (Embedded) */}
                {embedded && (
                    <div className="p-8 pb-0 flex-none">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-purple-50 rounded-xl text-[#7A4FFF]">
                                        <Briefcase size={18} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7A4FFF]">EDIT_PROJECT</span>
                                </div>
                                <h3 className="text-3xl font-black tracking-tighter text-zinc-950">
                                    프로젝트 <span className="text-zinc-400">수정하기</span>
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 transition-all hover:bg-zinc-900 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
                    {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[13px] font-bold animate-shake">{error}</div>}

                    <div className="space-y-6">
                        {/* 프로젝트명 */}
                        <div className="space-y-2">
                            <div className="mb-2 flex items-center gap-2">
                                <Target size={14} className="text-[#7A4FFF]" />
                                <label className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400">프로젝트 제목</label>
                            </div>
                            <input 
                                required 
                                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-[15px] font-black text-zinc-950 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white focus:ring-4 focus:ring-purple-50" 
                                value={projectName} 
                                onChange={(e) => setProjectName(e.target.value)} 
                            />
                        </div>

                        {/* 예산 및 마감일 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="mb-2 flex items-center gap-2">
                                    <DollarSign size={14} className="text-[#7A4FFF]" />
                                    <label className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400">예상 예산 (원)</label>
                                </div>
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        required 
                                        min="1" 
                                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 pr-12 text-[15px] font-black text-zinc-950 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white focus:ring-4 focus:ring-purple-50 font-mono" 
                                        value={budget} 
                                        onChange={(e) => setBudget(e.target.value)} 
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-400">원</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="mb-2 flex items-center gap-2">
                                    <Calendar size={14} className="text-zinc-400" />
                                    <label className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400">모집 마감일</label>
                                </div>
                                <input 
                                    type="date" 
                                    required 
                                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-[15px] font-black text-zinc-950 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white focus:ring-4 focus:ring-purple-50 font-mono" 
                                    value={deadline} 
                                    onChange={(e) => setDeadline(e.target.value)} 
                                />
                            </div>
                        </div>

                        {/* 상세 설명 */}
                        <div className="space-y-2">
                            <div className="mb-2 flex items-center gap-2">
                                <FileText size={14} className="text-zinc-400" />
                                <label className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400">프로젝트 상세 내용</label>
                            </div>
                            <textarea 
                                required 
                                className="w-full rounded-[2rem] border border-zinc-200 bg-zinc-50 px-6 py-5 text-[15px] font-bold text-zinc-950 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white resize-none min-h-[160px] leading-relaxed" 
                                value={detail} 
                                onChange={(e) => setDetail(e.target.value)} 
                            />
                        </div>

                        {/* 근무 방식 */}
                        <div className="space-y-2">
                            <div className="mb-2 flex items-center gap-2">
                                <Globe size={14} className="text-zinc-400" />
                                <label className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400">근무 형태 설정</label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <label className={`flex cursor-pointer items-center justify-center gap-3 rounded-2xl border px-5 py-4 transition-all ${online ? 'border-[#7A4FFF] bg-purple-50 text-[#7A4FFF]' : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}>
                                    <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} className="sr-only" />
                                    <span className="text-[14px] font-black">온라인 (재택)</span>
                                </label>
                                <label className={`flex cursor-pointer items-center justify-center gap-3 rounded-2xl border px-5 py-4 transition-all ${offline ? 'border-[#7A4FFF] bg-purple-50 text-[#7A4FFF]' : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}>
                                    <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} className="sr-only" />
                                    <span className="text-[14px] font-black">오프라인 (출근)</span>
                                </label>
                            </div>
                        </div>

                        {/* 오프라인 주소 */}
                        <AnimatePresence>
                            {offline && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <div className="mt-4 rounded-[2rem] border border-purple-200 bg-purple-50/30 p-6 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className="text-[#7A4FFF]" />
                                            <span className="text-[12px] font-black text-[#7A4FFF] uppercase tracking-[0.3em]">출근 위치 설정</span>
                                        </div>

                                        {kakaoJavascriptKey ? (
                                            <KakaoLocationPicker
                                                javascriptKey={kakaoJavascriptKey}
                                                value={{ address: location, latitude, longitude }}
                                                onChangeAction={(v) => {
                                                    setLocation(v.address);
                                                    setLatitude(v.latitude);
                                                    setLongitude(v.longitude);
                                                }}
                                            />
                                        ) : (
                                            <div className="p-4 bg-red-50 text-red-600 text-[13px] font-bold rounded-xl border border-red-100">⚠️ API 키를 확인해주세요.</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 기술 스택 */}
                        <div className="space-y-2">
                            <div className="mb-2 flex items-center gap-2">
                                <Cpu size={14} className="text-[#7A4FFF]" />
                                <label className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400">요구 기술 스택</label>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2 focus-within:border-[#7A4FFF] focus-within:bg-white focus-within:ring-4 focus-within:ring-purple-50 transition-all">
                                <SkillTagSelector
                                    selectedSkillIds={selectedSkillIds}
                                    onChangeAction={setSelectedSkillIds}
                                    suggestSourceText={detail}
                                    suggestContext="project"
                                    maxSelected={MAX_PROJECT_SKILLS}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 flex-none border-t border-zinc-100 bg-zinc-50/50 backdrop-blur-sm">
                    {embedded ? (
                        <div className="flex flex-col-reverse md:flex-row justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl px-8 py-4 text-[13px] font-black text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-600 tracking-tight"
                            >
                                취소하기
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || isSkillsLoading}
                                className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-zinc-950 px-10 py-4 text-[14px] font-black text-white transition-all hover:bg-[#7A4FFF] hover:shadow-[0_12px_30px_rgba(122,79,255,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting || isSkillsLoading ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                        <span>저장 중...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} strokeWidth={2.5} />
                                        <span>수정 완료하기</span>
                                    </>
                                )}
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shimmer" />
                            </button>
                        </div>
                    ) : (
                        <button type="submit" disabled={submitting || isSkillsLoading} className="group relative w-full flex items-center justify-center gap-3 overflow-hidden py-5 bg-zinc-950 text-white rounded-2xl text-[15px] font-black uppercase tracking-widest hover:bg-[#7A4FFF] transition-all hover:shadow-[0_12px_30px_rgba(122,79,255,0.4)] disabled:cursor-not-allowed disabled:opacity-50">
                            {submitting || isSkillsLoading ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={20} strokeWidth={2.5} />
                                    <span>수정 사항 저장 완료</span>
                                </>
                            )}
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shimmer" />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}