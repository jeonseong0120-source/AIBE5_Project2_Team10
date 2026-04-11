"use client";

import { motion } from "framer-motion";

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
    // 테스트용 스킬 더미 데이터 (나중에 백엔드 /api/v1/skills 에서 받아와야 함)
    const availableSkills = [
        { id: 1, name: "Java", category: "Backend" },
        { id: 2, name: "React", category: "Frontend" },
        { id: 3, name: "Spring Boot", category: "Backend" },
        { id: 4, name: "TypeScript", category: "Frontend" },
        { id: 5, name: "Figma", category: "Design" },
    ];

    const toggleSkill = (skillId: number) => {
        const newSkills = freelancerData.skillIds.includes(skillId)
            ? freelancerData.skillIds.filter(id => id !== skillId)
            : [...freelancerData.skillIds, skillId];
        setFreelancerData({ ...freelancerData, skillIds: newSkills });
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
                    <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Introduction *</label>
                    <textarea
                        value={freelancerData.introduction}
                        onChange={(e) => setFreelancerData({ ...freelancerData, introduction: e.target.value })}
                        placeholder="마스터의 기술력과 경험을 짧게 소개해 주세요."
                        className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all min-h-[80px] resize-none text-sm"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* 활동 지역 */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Location</label>
                        <input
                            value={freelancerData.location}
                            onChange={(e) => setFreelancerData({ ...freelancerData, location: e.target.value })}
                            placeholder="예: 서울시 강남구"
                            className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all text-sm"
                        />
                    </div>
                    {/* 희망 시급 */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Hourly Rate (₩) *</label>
                        <input
                            type="number"
                            value={freelancerData.hourlyRate}
                            onChange={(e) => setFreelancerData({ ...freelancerData, hourlyRate: Number(e.target.value) })}
                            placeholder="0"
                            className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                {/* 작업 방식 (WorkStyle Enum) */}
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

                {/* 기술 스택 선택 (DTO: skillIds) */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest">Tech Stacks * (Min 1)</label>
                    <div className="flex flex-wrap gap-2">
                        {availableSkills.map((skill) => (
                            <div
                                key={skill.id}
                                onClick={() => toggleSkill(skill.id)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-all border ${
                                    freelancerData.skillIds.includes(skill.id)
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