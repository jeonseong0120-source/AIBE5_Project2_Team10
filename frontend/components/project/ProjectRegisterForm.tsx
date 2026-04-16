"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createProject, type CreateProjectBody } from "@/app/lib/projectApi";
import KakaoLocationPicker from "@/components/project/KakaoLocationPicker";

function tomorrowISODate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
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
    const [skillsRaw, setSkillsRaw] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const kakaoJavascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ?? "";

    const showAddressBlock = offline;

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
        setError(null);

        const skillNames = skillsRaw
            .split(/[,，]/)
            .map((s) => s.trim())
            .filter(Boolean);

        const payload: CreateProjectBody = {
            projectName: projectName.trim(),
            budget: Number(budget),
            deadline,
            detail: detail.trim() || undefined,
            online,
            offline,
            skillNames: skillNames.length ? skillNames : undefined,
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
            payload.latitude = lat;
            payload.longitude = lng;
        }

        setSubmitting(true);
        try {
            const projectId = await createProject(payload);
            router.push(`/client/projects/${projectId}`);
        } catch (err: unknown) {
            const msg =
                err && typeof err === "object" && "response" in err
                    ? (() => {
                          const r = err as { response?: { data?: { message?: string } } };
                          return r.response?.data?.message;
                      })()
                    : undefined;
            setError(msg ?? "등록에 실패했습니다. 입력값을 확인하거나 다시 시도해 주세요.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-black text-zinc-900">프로젝트 등록</h1>

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
                <p className="text-xs text-zinc-500">
                    오프라인을 선택하면 주소·좌표 입력란이 나타납니다. 서버 검증상 오프라인일 때 장소 정보가 필수입니다.
                </p>
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
                            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                카카오맵을 쓰려면 <code className="font-mono">frontend/.env.local</code> 에{" "}
                                <code className="font-mono">NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY</code> 를 넣고 개발 서버를
                                다시 띄워 주세요. 샘플은 <code className="font-mono">frontend/kakao.env.sample</code> 을
                                참고하면 됩니다.
                            </p>
                            <label className="block text-sm font-bold text-zinc-700">
                                주소
                                <input
                                    required={offline}
                                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium outline-none focus:border-[#FF7D00]"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    maxLength={500}
                                    placeholder="예: 서울특별시 강남구 ..."
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
                                        placeholder="예: 37.5"
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
                                        placeholder="예: 127.0"
                                    />
                                </label>
                            </div>
                        </>
                    )}
                </div>
            )}

            <label className="block text-sm font-bold text-zinc-700">
                기술 스택 (쉼표로 구분)
                <input
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-medium outline-none focus:border-[#FF7D00]"
                    value={skillsRaw}
                    onChange={(e) => setSkillsRaw(e.target.value)}
                    placeholder="React, Spring Boot, AWS"
                />
            </label>

            <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#FF7D00] py-3 text-sm font-black uppercase tracking-widest text-white shadow-md shadow-orange-100 transition hover:brightness-110 disabled:opacity-60"
            >
                {submitting ? "등록 중…" : "등록하기"}
            </button>
        </form>
    );
}
