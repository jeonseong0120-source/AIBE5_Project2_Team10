"use client";

import { FormEvent, useState, useEffect } from "react";
import KakaoLocationPicker from "@/components/project/KakaoLocationPicker";
import SkillTagSelector from "@/components/project/SkillTagSelector";
import { updateProject } from "@/app/lib/projectApi";
import api from "@/app/lib/axios";
import { useRouter } from "next/navigation";
import { DollarSign, Calendar, MapPin, ArrowLeft } from "lucide-react"; // 🔍 ArrowLeft 추가

export default function ProjectEditForm({ projectId, initialData }: any) {
    const router = useRouter();

    const [projectName, setProjectName] = useState(initialData.projectName);
    const [budget, setBudget] = useState(String(initialData.budget));
    const [deadline, setDeadline] = useState(initialData.deadline);
    const [detail, setDetail] = useState(initialData.detail || "");
    const [online, setOnline] = useState(initialData.online);
    const [offline, setOffline] = useState(initialData.offline);
    const [location, setLocation] = useState(initialData.location || "");
    const [latitude, setLatitude] = useState(String(initialData.latitude || ""));
    const [longitude, setLongitude] = useState(String(initialData.longitude || ""));

    const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(initialData.skillIds || []);
    const [submitting, setSubmitting] = useState(false);
    const [isSkillsLoading, setIsSkillsLoading] = useState(true);
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
                const res = await api.get("/v1/skills/default");
                const allSkills = res.data;
                if (initialData.skillNames && initialData.skillNames.length > 0) {
                    const matchedIds = allSkills
                        .filter((s: any) => initialData.skillNames.includes(s.name))
                        .map((s: any) => s.skillId);
                    setSelectedSkillIds(matchedIds);
                }
            } catch (err) {
                console.error("기술 목록 동기화 실패:", err);
            } finally {
                setIsSkillsLoading(false);
            }
        };
        syncSkillIds();
    }, [initialData.skillNames, initialData.skillIds]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!online && !offline) return alert("근무 방식은 하나 이상 선택해야 합니다.");
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
            };
            if (offline) {
                payload.location = location;
                payload.latitude = Number(latitude);
                payload.longitude = Number(longitude);
            }
            await updateProject(projectId, payload);
            alert("✅ 프로젝트 수정이 완료되었습니다.");
            router.push("/client/dashboard");
        } catch (err: any) {
            alert(`❌ 수정 실패: ${err.response?.data?.message || "서버 오류"}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 relative overflow-hidden font-sans pb-20">
            {/* 🔥 커서 글로우 */}
            <div className="pointer-events-none fixed z-0 w-[400px] h-[400px] rounded-full bg-[#FF7D00]/10 blur-[120px] transition-all duration-300"
                 style={{ left: cursor.x - 200, top: cursor.y - 200 }} />

            {/* 헤더 섹션 (뒤로가기 버튼 적용) */}
            <section className="relative pt-16 pb-12 px-8 bg-white border-b border-zinc-200 overflow-hidden mb-10">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="max-w-xl mx-auto relative z-10">
                    <div className="flex items-center gap-4">
                        {/* 🔍 뒤로가기 버튼 */}
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-400 hover:text-[#FF7D00] hover:border-[#FF7D00]/30 hover:bg-orange-50 transition-all group"
                        >
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
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono">Project_Title</label>
                        <input required className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-bold focus:ring-2 focus:ring-[#FF7D00] outline-none transition-all"
                               value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="프로젝트명을 입력하세요" />
                    </div>

                    {/* 예산 및 마감일 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono">Budget (₩)</label>
                            <div className="relative">
                                <input type="number" className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-[#FF7D00]"
                                       value={budget} onChange={(e) => setBudget(e.target.value)} />
                                <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF7D00]" size={16} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono">Deadline</label>
                            <div className="relative">
                                <input type="date" className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-[#FF7D00]"
                                       value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* 상세 설명 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono">Description</label>
                        <textarea className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl min-h-[150px] outline-none focus:ring-2 focus:ring-[#FF7D00] text-sm font-medium"
                                  value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="상세 내용을 입력하세요" />
                    </div>

                    {/* 근무 방식 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono">Work_Style</label>
                        <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 flex gap-8">
                            <label className="flex items-center gap-3 font-bold text-xs cursor-pointer"><input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} className="w-4 h-4 accent-[#FF7D00]" />온라인</label>
                            <label className="flex items-center gap-3 font-bold text-xs cursor-pointer"><input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} className="w-4 h-4 accent-[#FF7D00]" />오프라인</label>
                        </div>
                    </div>

                    {offline && (
                        <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-4">
                            <div className="flex items-center gap-2"><MapPin size={14} className="text-[#FF7D00]" /><span className="text-[10px] font-black text-[#FF7D00] uppercase font-mono">Location</span></div>
                            <KakaoLocationPicker javascriptKey={kakaoJavascriptKey} value={{ address: location, latitude, longitude }}
                                                 onChangeAction={(v) => { setLocation(v.address); setLatitude(v.latitude); setLongitude(v.longitude); }} />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono">Tech_Stack</label>
                        <SkillTagSelector selectedSkillIds={selectedSkillIds} onChangeAction={setSelectedSkillIds} initialSkillNames={initialData.skillNames} />
                    </div>
                </div>

                <button type="submit" disabled={submitting || isSkillsLoading}
                        className="w-full py-5 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#FF7D00] transition-all shadow-xl shadow-zinc-200 active:scale-95 disabled:bg-zinc-200">
                    {isSkillsLoading ? "Syncing..." : submitting ? "Saving..." : "수정 완료하기"}
                </button>
            </form>
        </div>
    );
}