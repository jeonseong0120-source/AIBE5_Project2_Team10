"use client";

import { FormEvent, useState, useEffect } from "react";
import KakaoLocationPicker from "@/components/project/KakaoLocationPicker";
import SkillTagSelector from "@/components/project/SkillTagSelector";
import api from "@/app/lib/axios";
import { useRouter } from "next/navigation";
import { DollarSign, Calendar, MapPin, ArrowLeft, Type, Activity, List } from "lucide-react"; // 추가 아이콘 임포트
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

    // [Fix] Coderabbit 리뷰 반영: initialData에 skillIds가 없을 수 있으므로 빈 배열로 초기화하고
    // useEffect에서 skillNames를 기반으로 skillIds를 동기화합니다.
    const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(initialData.skillIds || []);
    
    const [submitting, setSubmitting] = useState(false);
    const [isSkillsLoading, setIsSkillsLoading] = useState(true);
    const [mappingSucceeded, setMappingSucceeded] = useState(true); // 기본적으로는 true, 실패 시 false로 변경
    const [cursor, setCursor] = useState({ x: 0, y: 0 });

    const kakaoJavascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ?? "";

    useEffect(() => {
        const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    // 스킬 이름 -> 스킬 ID 동기화
    useEffect(() => {
        const syncSkillIds = async () => {
            try {
                if (initialData.skillIds && initialData.skillIds.length > 0) {
                    setSelectedSkillIds(initialData.skillIds);
                    setIsSkillsLoading(false);
                    setMappingSucceeded(true);
                    return;
                }
                const res = await api.get("/v1/skills/default");
                const allSkills = res.data;
                if (initialData.skillNames && initialData.skillNames.length > 0) {
                    const matchedIds = allSkills
                        .filter((s: any) => initialData.skillNames.includes(s.name))
                        .map((s: any) => s.skillId);
                    
                    if (matchedIds.length > 0) {
                        setSelectedSkillIds(matchedIds);
                        setMappingSucceeded(true);
                    } else {
                        // API 호출은 성공했으나, 이름과 일치하는 스킬이 없는 경우
                        // 기존에 선택된 ID를 유지하여 초기화 방지
                        setMappingSucceeded(false);
                    }
                } else {
                    // skillNames 자체가 없으면 매핑 성공 처리 (할 게 없음)
                    setMappingSucceeded(true);
                }
            } catch (err) {
                console.error("기술 목록 동기화 실패:", err);
                // API 호출 실패 시 기존 선택된 ID 유지
                setMappingSucceeded(false);
            } finally {
                setIsSkillsLoading(false);
            }
        };
        syncSkillIds();
    }, [initialData.skillNames, initialData.skillIds]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        // [Fix] Coderabbit 리뷰 반영: 스킬 매핑 실패 또는 로딩 중일 때 제출 차단
        if (isSkillsLoading) {
            return alert("기술 목록을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        }
        if (!mappingSucceeded) {
            return alert("기존 프로젝트 기술 스택을 불러오는데 실패했습니다. 계속 진행하면 기술 스택이 초기화될 수 있습니다. 새로고침을 시도해 주세요.");
        }

        // [Fix] Coderabbit 리뷰 반영: 온라인/오프라인 중 하나는 무조건 선택해야 함
        if (!online && !offline) {
            return alert("근무 방식은 온라인 또는 오프라인 중 하나 이상을 선택해야 합니다.");
        }
        
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
                // 백엔드 에러 방지를 위해 빈 배열이라도 추가
                skillNames: []
            };

            if (offline) {
                // [Fix] Coderabbit 리뷰 반영: 오프라인 선택 시 좌표 데이터 검증 (NaN 방지)
                const lat = Number(latitude);
                const lng = Number(longitude);
                
                if (!location.trim() || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                    setSubmitting(false);
                    return alert("오프라인 근무를 위한 주소(좌표) 정보를 정확히 입력해 주세요.");
                }
                
                payload.location = location;
                payload.latitude = lat;
                payload.longitude = lng;
            } else {
                // 온라인 전용일 때는 null이나 기본값 전송
                payload.location = null;
                payload.latitude = null;
                payload.longitude = null;
            }

            // axios 인터셉터 설정(/api/v1)에 맞게 경로 지정
            await api.put(`/v1/projects/${projectId}`, payload);
            alert("✅ 프로젝트 수정이 완료되었습니다.");
            router.push("/client/dashboard");
            
        } catch (err: any) {
            console.error(err);
            const serverMessage = err.response?.data?.message || err.response?.data || "서버 오류";
            alert(`❌ 수정 실패: ${serverMessage}`);
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
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono flex items-center gap-2">
                            <Type className="w-3.5 h-3.5 text-[#FF7D00]" /> Project_Title
                        </label>
                        <input required className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-bold focus:ring-2 focus:ring-[#FF7D00] outline-none transition-all"
                               value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="프로젝트명을 입력하세요" />
                    </div>

                    {/* 예산 및 마감일 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono flex items-center gap-2">
                                <DollarSign className="w-3.5 h-3.5 text-[#FF7D00]" /> Budget (₩)
                            </label>
                            <input type="number" required min="0" className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-[#FF7D00]"
                                   value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="예산 입력 (원)" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-[#FF7D00]" /> Deadline
                            </label>
                            <input type="date" required className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-[#FF7D00] text-zinc-700"
                                   value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                        </div>
                    </div>

                    {/* 상세 설명 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono flex items-center gap-2">
                            <Type className="w-3.5 h-3.5 text-[#FF7D00]" /> Description
                        </label>
                        <textarea required className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl min-h-[150px] outline-none focus:ring-2 focus:ring-[#FF7D00] text-sm font-medium resize-none leading-relaxed"
                                  value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="상세 내용을 입력하세요" />
                    </div>

                    {/* 근무 방식 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-[#FF7D00]" /> Work_Style
                        </label>
                        <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 flex gap-8">
                            <label className="flex items-center gap-3 font-bold text-xs cursor-pointer"><input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} className="w-4 h-4 accent-[#FF7D00]" />온라인</label>
                            <label className="flex items-center gap-3 font-bold text-xs cursor-pointer"><input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} className="w-4 h-4 accent-[#FF7D00]" />오프라인</label>
                        </div>
                    </div>

                    {/* 오프라인 주소 (카카오맵) */}
                    <AnimatePresence>
                        {offline && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-4">
                                    <div className="flex items-center gap-2"><MapPin size={14} className="text-[#FF7D00]" /><span className="text-[10px] font-black text-[#FF7D00] uppercase font-mono tracking-widest">Location_Details</span></div>
                                    
                                    {/* [Fix] Coderabbit 리뷰 반영: 카카오 키가 없으면 안내 문구 표시 */}
                                    {kakaoJavascriptKey ? (
                                        <KakaoLocationPicker javascriptKey={kakaoJavascriptKey} value={{ address: location, latitude: Number(latitude), longitude: Number(longitude) }}
                                                             onChangeAction={(v) => { setLocation(v.address); setLatitude(String(v.latitude)); setLongitude(String(v.longitude)); }} />
                                    ) : (
                                        <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                                            ⚠️ 카카오맵 API 키가 설정되지 않아 주소 검색 기능을 사용할 수 없습니다.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 기술 스택 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono flex items-center gap-2">
                            <List className="w-3.5 h-3.5 text-[#FF7D00]" /> Tech_Stack
                        </label>
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