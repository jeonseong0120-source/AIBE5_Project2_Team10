"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import api from "../../app/lib/axios";
import { MAX_SELECTED_SKILLS } from "@/app/lib/skillLimits";
// 🎯 카카오 맵 위치 피커 임포트
import KakaoLocationPicker from "@/components/project/KakaoLocationPicker";
import { MapPin } from "lucide-react";

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

    // 환경변수에서 카카오 키 로드 (마스터의 설정에 맞게 확인해주세요!)
    const kakaoJavascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ?? "";

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

    const formatNumber = (num: number) => {
        return num.toLocaleString("ko-KR");
    };

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
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
        >
            <div className="pt-6 mt-6 border-t border-zinc-100 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-[#7A4FFF] rounded-full"></span>
                    <p className="text-[10px] font-black text-[#7A4FFF] uppercase tracking-widest">Professional Arsenal</p>
                </div>

                {/* 한 줄 소개 */}
                <div className="space-y-1">
                    <label htmlFor="intro-input" className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Introduction *</label>
                    <textarea
                        id="intro-input"
                        value={freelancerData.introduction}
                        onChange={(e) => setFreelancerData({ ...freelancerData, introduction: e.target.value })}
                        placeholder="마스터의 기술력과 경험을 짧게 소개해 주세요."
                        className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all min-h-[80px] resize-none text-sm"
                    />
                </div>

                {/* 활동 지역 설정 (카카오 맵 통합) */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest">Location</label>
                        {freelancerData.location && (
                            <span className="text-[10px] font-bold text-[#7A4FFF] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 animate-fade-in">
                                {freelancerData.location}
                             </span>
                        )}
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
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
                            <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                                ⚠️ 카카오 API 키가 설정되지 않았습니다. (.env 확인 필요)
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {/* 희망 시급 */}
                    <div className="space-y-1">
                        <label htmlFor="hourly-rate-input" className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Hourly Rate (₩) *</label>
                        <div className="relative">
                            <input
                                id="hourly-rate-input"
                                type="text"
                                value={formatNumber(freelancerData.hourlyRate)}
                                onChange={handlePriceChange}
                                placeholder="0"
                                className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all text-sm font-bold pr-8 text-right"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">원</span>
                        </div>
                    </div>
                </div>

                {/* 작업 방식 */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Work Style</label>
                    <div className="flex gap-2">
                        {["ONLINE", "OFFLINE", "HYBRID"].map((style) => (
                            <button
                                key={style}
                                type="button"
                                onClick={() => setFreelancerData({ ...freelancerData, workStyle: style })}
                                className={`flex-1 p-2 rounded-xl text-[10px] font-bold transition-all border ${
                                    freelancerData.workStyle === style
                                        ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                                        : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300"
                                }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 기술 스택 선택 (기존 로직 유지) */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest">
                        Tech Stacks * (1–{MAX_SELECTED_SKILLS}){" "}
                        <span className="text-zinc-500 normal-case">
                            ({freelancerData.skillIds.length}/{MAX_SELECTED_SKILLS})
                        </span>
                    </label>
                    <div className="max-h-56 overflow-y-auto rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3">
                        <div className="flex flex-wrap gap-2">
                            {availableSkills.map((skill) => {
                                const on = freelancerData.skillIds.includes(skill.skillId);
                                const atCap = !on && freelancerData.skillIds.length >= MAX_SELECTED_SKILLS;
                                return (
                                    <button
                                        key={skill.skillId}
                                        type="button"
                                        disabled={atCap}
                                        onClick={() => toggleSkill(skill.skillId)}
                                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all ${
                                            on
                                                ? "cursor-pointer border-[#7A4FFF] bg-[#7A4FFF] text-white shadow-md"
                                                : atCap
                                                    ? "cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-300"
                                                    : "cursor-pointer border-zinc-100 bg-white text-zinc-500 hover:bg-zinc-100"
                                        }`}
                                    >
                                        {skill.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}