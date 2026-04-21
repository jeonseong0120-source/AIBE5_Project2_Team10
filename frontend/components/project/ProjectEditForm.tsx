"use client";

import { FormEvent, useState, useEffect } from "react";
import KakaoLocationPicker from "@/components/project/KakaoLocationPicker";
import SkillTagSelector from "@/components/project/SkillTagSelector";
import api from "@/app/lib/axios";
import { useRouter } from "next/navigation";
import { DollarSign, Calendar, MapPin, ArrowLeft, Type, Activity, List } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function ProjectEditForm({ projectId, initialData }: any) {
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

    const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(initialData.skillIds || []);
    const [submitting, setSubmitting] = useState(false);
    const [isSkillsLoading, setIsSkillsLoading] = useState(true);

    // 🔍 [Fix] 동기화 성공 여부 (초기값은 true로 설정하여 수동 선택 시 제출 가능하도록 관리)
    const [mappingSucceeded, setMappingSucceeded] = useState(true);
    const [cursor, setCursor] = useState({ x: 0, y: 0 });

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
                    setSelectedSkillIds(initialData.skillIds);
                    setIsSkillsLoading(false);
                    return;
                }

                // [Fix] API 호출 경로는 baseURL을 고려하여 설정 (v1 포함 여부 확인)
                const res = await api.get("/v1/skills/default");
                const allSkills = res.data;

                if (initialData.skillNames && initialData.skillNames.length > 0) {
                    const matchedIds = allSkills
                        .filter((s: any) => initialData.skillNames.includes(s.name))
                        .map((s: any) => s.skillId);

                    if (matchedIds.length > 0) {
                        setSelectedSkillIds(matchedIds);
                    } else {
                        // 🔍 매핑 실패 시 플래그를 false로 전환
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

        if (isSkillsLoading) return alert("기술 목록을 불러오는 중입니다.");

        // 🔍 [Fix] 리뷰 반영: 동기화에 실패했더라도, 사용자가 수동으로 기술을 선택했다면 제출 허용
        if (!mappingSucceeded && selectedSkillIds.length === 0) {
            return alert("기술 스택 정보를 불러오지 못했습니다. 수동으로 기술 스택을 다시 선택해 주세요.");
        }

        if (!online && !offline) return alert("근무 방식을 하나 이상 선택해야 합니다.");

        // 🔍 [Fix] 리뷰 반영: 예산 검증 기준(1원 이상) 일치
        if (Number(budget) <= 0) return alert("예산은 1원 이상이어야 합니다.");

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
                    return alert("오프라인 주소 정보를 정확히 입력해 주세요.");
                }
                payload.location = location;
                payload.latitude = lat;
                payload.longitude = lng;
            } else {
                payload.location = null;
                payload.latitude = null;
                payload.longitude = null;
            }

            // 🔍 [Fix] 리뷰 반영: baseURL(/api) 중복 방지를 위해 경로 수정
            await api.put(`/projects/${projectId}`, payload);
            alert("✅ 프로젝트 수정이 완료되었습니다.");
            router.push("/client/dashboard");
        } catch (err: any) {
            console.error(err);
            alert(`❌ 수정 실패: ${err.response?.data?.message || "서버 오류"}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 relative overflow-hidden font-sans pb-20">
            {/* 커서 글로우 */}
            <div
                className="pointer-events-none fixed left-0 top-0 z-0 h-[400px] w-[400px] rounded-full bg-[#FF7D00]/10 blur-[120px] will-change-transform"
                style={{ transform: `translate(${cursor.x - 200}px, ${cursor.y - 200}px)` }}
            />

            {/* 헤더 섹션 */}
            <section className="relative pt-16 pb-12 px-8 bg-white border-b border-zinc-200 overflow-hidden mb-10">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="max-w-xl mx-auto relative z-10">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => router.back()} className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-400 hover:text-[#FF7D00] transition-all group">
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-8 h-[2px] bg-[#FF7D00]"></span>
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono">Project_Editor</span>
                            </div>
                            <h1 className="text-4xl font-black tracking-tight">프로젝트 수정</h1>
                        </div>
                    </div>
                </div>
            </section>

            <form onSubmit={handleSubmit} className="mx-auto max-w-xl bg-white p-10 rounded-[2.5rem] shadow-xl border border-zinc-100 space-y-8 relative z-10">
                <div className="space-y-6">
                    {/* 프로젝트명 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono flex items-center gap-2"><Type className="w-3.5 h-3.5 text-[#FF7D00]" /> Project_Title</label>
                        <input required className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-bold focus:ring-2 focus:ring-[#FF7D00] outline-none transition-all" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                    </div>

                    {/* 예산 및 마감일 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-[#FF7D00]" /> Budget (₩)</label>
                            <input type="number" required min="1" className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-[#FF7D00]" value={budget} onChange={(e) => setBudget(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-[#FF7D00]" /> Deadline</label>
                            <input type="date" required className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-[#FF7D00]" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                        </div>
                    </div>

                    {/* 상세 설명 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono flex items-center gap-2"><Type className="w-3.5 h-3.5 text-[#FF7D00]" /> Description</label>
                        <textarea required className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl min-h-[150px] outline-none text-sm font-medium resize-none leading-relaxed focus:ring-2 focus:ring-[#FF7D00]" value={detail} onChange={(e) => setDetail(e.target.value)} />
                    </div>

                    {/* 근무 방식 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-[#FF7D00]" /> Work_Style</label>
                        <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 flex gap-8">
                            <label className="flex items-center gap-3 font-bold text-xs cursor-pointer"><input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} className="w-4 h-4 accent-[#FF7D00]" />온라인</label>
                            <label className="flex items-center gap-3 font-bold text-xs cursor-pointer"><input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} className="w-4 h-4 accent-[#FF7D00]" />오프라인</label>
                        </div>
                    </div>

                    {/* 오프라인 주소 */}
                    <AnimatePresence>
                        {offline && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-4">
                                    <div className="flex items-center gap-2"><MapPin size={14} className="text-[#FF7D00]" /><span className="text-[10px] font-black text-[#FF7D00] uppercase font-mono tracking-widest">Location_Details</span></div>

                                    {kakaoJavascriptKey ? (
                                        <KakaoLocationPicker
                                            javascriptKey={kakaoJavascriptKey}
                                            value={{ address: location, latitude: latitude, longitude: longitude }}
                                            onChangeAction={(v) => {
                                                setLocation(v.address);
                                                setLatitude(String(v.latitude));
                                                setLongitude(String(v.longitude));
                                            }}
                                        />
                                    ) : (
                                        <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">⚠️ 카카오맵 API 키가 없습니다.</div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 기술 스택 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono flex items-center gap-2"><List className="w-3.5 h-3.5 text-[#FF7D00]" /> Tech_Stack</label>
                        <SkillTagSelector
                            selectedSkillIds={selectedSkillIds}
                            onChangeAction={setSelectedSkillIds}
                            initialSkillNames={initialData.skillNames}
                            suggestSourceText={detail}
                            suggestContext="project"
                        />
                    </div>
                </div>

                <button type="submit" disabled={submitting || isSkillsLoading}
                        className="w-full py-5 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#FF7D00] transition-all shadow-xl disabled:bg-zinc-200 active:scale-[0.98]">
                    {isSkillsLoading ? "Syncing..." :
                        (!mappingSucceeded && selectedSkillIds.length === 0) ? "Please select Tech Stack" :
                            submitting ? "Saving..." : "수정 완료하기"}
                </button>
            </form>
        </div>
    );
}