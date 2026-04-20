"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/app/lib/axios";
import { MAX_SELECTED_SKILLS } from "@/app/lib/skillLimits";

type SkillItem = {
    skillId: number;
    name: string;
    category?: string;
};

type Props = {
    selectedSkillIds: number[];
    onChangeAction: (ids: number[]) => void;
    initialSkillNames?: string[];
};

export default function SkillTagSelector({ selectedSkillIds, onChangeAction, initialSkillNames = [] }: Props) {
    const onChangeRef = useRef(onChangeAction);
    onChangeRef.current = onChangeAction;
    const [allSkills, setAllSkills] = useState<SkillItem[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSkills = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get<SkillItem[]>("/v1/skills/default");
                setAllSkills(res.data ?? []);
            } catch {
                setError("스킬 목록을 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        void fetchSkills();
    }, []);

    const filteredSkills = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return allSkills;
        return allSkills.filter((skill) => skill.name.toLowerCase().includes(q));
    }, [allSkills, query]);

    const selectedSkills = useMemo(() => {
        const selectedSet = new Set(selectedSkillIds);
        return allSkills.filter((skill) => selectedSet.has(skill.skillId));
    }, [allSkills, selectedSkillIds]);

    const toggleSkill = (skillId: number) => {
        const selectedSet = new Set(selectedSkillIds);
        if (selectedSet.has(skillId)) {
            selectedSet.delete(skillId);
        } else {
            if (selectedSet.size >= MAX_SELECTED_SKILLS) {
                return;
            }
            selectedSet.add(skillId);
        }
        onChangeAction(Array.from(selectedSet));
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-bold text-zinc-700">
                기술 스택 검색{" "}
                <span className="font-mono text-xs font-black text-zinc-400">
                    ({selectedSkillIds.length}/{MAX_SELECTED_SKILLS})
                </span>
                <input
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-medium outline-none focus:border-[#FF7D00]"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="스킬명을 검색하세요 (예: React)"
                />
            </label>

            {loading && <p className="text-xs text-zinc-500">스킬 목록 불러오는 중...</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}

            {!!selectedSkills.length && (
                <div className="rounded-lg border border-zinc-200 bg-white p-3">
                    <p className="mb-2 text-xs font-bold text-zinc-500">선택된 스킬</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedSkills.map((skill) => (
                            <button
                                key={skill.skillId}
                                type="button"
                                onClick={() => toggleSkill(skill.skillId)}
                                className="rounded-full border border-[#FF7D00] bg-[#FF7D00] px-3 py-1 text-xs font-bold text-white"
                            >
                                {skill.name} ×
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="max-h-72 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3">
                <div className="flex flex-wrap gap-2">
                    {filteredSkills.map((skill) => {
                        const active = selectedSkillIds.includes(skill.skillId);
                        const atCap = !active && selectedSkillIds.length >= MAX_SELECTED_SKILLS;
                        return (
                            <button
                                key={skill.skillId}
                                type="button"
                                disabled={atCap}
                                onClick={() => toggleSkill(skill.skillId)}
                                className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                                    active
                                        ? "border-[#FF7D00] bg-[#FF7D00] text-white"
                                        : atCap
                                          ? "cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-300"
                                          : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-[#FF7D00]"
                                }`}
                            >
                                {skill.name}
                            </button>
                        );
                    })}
                    {!loading && !filteredSkills.length && (
                        <p className="text-xs text-zinc-500">검색 결과가 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
