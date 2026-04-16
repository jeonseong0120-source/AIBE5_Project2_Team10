"use client";

import { FormEvent, useState } from "react";
import KakaoLocationPicker from "@/components/project/KakaoLocationPicker";
import SkillTagSelector from "@/components/project/SkillTagSelector";
import { updateProject } from "@/app/lib/projectApi";
import { useRouter } from "next/navigation";

export default function ProjectEditForm({ projectId, initialData }: any) {
    const router = useRouter();
    const [projectName, setProjectName] = useState(initialData.projectName);
    const [budget, setBudget] = useState(String(initialData.budget));
    const [deadline, setDeadline] = useState(initialData.deadline);
    const [detail, setDetail] = useState(initialData.detail || "");
    const [online, setOnline] = useState(initialData.online);
    const [offline, setOffline] = useState(initialData.offline);
    const [location, setLocation] = useState(initialData.location || "");
    const [latitude, setLatitude] = useState(String(initialData.latitude || ""));
    const [longitude, setLongitude] = useState(String(initialData.longitude || ""));
    const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(initialData.skillIds || []);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload: any = {
                projectName: projectName.trim(),
                budget: Number(budget),
                deadline,
                detail: detail.trim(),
                online,
                offline,
                skillIds: selectedSkillIds,
            };
            if (offline) {
                payload.location = location;
                payload.latitude = Number(latitude);
                payload.longitude = Number(longitude);
            }
            // 🔍 updateProject 내부에서 /v1/projects/${id} 로 쏘는지 확인 필수!
            await updateProject(projectId, payload);
            alert("수정 완료!");
            router.push("/client/dashboard");
        } catch (err) { alert("500 에러 발생: 백엔드 콘솔을 확인하세요."); }
        finally { setSubmitting(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl bg-white p-10 rounded-[3rem] shadow-xl border border-zinc-100 space-y-6 mt-10">
            <h2 className="text-3xl font-black italic tracking-tighter">EDIT_FORM</h2>
            <div className="space-y-4">
                <input required className="w-full p-4 bg-zinc-50 border-zinc-100 rounded-2xl font-bold" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project Name" />
                <div className="grid grid-cols-2 gap-4">
                    <input type="number" className="p-4 bg-zinc-50 border-zinc-100 rounded-2xl font-mono" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget" />
                    <input type="date" className="p-4 bg-zinc-50 border-zinc-100 rounded-2xl font-mono" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
                <textarea className="w-full p-4 bg-zinc-50 border-zinc-100 rounded-2xl min-h-[150px]" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Project Details" />

                <div className="p-4 bg-zinc-50 rounded-2xl flex gap-4">
                    <label className="flex items-center gap-2 font-black text-[10px]"><input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} /> ONLINE</label>
                    <label className="flex items-center gap-2 font-black text-[10px]"><input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} /> OFFLINE</label>
                </div>

                {offline && (
                    <div className="p-4 bg-orange-50 rounded-2xl">
                        <KakaoLocationPicker
                            javascriptKey={process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY || ""}
                            value={{ address: location, latitude, longitude }}
                            onChangeAction={(v) => { setLocation(v.address); setLatitude(v.latitude); setLongitude(v.longitude); }}
                        />
                    </div>
                )}

                <SkillTagSelector selectedSkillIds={selectedSkillIds} onChangeAction={setSelectedSkillIds} initialSkillNames={initialData.skillNames} />
            </div>
            <button type="submit" disabled={submitting} className="w-full py-5 bg-zinc-900 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-[#FF7D00] transition-all">
                {submitting ? "SAVING..." : "SAVE_CHANGES"}
            </button>
        </form>
    );
}