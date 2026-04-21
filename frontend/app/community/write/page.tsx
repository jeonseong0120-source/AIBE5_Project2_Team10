"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine, Send, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/app/lib/axios";
import { createCommunityPost } from "@/app/lib/communityApi";
import GlobalNavbar from "@/components/common/GlobalNavbar";
import { getActiveRole } from "@/app/lib/auth";

export default function CommunityWritePage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    const [cursor, setCursor] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get("/v1/users/me");
                setUser(res.data);
                
                const roles = res.data.role || "";
                const currentRole = getActiveRole();

                if (roles === "BOTH") {
                    if (currentRole === "CLIENT") {
                        const pRes = await api.get("/client/profile");
                        setProfile(pRes.data);
                    } else {
                        const pRes = await api.get("/v1/freelancers/me");
                        setProfile(pRes.data);
                    }
                } else if (roles === "CLIENT") {
                    const pRes = await api.get("/client/profile");
                    setProfile(pRes.data);
                } else if (roles === "FREELANCER") {
                    const pRes = await api.get("/v1/freelancers/me");
                    setProfile(pRes.data);
                }
            } catch (err) {}
        };
        fetchUser();
    }, []);

    const handleSubmit = async () => {
        if (!title.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }

        if (!content.trim()) {
            alert("내용을 입력해주세요.");
            return;
        }

        try {
            setLoading(true);
            await createCommunityPost({ title, content });
            alert("게시글이 등록되었습니다.");
            router.push("/community");
        } catch (error) {
            console.error("글 등록 실패:", error);
            alert("게시글 등록에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (confirm("작성 중인 내용이 사라집니다. 나가시겠습니까?")) {
            router.push("/community");
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 relative overflow-hidden font-sans">
            {/* 배경 글로우 */}
            <div
                className="pointer-events-none fixed left-0 top-0 z-0 h-[300px] w-[300px] rounded-full bg-[#7A4FFF]/10 blur-[120px] will-change-transform"
                style={{ transform: `translate(${cursor.x - 150}px, ${cursor.y - 150}px)` }}
            />

            <GlobalNavbar user={user} profile={profile} />

            <div className="max-w-4xl mx-auto px-8 relative z-10 pt-12">
                <div className="mb-12">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-6">
                        <span className="w-12 h-[3px] bg-[#7A4FFF] rounded-full"></span>
                        <span className="text-[11px] font-black text-[#7A4FFF] uppercase tracking-[0.4em] font-mono">새 지식 공유</span>
                    </motion.div>
                    <h1 className="text-5xl font-black tracking-tighter text-zinc-950">
                        커뮤니티 <span className="text-zinc-400">글쓰기</span>
                    </h1>
                    <p className="mt-4 text-sm font-medium text-zinc-500 max-w-md italic">
                        마스터의 소중한 경험과 지식을 자유롭게 공유해보세요.
                    </p>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[2.5rem] border border-zinc-100 bg-white p-12 shadow-2xl"
                >
                    <div className="flex flex-col gap-10">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest font-mono ml-1">
                                게시글 제목
                            </label>
                            <input
                                type="text"
                                placeholder="모두의 이목을 끌 수 있는 멋진 제목을 지어주세요"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/30 px-8 py-5 text-lg font-black text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-[#7A4FFF] focus:bg-white focus:ring-4 focus:ring-[#7A4FFF]/5"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest font-mono ml-1">
                                상세 내용
                            </label>
                            <textarea
                                placeholder="내용을 정성스럽게 작성해주시면 다른 유저들에게 큰 도움이 됩니다."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={15}
                                className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50/30 px-8 py-8 text-base font-medium leading-relaxed text-zinc-600 outline-none transition-all placeholder:text-zinc-300 focus:border-[#7A4FFF] focus:bg-white focus:ring-4 focus:ring-[#7A4FFF]/5"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-zinc-50">
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 rounded-2xl px-8 py-4 text-xs font-black uppercase tracking-widest text-zinc-400 transition-all hover:text-zinc-600 font-mono"
                            >
                                <X size={16} />
                                작성 취소
                            </button>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-3 rounded-[1.25rem] bg-zinc-950 px-10 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#7A4FFF] hover:shadow-[0_10px_20px_-5px_rgba(122,79,255,0.4)] disabled:opacity-50 shadow-xl font-mono"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                {loading ? "게시물 등록 중..." : "게시물 등록 완료"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}