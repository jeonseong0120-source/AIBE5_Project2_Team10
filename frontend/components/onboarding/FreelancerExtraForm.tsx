"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "../../app/lib/axios";

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
        const newSkills = freelancerData.skillIds.includes(skillId)
            ? freelancerData.skillIds.filter(id => id !== skillId)
            : [...freelancerData.skillIds, skillId];
        setFreelancerData({ ...freelancerData, skillIds: newSkills });
    };

    // 🔍 [추가] 숫자 포맷팅 함수 (1000 -> 1,000)
    const formatNumber = (num: number) => {
        return num.toLocaleString("ko-KR");
    };

    // 🔍 [추가] 입력값 변경 핸들러
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 숫자 이외의 문자 제거
        const value = e.target.value.replace(/[^0-9]/g, "");
        const numValue = value ? parseInt(value) : 0;

        setFreelancerData({
            ...freelancerData,
            hourlyRate: numValue
        });
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

                <div className="grid grid-cols-2 gap-4">
                    {/* 활동 지역 */}
                    <div className="space-y-1">
                        <label htmlFor="location-input" className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Location</label>
                        <input
                            id="location-input"
                            value={freelancerData.location}
                            onChange={(e) => setFreelancerData({ ...freelancerData, location: e.target.value })}
                            placeholder="예: 서울시 강남구"
                            className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all text-sm"
                        />
                    </div>

                    {/* 🔍 [수정] 희망 시급: 직접 입력 및 콤마 포맷팅 적용 */}
                    <div className="space-y-1">
                        <label htmlFor="hourly-rate-input" className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Hourly Rate (₩) *</label>
                        <div className="relative">
                            <input
                                id="hourly-rate-input"
                                type="text" // 콤마 표시를 위해 text로 변경
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
                                        ? "bg-zinc-900 text-white border-zinc-900"
                                        : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300"
                                }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 기술 스택 선택 */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest">Tech Stacks * (Min 1)</label>
                    <div className="flex flex-wrap gap-2">
                        {availableSkills.map((skill) => (
                            <div
                                key={skill.skillId}
                                onClick={() => toggleSkill(skill.skillId)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-all border ${
                                    freelancerData.skillIds.includes(skill.skillId)
                                        ? "bg-[#7A4FFF] text-white border-[#7A4FFF] shadow-md"
                                        : "bg-zinc-50 text-zinc-500 border-zinc-100 hover:bg-zinc-100"
                                }`}
                            >
                                {skill.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}