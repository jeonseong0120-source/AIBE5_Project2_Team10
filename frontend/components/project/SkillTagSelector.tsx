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
    suggestSourceText?: string;
    suggestContext?: "portfolio" | "project";
    /** 미지정 시 MAX_SELECTED_SKILLS(50) */
    maxSelected?: number;
};

type SuggestedSkill = {
    skillId: number;
    name: string;
    category?: string;
    score: number;
};

function mergeSkillItemsUnique(...lists: SkillItem[][]): SkillItem[] {
    const byId = new Map<number, SkillItem>();
    for (const list of lists) {
        for (const s of list) {
            if (Number.isFinite(s.skillId)) {
                byId.set(s.skillId, {
                    skillId: s.skillId,
                    name: s.name,
                    category: s.category,
                });
            }
        }
    }
    return Array.from(byId.values());
}

export default function SkillTagSelector({
    selectedSkillIds,
    onChangeAction,
    initialSkillNames = [],
    suggestSourceText = "",
    suggestContext = "project",
    maxSelected = MAX_SELECTED_SKILLS,
}: Props) {
    const onChangeRef = useRef(onChangeAction);
    onChangeRef.current = onChangeAction;
    const [allSkills, setAllSkills] = useState<SkillItem[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestError, setSuggestError] = useState<string | null>(null);
    const [suggestedSkills, setSuggestedSkills] = useState<SuggestedSkill[]>([]);
    const initialCatalogLoadRef = useRef(true);

    const selectedIdsKey = useMemo(
        () =>
            [...new Set(selectedSkillIds.filter((id) => Number.isFinite(id)))]
                .sort((a, b) => a - b)
                .join(","),
        [selectedSkillIds]
    );

    const initialNamesKey = useMemo(
        () =>
            [...new Set((initialSkillNames ?? []).map((n) => n.trim().toLowerCase()).filter(Boolean))]
                .sort()
                .join("|"),
        [initialSkillNames]
    );

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (initialCatalogLoadRef.current) {
                setLoading(true);
            }
            setError(null);
            try {
                const defRes = await api.get<SkillItem[]>("/v1/skills/default");
                if (cancelled) return;
                const defaults = defRes.data ?? [];
                const selectedIds = selectedIdsKey
                    ? selectedIdsKey.split(",").map((x) => Number(x))
                    : [];
                const defaultIds = new Set(defaults.map((s) => s.skillId));
                const missingSelected = selectedIds.filter((id) => !defaultIds.has(id));

                const nameSet = new Set(
                    initialNamesKey ? initialNamesKey.split("|") : []
                );

                const needFullCatalog =
                    missingSelected.length > 0 || nameSet.size > 0;

                let fromCatalog: SkillItem[] = [];
                if (needFullCatalog) {
                    const allRes = await api.get<SkillItem[]>("/v1/skills");
                    if (cancelled) return;
                    const all = allRes.data ?? [];
                    const picked = new Map<number, SkillItem>();
                    for (const s of all) {
                        if (!Number.isFinite(s.skillId)) continue;
                        if (missingSelected.includes(s.skillId)) {
                            picked.set(s.skillId, {
                                skillId: s.skillId,
                                name: s.name,
                                category: s.category,
                            });
                        }
                    }
                    if (nameSet.size > 0) {
                        for (const s of all) {
                            if (!Number.isFinite(s.skillId)) continue;
                            const n = s.name.trim().toLowerCase();
                            if (nameSet.has(n)) {
                                picked.set(s.skillId, {
                                    skillId: s.skillId,
                                    name: s.name,
                                    category: s.category,
                                });
                            }
                        }
                    }
                    fromCatalog = Array.from(picked.values());
                }

                setAllSkills((prev) => mergeSkillItemsUnique(defaults, fromCatalog, prev));
            } catch {
                if (!cancelled) {
                    setError("스킬 목록을 불러오지 못했습니다.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    initialCatalogLoadRef.current = false;
                }
            }
        };
        void run();
        return () => {
            cancelled = true;
        };
    }, [selectedIdsKey, initialNamesKey]);

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
            if (selectedSet.size >= maxSelected) {
                return;
            }
            selectedSet.add(skillId);
        }
        onChangeAction(Array.from(selectedSet));
    };

    const handleSuggestSkills = async () => {
        setSuggestError(null);
        setSuggestedSkills([]);
        const source = suggestSourceText.trim();
        if (!source) {
            setSuggestError("먼저 본문 내용을 입력해 주세요.");
            return;
        }
        setIsSuggesting(true);
        try {
            const res = await api.post<SuggestedSkill[]>("/v1/skills/suggest", {
                text: source,
                context: suggestContext,
                limit: Math.min(maxSelected, 20),
            });
            const suggestions = (res.data ?? []).filter((s) => Number.isFinite(s.skillId));
            if (suggestions.length === 0) {
                setSuggestError("추출된 추천 스킬이 없습니다.");
                return;
            }
            setAllSkills((prev) => {
                const byId = new Map(prev.map((skill) => [skill.skillId, skill]));
                for (const skill of suggestions) {
                    byId.set(skill.skillId, {
                        skillId: skill.skillId,
                        name: skill.name,
                        category: skill.category,
                    });
                }
                return Array.from(byId.values());
            });
            setSuggestedSkills(suggestions);
        } catch (e: unknown) {
            const message =
                typeof e === "object" &&
                e !== null &&
                "response" in e &&
                typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                    : null;
            setSuggestError(message || "스킬 자동추출에 실패했습니다.");
        } finally {
            setIsSuggesting(false);
        }
    };

    const applySuggestedSkill = (skillId: number) => {
        if (selectedSkillIds.includes(skillId)) {
            return;
        }
        const uniqueCount = new Set(selectedSkillIds).size;
        if (uniqueCount >= maxSelected) {
            setSuggestError(`스킬은 최대 ${maxSelected}개까지 선택할 수 있습니다.`);
            return;
        }
        onChangeAction([...selectedSkillIds, skillId]);
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-bold text-zinc-700">
                기술 스택 검색{" "}
                <span className="font-mono text-xs font-black text-zinc-400">
                    ({selectedSkillIds.length}/{maxSelected})
                </span>
                <input
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-medium outline-none focus:border-[#FF7D00]"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="스킬명을 검색하세요 (예: React)"
                />
            </label>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => void handleSuggestSkills()}
                    disabled={isSuggesting || loading}
                    className="rounded-lg border border-[#FF7D00]/40 bg-orange-50 px-3 py-2 text-xs font-black text-[#FF7D00] transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSuggesting ? "추출 중..." : "본문에서 스킬 자동추출"}
                </button>
                {suggestError && <p className="text-xs text-red-600">{suggestError}</p>}
            </div>
            {!!suggestedSkills.length && (
                <div className="rounded-lg border border-[#FF7D00]/30 bg-orange-50/70 p-3">
                    <p className="mb-2 text-[11px] font-black text-[#FF7D00]">추천 스킬 (클릭해서 추가)</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestedSkills.map((skill) => {
                            const alreadySelected = selectedSkillIds.includes(skill.skillId);
                            return (
                                <button
                                    key={`suggested-skill-${skill.skillId}`}
                                    type="button"
                                    onClick={() => applySuggestedSkill(skill.skillId)}
                                    disabled={alreadySelected}
                                    className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                                        alreadySelected
                                            ? "cursor-not-allowed border-zinc-200 bg-zinc-200 text-zinc-500"
                                            : "border-[#FF7D00]/40 bg-white text-[#FF7D00] hover:bg-[#FF7D00] hover:text-white"
                                    }`}
                                >
                                    {alreadySelected ? "선택됨 " : "+ "}
                                    {skill.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

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
                        const atCap = !active && selectedSkillIds.length >= maxSelected;
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
