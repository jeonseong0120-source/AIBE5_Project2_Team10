"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, X, Loader2, Save } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/app/lib/axios";
import { getCommunityPostDetail, updateCommunityPost } from "@/app/lib/communityApi";
import { getActiveRole } from "@/app/lib/auth";
import GlobalNavbar from "@/components/common/GlobalNavbar";

export default function CommunityEditPage() {
    const params = useParams();
    const router = useRouter();
    const postId = Number(params.id);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    const [cursor, setCursor] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    const fetchUserAndPost = async () => {
        try {
            setInitLoading(true);
            
            // Fetch User
            try {
                const uRes = await api.get("/v1/users/me");
                setUser(uRes.data);

                const roles = uRes.data.role || "";
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

            // Fetch Post
            const data = await getCommunityPostDetail(postId);
            setTitle(data.title);
            setContent(data.content);
        } catch (error) {
            console.error("게시글 조회 실패:", error);
            alert("게시글 정보를 불러오지 못했습니다.");
            router.push("/community");
        } finally {
            setInitLoading(false);
        }
    };

    useEffect(() => {
        if (!postId || Number.isNaN(postId)) return;
        fetchUserAndPost();
    }, [postId]);

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
            await updateCommunityPost(postId, { title, content });
            alert("게시글이 수정되었습니다.");
            router.push(`/community/${postId}`);
        } catch (error) {
            console.error("게시글 수정 실패:", error);
            alert("게시글 수정에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push(`/community/${postId}`);
    };

    if (initLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-black text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">
                게시글 정보를 복원 중입니다...
            </div>
        );
    }

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
                        <span className="text-[11px] font-black text-[#7A4FFF] uppercase tracking-[0.4em] font-mono">게시글 편집 모드</span>
                    </motion.div>
                    <h1 className="text-5xl font-black tracking-tighter text-zinc-950">
                        게시글 <span className="text-zinc-400">수정하기</span>
                    </h1>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[2.5rem] border border-zinc-100 bg-white p-12 shadow-2xl"
                >
                    <div className="flex flex-col gap-10">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest font-mono ml-1">
                                제목 수정
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/30 px-8 py-5 text-lg font-black text-zinc-900 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white focus:ring-4 focus:ring-[#7A4FFF]/5"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest font-mono ml-1">
                                내용 수정
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={15}
                                className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50/30 px-8 py-8 text-base font-medium leading-relaxed text-zinc-600 outline-none transition-all focus:border-[#7A4FFF] focus:bg-white focus:ring-4 focus:ring-[#7A4FFF]/5"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-zinc-50">
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 rounded-2xl px-8 py-4 text-xs font-black uppercase tracking-widest text-zinc-400 transition-all hover:text-zinc-600 font-mono"
                            >
                                <X size={16} />
                                수정 취소
                            </button>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-3 rounded-[1.25rem] bg-zinc-950 px-10 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#7A4FFF] hover:shadow-[0_10px_20px_-5px_rgba(122,79,255,0.4)] disabled:opacity-50 shadow-xl font-mono"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {loading ? "변경 사항 저장 중..." : "수정 완료"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}