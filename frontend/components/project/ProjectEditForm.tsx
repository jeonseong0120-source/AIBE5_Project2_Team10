"use client";

import { FormEvent, useState, useEffect } from "react";
import KakaoLocationPicker from "@/components/project/KakaoLocationPicker";
import SkillTagSelector from "@/components/project/SkillTagSelector";
import { updateProject } from "@/app/lib/projectApi";
import api from "@/app/lib/axios"; // 🔍 전체 기술 목록 조회를 위해 추가
import { useRouter } from "next/navigation";
import { Activity, DollarSign, Calendar, MapPin } from "lucide-react";

export default function ProjectEditForm({ projectId, initialData }: any) {
    const router = useRouter();

    // 상태 관리
    const [projectName, setProjectName] = useState(initialData.projectName);
    const [budget, setBudget] = useState(String(initialData.budget));
    const [deadline, setDeadline] = useState(initialData.deadline);
    const [detail, setDetail] = useState(initialData.detail || "");
    const [online, setOnline] = useState(initialData.online);
    const [offline, setOffline] = useState(initialData.offline);
    const [location, setLocation] = useState(initialData.location || "");
    const [latitude, setLatitude] = useState(String(initialData.latitude || ""));
    const [longitude, setLongitude] = useState(String(initialData.longitude || ""));

    // 🔍 [수정] 초기 ID는 빈 배열로 시작하되, useEffect에서 매칭 로직 실행
    const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(initialData.skillIds || []);
    const [submitting, setSubmitting] = useState(false);
    const [isSkillsLoading, setIsSkillsLoading] = useState(true);

    // 🔍 [추가] 이름 기반으로 ID를 찾아내는 데이터 동기화 로직
    useEffect(() => {
        const syncSkillIds = async () => {
            try {
                // 이미 ID가 있다면 스킵 (혹은 최신화)
                if (initialData.skillIds && initialData.skillIds.length > 0) {
                    setSelectedSkillIds(initialData.skillIds);
                    setIsSkillsLoading(false);
                    return;
                }

                // 백엔드에서 전체 기술 목록을 가져옴
                const res = await api.get("/v1/skills/default");
                const allSkills = res.data; // [{ skillId: 1, name: "Java" }, ...]

                // initialData.skillNames와 매칭되는 ID 추출
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

        // 🔍 [검증] 근무 방식 최소 하나 선택 강제
        if (!online && !offline) {
            alert("⚠️ 근무 방식은 온라인 또는 오프라인 중 최소 하나 이상 선택해야 합니다.");
            return;
        }

        // 🔍 [검증] 예산 확인
        if (Number(budget) <= 0) {
            alert("⚠️ 예산은 0원보다 커야 합니다.");
            return;
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
                // 🔍 동기화된 ID 배열을 전송
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
            console.error("수정 실패:", err);
            alert(`❌ 수정 실패: ${err.response?.data?.message || "서버 내부 오류(500)"}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-xl bg-white p-10 rounded-[3rem] shadow-xl border border-zinc-100 space-y-8 mt-10 relative z-10"
        >
            <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-[#FF7D00] rounded-full animate-pulse"></span>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Edit_Mission_Profile</h2>
            </div>

            <div className="space-y-6">
                {/* 프로젝트 제목 */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Project_Title</label>
                    <input
                        required
                        className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-bold focus:ring-2 focus:ring-[#FF7D00] outline-none transition-all"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="작전명을 입력하세요"
                    />
                </div>

                {/* 예산 및 마감일 */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Budget (₩)</label>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-[#FF7D00] transition-all"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="0"
                            />
                            <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Deadline</label>
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-[#FF7D00] transition-all"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                        </div>
                    </div>
                </div>

                {/* 상세 설명 */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea
                        className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl min-h-[150px] outline-none focus:ring-2 focus:ring-[#FF7D00] transition-all text-sm font-medium"
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                        placeholder="상세 내용을 입력하세요"
                    />
                </div>

                {/* 근무 방식 선택 */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Work_Style</label>
                    <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 flex gap-8">
                        <label className="flex items-center gap-3 font-black text-xs cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={online}
                                onChange={(e) => setOnline(e.target.checked)}
                                className="w-5 h-5 accent-[#FF7D00] rounded-md transition-all"
                            />
                            <span className={online ? "text-zinc-900" : "text-zinc-400"}>ONLINE</span>
                        </label>
                        <label className="flex items-center gap-3 font-black text-xs cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={offline}
                                onChange={(e) => setOffline(e.target.checked)}
                                className="w-5 h-5 accent-[#FF7D00] rounded-md transition-all"
                            />
                            <span className={offline ? "text-zinc-900" : "text-zinc-400"}>OFFLINE</span>
                        </label>
                    </div>
                </div>

                {/* 오프라인 장소 */}
                {offline && (
                    <div className="p-6 bg-orange-50/50 rounded-[2rem] border border-orange-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-[#FF7D00]" />
                            <span className="text-[10px] font-black text-[#FF7D00] uppercase tracking-widest">Location_Picker</span>
                        </div>
                        <KakaoLocationPicker
                            javascriptKey={process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY || ""}
                            value={{ address: location, latitude, longitude }}
                            onChangeAction={(v) => {
                                setLocation(v.address);
                                setLatitude(v.latitude);
                                setLongitude(v.longitude);
                            }}
                        />
                    </div>
                )}

                {/* 기술 스택 */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Required_Arsenal (Skills)</label>
                    <SkillTagSelector
                        selectedSkillIds={selectedSkillIds}
                        onChangeAction={setSelectedSkillIds}
                        initialSkillNames={initialData.skillNames}
                    />
                </div>
            </div>

            {/* 제출 버튼 */}
            <button
                type="submit"
                disabled={submitting || isSkillsLoading} // 🔍 데이터 동기화 전까지 비활성화
                className="w-full py-5 bg-zinc-950 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-[#FF7D00] transition-all shadow-xl shadow-zinc-200 active:scale-95 disabled:bg-zinc-200"
            >
                {isSkillsLoading ? "Syncing_Arsenal..." : submitting ? "Synchronizing_Data..." : "Finalize_Changes"}
            </button>
        </form>
    );
}