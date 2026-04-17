"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/app/lib/axios";

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

    // [Fix] Coderabbit 리뷰 반영: SkillTagSelector 내에서 name -> id 변환을 독립적으로 처리하지 않도록
    // ProjectEditForm 쪽 로직과 충돌하는 useEffect를 수정/제거했습니다.
    // 기존의 이중 동기화(상위 컴포넌트 & 하위 컴포넌트 양쪽에서 API 호출 후 매핑)가
    // 스킬 목록을 덮어쓰거나 무한 루프를 유발하는 원인이 되었습니다.
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

    // 하위 컴포넌트(SkillTagSelector)에서는 단순히 "선택된 ID"와 "전체 스킬 목록"만 가지고 
    // 필터링하여 보여주는 역할만 수행하도록 name 매핑 로직을 제거했습니다. 
    // 이름 -> ID 매핑은 상위(ProjectEditForm)에서만 1번 수행합니다.

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
            selectedSet.add(skillId);
        }
        onChangeAction(Array.from(selectedSet));
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-bold text-zinc-700">
                기술 스택 검색
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

            <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3">
                <div className="flex flex-wrap gap-2">
                    {filteredSkills.map((skill) => {
                        const active = selectedSkillIds.includes(skill.skillId);
                        return (
                            <button
                                key={skill.skillId}
                                type="button"
                                onClick={() => toggleSkill(skill.skillId)}
                                className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                                    active
                                        ? "border-[#FF7D00] bg-[#FF7D00] text-white"
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
