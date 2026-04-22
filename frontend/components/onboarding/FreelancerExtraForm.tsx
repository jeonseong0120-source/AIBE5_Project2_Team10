"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import api from "../../app/lib/axios";
import { MAX_SELECTED_SKILLS } from "@/app/lib/skillLimits";
import KakaoLocationPicker from "@/components/project/KakaoLocationPicker";
import { MapPin, MessageSquare, DollarSign, Zap, Code } from "lucide-react";

interface FreelancerExtraFormProps {
    freelancerData: {
        introduction: string;
        location: string;
        latitude: number;
        longitude: number;
        hourlyRate: number;
        workStyle: string;
        skillIds: number[];
    };
    setFreelancerData: (data: any) => void;
}

export default function FreelancerExtraForm({ freelancerData, setFreelancerData }: FreelancerExtraFormProps) {
    const [availableSkills, setAvailableSkills] = useState<{skillId: number, name: string, category: string}[]>([]);
    const kakaoJavascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ?? "";

    const inputStyle = "w-full pl-12 pr-4 py-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl outline-none transition-all font-bold text-sm focus:ring-4 focus:ring-[#7A4FFF]/10 focus:border-[#7A4FFF] focus:bg-white";
    const labelStyle = "text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest block mb-2";

    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const res = await api.get("/v1/skills/default");
                setAvailableSkills(res.data);
            } catch (err) {
                console.error("스킬 목록을 불러오지 못했습니다.", err);
            }
        };
        fetchSkills();
    }, []);

    const toggleSkill = (skillId: number) => {
        const cur = freelancerData.skillIds;
        const newSkills = cur.includes(skillId)
            ? cur.filter((id) => id !== skillId)
            : cur.length >= MAX_SELECTED_SKILLS
                ? cur
                : [...cur, skillId];
        setFreelancerData({ ...freelancerData, skillIds: newSkills });
    };

    const formatNumber = (num: number) => num.toLocaleString("ko-KR");

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, "");
        const numValue = value ? parseInt(value) : 0;
        setFreelancerData({ ...freelancerData, hourlyRate: numValue });
    };

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
        >
            <div className="pt-8 mt-8 border-t border-zinc-100 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-[#7A4FFF] rounded-full animate-pulse"></span>
                    <p className="text-[10px] font-black text-[#7A4FFF] uppercase tracking-[0.2em]">Professional Arsenal</p>
                </div>

                {/* 한 줄 소개 */}
                <div className="group">
                    <label className={labelStyle}>One-line Introduction *</label>
                    <div className="relative">
                        <MessageSquare className="absolute left-4 top-4 text-zinc-300 group-focus-within:text-[#7A4FFF] transition-colors" size={18} />
                        <textarea
                            value={freelancerData.introduction}
                            onChange={(e) => setFreelancerData({ ...freelancerData, introduction: e.target.value })}
                            placeholder="당신의 기술력과 경험을 짧게 소개해 주세요."
                            className={`${inputStyle} min-h-[100px] resize-none py-4`}
                        />
                    </div>
                </div>

                {/* 활동 지역 설정 */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <label className={labelStyle}>Activity Location</label>
                        {freelancerData.location && (
                            <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-[10px] font-black text-[#7A4FFF] bg-[#7A4FFF]/5 px-2 py-0.5 rounded border border-[#7A4FFF]/10">
                                {freelancerData.location}
                            </motion.span>
                        )}
                    </div>
                    <div className="p-2 bg-zinc-50/50 rounded-3xl border border-zinc-100 overflow-hidden shadow-inner hover:bg-white hover:border-[#7A4FFF]/20 transition-all">
                        {kakaoJavascriptKey ? (
                            <KakaoLocationPicker
                                javascriptKey={kakaoJavascriptKey}
                                value={{
                                    address: freelancerData.location,
                                    latitude: String(freelancerData.latitude),
                                    longitude: String(freelancerData.longitude)
                                }}
                                onChangeAction={(v) => {
                                    setFreelancerData({
                                        ...freelancerData,
                                        location: v.address,
                                        latitude: Number(v.latitude),
                                        longitude: Number(v.longitude)
                                    });
                                }}
                            />
                        ) : (
                            <div className="p-6 text-center text-red-500 text-xs font-bold uppercase tracking-widest font-mono">
                                // ERROR: KAKAO_API_KEY_MISSING
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 희망 시급 */}
                    <div className="group">
                        <label className={labelStyle}>Hourly Rate (₩) *</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#7A4FFF] transition-colors" size={18} />
                            <input
                                type="text"
                                value={formatNumber(freelancerData.hourlyRate)}
                                onChange={handlePriceChange}
                                placeholder="0"
                                className={`${inputStyle} pr-12 text-right`}
                            />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">KRW</span>
                        </div>
                    </div>

                    {/* 작업 방식 */}
                    <div>
                        <label className={labelStyle}>Work Style</label>
                        <div className="flex p-1 bg-zinc-100 rounded-2xl gap-1 border border-zinc-200 shadow-inner">
                            {["ONLINE", "OFFLINE", "HYBRID"].map((style) => (
                                <button
                                    key={style}
                                    type="button"
                                    onClick={() => setFreelancerData({ ...freelancerData, workStyle: style })}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${
                                        freelancerData.workStyle === style
                                            ? "bg-white text-[#7A4FFF] shadow-md ring-1 ring-black/5"
                                            : "text-zinc-400 hover:text-zinc-600"
                                    }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 기술 스택 선택 */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <label className={labelStyle}>Tech Stacks (Arsenal)</label>
                        <span className="text-[10px] font-mono font-bold text-zinc-400">
                            {freelancerData.skillIds.length}/{MAX_SELECTED_SKILLS} Selected
                        </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto rounded-[2.5rem] border border-zinc-100 bg-zinc-50/50 p-5 shadow-inner custom-scrollbar">
                        <div className="flex flex-wrap gap-2.5">
                            {availableSkills.map((skill) => {
                                const on = freelancerData.skillIds.includes(skill.skillId);
                                const atCap = !on && freelancerData.skillIds.length >= MAX_SELECTED_SKILLS;
                                return (
                                    <motion.button
                                        whileHover={!atCap ? { scale: 1.05 } : {}}
                                        whileTap={!atCap ? { scale: 0.95 } : {}}
                                        key={skill.skillId}
                                        type="button"
                                        disabled={atCap}
                                        onClick={() => toggleSkill(skill.skillId)}
                                        className={`rounded-xl border px-4 py-2 text-[11px] font-black transition-all ${
                                            on
                                                ? "border-[#7A4FFF] bg-[#7A4FFF] text-white shadow-[0_5px_15px_-5px_rgba(122,79,255,0.4)]"
                                                : atCap
                                                    ? "opacity-30 cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-300"
                                                    : "border-zinc-200 bg-white text-zinc-500 hover:border-[#7A4FFF]/30 hover:text-[#7A4FFF]"
                                        }`}
                                    >
                                        {on && <Zap size={10} className="inline mr-1 fill-current" />}
                                        {skill.name}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}