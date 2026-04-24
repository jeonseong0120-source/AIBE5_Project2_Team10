"use client";

import { FormEvent, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProject, type CreateProjectBody } from "@/app/lib/projectApi";
import KakaoLocationPicker from "@/components/project/KakaoLocationPicker";
import SkillTagSelector from "@/components/project/SkillTagSelector";
import { MAX_PROJECT_SKILLS } from "@/app/lib/skillLimits";
import { DollarSign, MapPin, ArrowLeft, XCircle, Briefcase, FileText, Target, Calendar, Globe, Building2, Sparkles, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MatchingresultForm from "./MatchingresultForm";

function tomorrowISODate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

interface ProjectRegisterFormProps {
    embedded?: boolean;
    onClose?: () => void;
    onSaved?: (projectId?: number) => void;
}

export default function ProjectRegisterForm({ embedded = false, onClose, onSaved }: ProjectRegisterFormProps) {
    const router = useRouter();
    const [projectName, setProjectName] = useState("");
    const [budget, setBudget] = useState("");
    const [deadline, setDeadline] = useState(tomorrowISODate());
    const [detail, setDetail] = useState("");
    const [online, setOnline] = useState(true);
    const [offline, setOffline] = useState(false);
    const [location, setLocation] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");

    const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
    const [isSkillsLoading, setIsSkillsLoading] = useState(true);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState({ x: 0, y: 0 });

    // 🎯 [추가] 모달 제어 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProjectId, setNewProjectId] = useState<number | null>(null);


    const kakaoJavascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ?? "";
    const submitLockRef = useRef(false);

    useEffect(() => {
        const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    useEffect(() => {
        setIsSkillsLoading(false);
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (submitLockRef.current) return;
        setError(null);

        if (isSkillsLoading) {
            return setError("기술 목록을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        }

        if (!online && !offline) return setError("근무 방식은 하나 이상 선택해 주세요.");
        if (Number(budget) < 1) return setError("예산은 1원 이상이어야 합니다.");
        if (selectedSkillIds.length > MAX_PROJECT_SKILLS) {
            return setError(`기술 스택은 최대 ${MAX_PROJECT_SKILLS}개까지 선택할 수 있습니다.`);
        }

        const payload: CreateProjectBody = {
            projectName: projectName.trim(),
            budget: Number(budget),
            deadline,
            detail: detail.trim() || undefined,
            online,
            offline,
            skillIds: selectedSkillIds.length ? selectedSkillIds : undefined,
        };

        if (offline) {
            payload.location = location.trim();
            const lat = Number(latitude);
            const lng = Number(longitude);

            if (!payload.location || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                return setError("오프라인 정보를 정확히 입력해 주세요.");
            }

            payload.latitude = lat;
            payload.longitude = lng;
        }

        submitLockRef.current = true;
        setSubmitting(true);
        try {
            const resultId = await createProject(payload);

            router.refresh();
            if (resultId) {
                setNewProjectId(resultId);
                setIsModalOpen(true);
            } else {
                if (embedded) {
                    onSaved?.();
                } else {
                    alert("프로젝트가 등록되었습니다.");
                    router.push("/client/dashboard");
                }
            }

        } catch (err: any) {
            setError(err.response?.data?.message || "등록에 실패했습니다.");
            submitLockRef.current = false;
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`${embedded ? "relative" : "min-h-screen bg-zinc-50 relative overflow-hidden font-sans pb-20"}`}>
            {!embedded && (
                <div className="pointer-events-none fixed left-0 top-0 z-0 h-[400px] w-[400px] rounded-full bg-[#FF7D00]/10 blur-[120px] will-change-transform" style={{ transform: `translate(${cursor.x - 200}px, ${cursor.y - 200}px)` }} />
            )}

            {!embedded && (
            <section className="relative pt-16 pb-12 px-8 bg-white border-b border-zinc-200 overflow-hidden mb-10">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="max-w-xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <button type="button" onClick={() => router.back()} className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-400 hover:text-[#FF7D00] hover:border-[#FF7D00]/30 hover:bg-orange-50 transition-all group">
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-6 h-[2px] bg-[#FF7D00]"></span>
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono">Mission_Creator</span>
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-zinc-950">프로젝트 등록</h1>
                        </div>
                    </div>
                </div>
            </section>
            )}

            <form onSubmit={handleSubmit} className="mx-auto max-w-xl flex flex-col w-full overflow-hidden rounded-[2rem] border border-zinc-200 bg-white/95 shadow-2xl backdrop-blur-xl relative z-10">
                {/* Top Accent Bar */}
                <div className="h-1.5 w-full flex-none bg-gradient-to-r from-[#7A4FFF] via-[#FF7D00] to-[#7A4FFF]" />

                {/* Header Section */}
                {embedded && (
                    <div className="p-6 md:p-8 pb-0 flex-none">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-purple-50 rounded-xl text-[#7A4FFF]">
                                        <Briefcase size={18} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7A4FFF]">Mission Creator</span>
                                </div>
                                <h3 className="text-3xl font-black tracking-tighter text-zinc-950">
                                    새 프로젝트 <span className="text-zinc-400">등록하기</span>
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="닫기"
                                className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 transition-all hover:bg-zinc-900 hover:text-white"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Scrollable Content */}
                <div className={`flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 pt-0 space-y-8`}>
                    {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[13px] font-bold animate-shake">{error}</div>}

                    <div className="space-y-6">
                        {/* Project Title */}
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <Target size={14} className="text-[#7A4FFF]" />
                                <label className="text-[12px] font-black uppercase tracking-widest text-zinc-400">프로젝트_제목</label>
                            </div>
                            <input 
                                required 
                                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-[15px] font-black text-zinc-950 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white focus:ring-4 focus:ring-purple-50" 
                                value={projectName} 
                                onChange={(e) => setProjectName(e.target.value)} 
                                placeholder="예: 차세대 모바일 앱 프론트엔드 개발" 
                            />
                        </div>

                        {/* Budget and Deadline */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <DollarSign size={14} className="text-[#FF7D00]" />
                                    <label className="text-[12px] font-black uppercase tracking-widest text-zinc-400">예산_(원)</label>
                                </div>
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        required 
                                        min="1" 
                                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 pr-12 text-[15px] font-black text-zinc-950 outline-none transition-all focus:border-[#FF7D00] focus:bg-white focus:ring-4 focus:ring-orange-50" 
                                        value={budget} 
                                        onChange={(e) => setBudget(e.target.value)} 
                                        placeholder="예: 5,000,000"
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-400">원</span>
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <Calendar size={14} className="text-zinc-400" />
                                    <label className="text-[12px] font-black uppercase tracking-widest text-zinc-400">마감일</label>
                                </div>
                                <input 
                                    type="date" 
                                    required 
                                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-[15px] font-black text-zinc-950 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white focus:ring-4 focus:ring-purple-50" 
                                    value={deadline} 
                                    onChange={(e) => setDeadline(e.target.value)} 
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <FileText size={14} className="text-zinc-400" />
                                <label className="text-[12px] font-black uppercase tracking-widest text-zinc-400">프로젝트_상세내용</label>
                            </div>
                            <textarea 
                                className="w-full rounded-[2rem] border border-zinc-200 bg-zinc-50 px-6 py-5 text-[15px] font-bold text-zinc-950 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white resize-none min-h-[160px] leading-relaxed" 
                                value={detail} 
                                onChange={(e) => setDetail(e.target.value)} 
                                placeholder="프로젝트의 주요 목표, 필요 기술, 주요 업무 내용을 구체적으로 작성해주세요." 
                            />
                        </div>

                        {/* Work Style */}
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <Globe size={14} className="text-zinc-400" />
                                <label className="text-[12px] font-black uppercase tracking-widest text-zinc-400">근무_형태</label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <label className={`flex cursor-pointer items-center justify-center gap-3 rounded-2xl border px-5 py-4 transition-all ${online ? 'border-[#7A4FFF] bg-purple-50 text-[#7A4FFF]' : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}>
                                    <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} className="sr-only" />
                                    <span className="text-[14px] font-black">온라인 (재택)</span>
                                </label>
                                <label className={`flex cursor-pointer items-center justify-center gap-3 rounded-2xl border px-5 py-4 transition-all ${offline ? 'border-[#FF7D00] bg-orange-50 text-[#FF7D00]' : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}>
                                    <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} className="sr-only" />
                                    <span className="text-[14px] font-black">오프라인 (출근)</span>
                                </label>
                            </div>
                        </div>

                        {/* Location Picker (if offline) */}
                        <AnimatePresence>
                            {offline && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <div className="mt-4 rounded-[2rem] border border-orange-200 bg-orange-50/30 p-6 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className="text-[#FF7D00]" />
                                            <span className="text-[12px] font-black text-[#FF7D00] uppercase tracking-widest">출근_위치_설정</span>
                                        </div>

                                        {kakaoJavascriptKey ? (
                                            <KakaoLocationPicker javascriptKey={kakaoJavascriptKey} value={{ address: location, latitude: String(latitude), longitude: String(longitude) }} onChangeAction={(v) => { setLocation(v.address); setLatitude(String(v.latitude)); setLongitude(String(v.longitude)); }} />
                                        ) : (
                                            <div className="p-4 bg-red-50 text-red-600 text-[13px] font-bold rounded-xl border border-red-100">⚠️ API 키를 확인해주세요.</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Skills Requirement */}
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <Sparkles size={14} className="text-[#7A4FFF]" />
                                <label className="text-[12px] font-black uppercase tracking-widest text-zinc-400">요구_기술스택</label>
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

                {/* Footer Actions */}
                <div className="p-6 md:p-8 flex-none border-t border-zinc-100 bg-zinc-50/50 backdrop-blur-sm">
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
                                className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-zinc-950 px-10 py-4.5 text-[14px] font-black text-white transition-all hover:bg-[#7A4FFF] hover:shadow-[0_12px_30px_rgba(122,79,255,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting || isSkillsLoading ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                        <span>등록 중...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} strokeWidth={2.5} />
                                        <span>프로젝트 등록하기</span>
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
                                    <span>프로젝트 등록 완료</span>
                                </>
                            )}
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shimmer" />
                        </button>
                    )}
                </div>
            </form>

            {/* 🎯 [ 모달 팝업 추가] */}
            <AnimatePresence>
                {isModalOpen && newProjectId && (
                    <MatchingresultForm
                        projectId={newProjectId}
                        onClose={() => {
                            setIsModalOpen(false);
                            if (onSaved) {
                                onSaved(newProjectId);
                            } else {
                                router.push("/client/dashboard");
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}