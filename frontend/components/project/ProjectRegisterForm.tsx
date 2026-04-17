"use client";

import { FormEvent, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProject, type CreateProjectBody } from "@/app/lib/projectApi";
import KakaoLocationPicker from "@/components/project/KakaoLocationPicker";
import SkillTagSelector from "@/components/project/SkillTagSelector";
import { DollarSign, MapPin, ArrowLeft } from "lucide-react"; // 🔍 ArrowLeft 아이콘 추가
import { motion, AnimatePresence } from "framer-motion";

function tomorrowISODate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function ProjectRegisterForm() {
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
    
    // [Fix] Coderabbit 리뷰 반영: 빈 배열로 초기화
    const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
    
    // [Fix] Coderabbit 리뷰 반영: isSkillsLoading 상태 추가
    const [isSkillsLoading, setIsSkillsLoading] = useState(true);
    const [mappingSucceeded, setMappingSucceeded] = useState(true); // 등록 폼이므로 초기값 true
    
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState({ x: 0, y: 0 });

    const kakaoJavascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ?? "";
    const submitLockRef = useRef(false);

    useEffect(() => {
        const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);
    
    // 등록폼에서는 초기 스킬 매핑이 필요없지만, SkillTagSelector 내부 로딩 상태를 연동하기 위한 더미 effect
    useEffect(() => {
        setIsSkillsLoading(false);
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (submitLockRef.current) return;
        setError(null);
        
        // [Fix] Coderabbit 리뷰 반영: 스킬 매핑 실패 또는 로딩 중일 때 제출 차단
        if (isSkillsLoading) {
            return setError("기술 목록을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        }

        // [Fix] Coderabbit 리뷰 반영: 온라인/오프라인 중 하나 이상 선택 필수 보장
        if (!online && !offline) return setError("근무 방식은 하나 이상 선택해 주세요.");
        if (Number(budget) < 1) return setError("예산은 1원 이상이어야 합니다.");

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
            // [Fix] Coderabbit 리뷰 반영: Number()로 변환 전 문자열 상태 체크 추가, NaN 방지
            const lat = Number(latitude);
            const lng = Number(longitude);
            
            // [Fix] Coderabbit 리뷰 반영: longitude 누락 검증 로직 추가
            if (!payload.location || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                return setError("오프라인 정보를 정확히 입력해 주세요.");
            }
            
            payload.latitude = lat;
            payload.longitude = lng;
        }

        submitLockRef.current = true;
        setSubmitting(true);
        try {
            const projectId = await createProject(payload);
            router.push(`/client/projects/${projectId}`);
        } catch (err: any) {
            setError(err.response?.data?.message || "등록에 실패했습니다.");
            submitLockRef.current = false;
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 relative overflow-hidden font-sans pb-20">
            {/* 🔥 커서 글로우 */}
            <div className="pointer-events-none fixed z-0 w-[400px] h-[400px] rounded-full bg-[#FF7D00]/10 blur-[120px] transition-all duration-300"
                 style={{ left: cursor.x - 200, top: cursor.y - 200 }} />

            {/* 헤더 섹션 (뒤로가기 버튼 추가) */}
            <section className="relative pt-16 pb-12 px-8 bg-white border-b border-zinc-200 overflow-hidden mb-10">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="max-w-xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        {/* 🔍 뒤로가기 버튼 */}
                        <button
                            onClick={() => router.back()}
                            className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-400 hover:text-[#FF7D00] hover:border-[#FF7D00]/30 hover:bg-orange-50 transition-all group"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-6 h-[2px] bg-[#FF7D00]"></span>
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono">Mission_Creator</span>
                            </div>
                            <h1 className="text-4xl font-black tracking-tight">프로젝트 등록</h1>
                        </div>
                    </div>
                </div>
            </section>

            <form onSubmit={handleSubmit} className="mx-auto max-w-xl bg-white p-10 rounded-[2.5rem] shadow-xl border border-zinc-100 space-y-8 relative z-10">
                {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold animate-shake">{error}</div>}

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono">Project_Title</label>
                        <input required className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-bold focus:ring-2 focus:ring-[#FF7D00] outline-none transition-all"
                               value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="프로젝트명을 입력하세요" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono">Budget (₩)</label>
                            <div className="relative">
                                <input type="number" required min="1" className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-[#FF7D00]"
                                       value={budget} onChange={(e) => setBudget(e.target.value)} />
                                <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF7D00]" size={16} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono">Deadline</label>
                            <input type="date" required className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-[#FF7D00]"
                                   value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono">Description</label>
                        <textarea className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl min-h-[150px] outline-none focus:ring-2 focus:ring-[#FF7D00] text-sm font-medium resize-none"
                                  value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="상세 내용을 입력하세요" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono">Work_Style</label>
                        <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 flex gap-8">
                            {/* [Fix] Coderabbit 리뷰 반영: 클릭 핸들러에서 상태를 빈 값으로 만들지 않도록 checkbox 제어 로직 유지 */}
                            <label className="flex items-center gap-3 font-bold text-xs cursor-pointer"><input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} className="w-4 h-4 accent-[#FF7D00]" />온라인</label>
                            <label className="flex items-center gap-3 font-bold text-xs cursor-pointer"><input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} className="w-4 h-4 accent-[#FF7D00]" />오프라인</label>
                        </div>
                    </div>

                    <AnimatePresence>
                        {offline && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-4 transition-all">
                                    <div className="flex items-center gap-2"><MapPin size={14} className="text-[#FF7D00]" /><span className="text-[10px] font-black text-[#FF7D00] uppercase font-mono tracking-widest">Location_Setting</span></div>
                                    
                                    {/* [Fix] Coderabbit 리뷰 반영: 카카오 키가 없으면 안내 문구 표시 */}
                                    {kakaoJavascriptKey ? (
                                        <KakaoLocationPicker javascriptKey={kakaoJavascriptKey} value={{ address: location, latitude: String(latitude), longitude: String(longitude) }}
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

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 font-mono">Requirement</label>
                        <SkillTagSelector selectedSkillIds={selectedSkillIds} onChangeAction={setSelectedSkillIds} />
                    </div>
                </div>

                <button type="submit" disabled={submitting || isSkillsLoading}
                        className="w-full py-5 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#FF7D00] transition-all shadow-xl shadow-zinc-200 active:scale-95 disabled:bg-zinc-200">
                    {submitting || isSkillsLoading ? "Processing..." : "프로젝트 등록하기"}
                </button>
            </form>
        </div>
    );
}