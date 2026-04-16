"use client";

import { FormEvent, useMemo, useState } from "react";
import KakaoLocationPicker from "@/components/project/KakaoLocationPicker";
import SkillTagSelector from "@/components/project/SkillTagSelector";
import { type CreateProjectBody, updateProject } from "@/app/lib/projectApi";
import { useRouter } from "next/navigation";

export type ProjectEditInitialData = {
    projectName: string;
    budget: number;
    deadline: string;
    detail: string;
    online: boolean;
    offline: boolean;
    location: string;
    latitude: string;
    longitude: string;
    skillNames: string[];
};

type Props = {
    projectId: string;
    initialData: ProjectEditInitialData;
};

function tomorrowISODate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function ProjectEditForm({ projectId, initialData }: Props) {
    const router = useRouter();
    const [projectName, setProjectName] = useState(initialData.projectName);
    const [budget, setBudget] = useState(String(initialData.budget));
    const [deadline, setDeadline] = useState(initialData.deadline);
    const [detail, setDetail] = useState(initialData.detail);
    const [online, setOnline] = useState(initialData.online);
    const [offline, setOffline] = useState(initialData.offline);
    const [location, setLocation] = useState(initialData.location);
    const [latitude, setLatitude] = useState(initialData.latitude);
    const [longitude, setLongitude] = useState(initialData.longitude);
    const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const kakaoJavascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ?? "";
    const showAddressBlock = offline;

    const submitLabel = useMemo(() => "수정하기", []);

    const handleOfflineChange = (next: boolean) => {
        setOffline(next);
        if (!next) {
            setLocation("");
            setLatitude("");
            setLongitude("");
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setMessage(null);
        setError(null);

        if (!online && !offline) {
            setError("근무 방식은 온라인/오프라인 중 하나 이상 선택해 주세요.");
            return;
        }

        const trimmedProjectName = projectName.trim();
        const budgetValue = Number(budget);
        if (!trimmedProjectName) {
            setError("프로젝트명을 입력해 주세요.");
            return;
        }
        if (!Number.isFinite(budgetValue) || budgetValue < 1) {
            setError("예산은 1원 이상의 숫자로 입력해 주세요.");
            return;
        }
        if (!deadline || deadline < tomorrowISODate()) {
            setError("모집 마감일은 오늘 이후여야 합니다.");
            return;
        }
        if (!detail.trim()) {
            setError("상세 설명을 입력해 주세요.");
            return;
        }

        const payload: CreateProjectBody = {
            projectName: trimmedProjectName,
            budget: budgetValue,
            deadline,
            detail: detail.trim() || undefined,
            online,
            offline,
            skillIds: selectedSkillIds.length ? selectedSkillIds : undefined,
        };

        if (offline) {
            payload.location = location.trim();
            const lat = latitude.trim() === "" ? NaN : Number(latitude);
            const lng = longitude.trim() === "" ? NaN : Number(longitude);
            if (!payload.location) {
                setError("오프라인 모집 시 주소(장소)를 입력해 주세요.");
                return;
            }
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                setError("오프라인 모집 시 위도·경도를 숫자로 입력해 주세요.");
                return;
            }
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                setError("위도는 -90~90, 경도는 -180~180 범위로 입력해 주세요.");
                return;
            }
            payload.latitude = lat;
            payload.longitude = lng;
        }

        setSubmitting(true);
        try {
            await updateProject(projectId, payload);
            setMessage("프로젝트가 수정되었습니다.");
            router.push(`/client/projects/${projectId}`);
        } catch (err: unknown) {
            const msg =
                err && typeof err === "object" && "response" in err
                    ? (() => {
                          const r = err as { response?: { data?: { message?: string } } };
                          return r.response?.data?.message;
                      })()
                    : undefined;
            setError(msg ?? "수정에 실패했습니다. 입력값을 확인하거나 다시 시도해 주세요.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-black text-zinc-900">프로젝트 수정</h1>

            {message && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
                    {message}
                </div>
            )}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                    {error}
                </div>
            )}

            <label className="block text-sm font-bold text-zinc-700">
                프로젝트명
                <input
                    required
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-medium outline-none focus:border-[#FF7D00]"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    maxLength={100}
                />
            </label>

            <label className="block text-sm font-bold text-zinc-700">
                예산 (원)
                <input
                    required
                    type="number"
                    min={1}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-medium outline-none focus:border-[#FF7D00]"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                />
            </label>

            <label className="block text-sm font-bold text-zinc-700">
                모집 마감일
                <input
                    required
                    type="date"
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-medium outline-none focus:border-[#FF7D00]"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                />
            </label>

            <label className="block text-sm font-bold text-zinc-700">
                상세 설명
                <textarea
                    className="mt-1 min-h-[120px] w-full rounded-lg border border-zinc-200 px-3 py-2 font-medium outline-none focus:border-[#FF7D00]"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                />
            </label>

            <fieldset className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                <legend className="text-sm font-bold text-zinc-700">근무 방식</legend>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                    <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} />
                    온라인(원격)
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                    <input type="checkbox" checked={offline} onChange={(e) => handleOfflineChange(e.target.checked)} />
                    오프라인(상주·출근 등)
                </label>
            </fieldset>

            {showAddressBlock && (
                <div className="space-y-4 rounded-xl border border-[#FF7D00]/30 bg-orange-50/40 p-4 transition-opacity">
                    <p className="text-sm font-bold text-zinc-800">오프라인 장소</p>
                    {kakaoJavascriptKey ? (
                        <KakaoLocationPicker
                            javascriptKey={kakaoJavascriptKey}
                            value={{ address: location, latitude, longitude }}
                            onChangeAction={(v) => {
                                setLocation(v.address);
                                setLatitude(v.latitude);
                                setLongitude(v.longitude);
                            }}
                        />
                    ) : (
                        <>
                            <label className="block text-sm font-bold text-zinc-700">
                                주소
                                <input
                                    required={offline}
                                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium outline-none focus:border-[#FF7D00]"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    maxLength={500}
                                />
                            </label>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <label className="block text-sm font-bold text-zinc-700">
                                    위도
                                    <input
                                        required={offline}
                                        type="text"
                                        inputMode="decimal"
                                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium outline-none focus:border-[#FF7D00]"
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                    />
                                </label>
                                <label className="block text-sm font-bold text-zinc-700">
                                    경도
                                    <input
                                        required={offline}
                                        type="text"
                                        inputMode="decimal"
                                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium outline-none focus:border-[#FF7D00]"
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                    />
                                </label>
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="space-y-2">
                <p className="text-sm font-bold text-zinc-700">기술 스택</p>
                <SkillTagSelector
                    selectedSkillIds={selectedSkillIds}
                    onChangeAction={setSelectedSkillIds}
                    initialSkillNames={initialData.skillNames}
                />
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#FF7D00] py-3 text-sm font-black uppercase tracking-widest text-white shadow-md shadow-orange-100 transition hover:brightness-110 disabled:opacity-60"
            >
                {submitting ? "수정 중…" : submitLabel}
            </button>
        </form>
    );
}
