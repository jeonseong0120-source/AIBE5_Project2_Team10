"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PencilLine, Send, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { createCommunityPost } from "@/app/lib/communityApi";
import GlobalNavbar from "@/components/common/GlobalNavbar";
import { useSessionBootstrap } from "@/app/hooks/useSessionBootstrap";

export default function CommunityWritePage() {
    const router = useRouter();
    const { user, profile } = useSessionBootstrap();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const glowRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef({ x: 0, y: 0 });
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const updateGlow = () => {
            if (glowRef.current) {
                glowRef.current.style.transform = `translate(${cursorRef.current.x - 150}px, ${cursorRef.current.y - 150}px)`;
            }
            rafRef.current = requestAnimationFrame(updateGlow);
        };

        const handleMouseMove = (e: MouseEvent) => {
            cursorRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener("mousemove", handleMouseMove);
        rafRef.current = requestAnimationFrame(updateGlow);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
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
                ref={glowRef}
                className="pointer-events-none fixed left-0 top-0 z-0 h-[300px] w-[300px] rounded-full bg-[#7A4FFF]/10 blur-[120px] will-change-transform"
            />

            <GlobalNavbar user={user} profile={profile} />

            <div className="max-w-4xl mx-auto px-8 relative z-10 pt-12">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-950">
                        커뮤니티 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7A4FFF] to-[#FF7D00]">글쓰기</span>
                    </h1>
                    <p className="mt-4 text-[15px] font-medium text-zinc-400 max-w-xl leading-relaxed">
                        커뮤니티의 발전을 위해 소중한 경험과 지식을 자유롭게 나누어주세요.
                    </p>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[2.5rem] border border-zinc-100 bg-white p-12 shadow-2xl"
                >
                    <div className="flex flex-col gap-10">
                        <div className="space-y-3">
                            <label className="text-[12px] font-bold text-zinc-500 tracking-wide ml-1">
                                게시글 제목
                            </label>
                            <input
                                type="text"
                                placeholder="모두의 이목을 끌 수 있는 멋진 제목을 지어주세요"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 px-8 py-6 text-lg font-bold text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-[#7A4FFF] focus:bg-white focus:ring-4 focus:ring-[#7A4FFF]/5 shadow-sm"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[12px] font-bold text-zinc-500 tracking-wide ml-1">
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
                                className="flex items-center gap-2 rounded-2xl px-8 py-4 text-[13px] font-bold text-zinc-400 transition-all hover:text-zinc-900 focus:outline-none"
                            >
                                <X size={18} />
                                작성 취소
                            </button>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-3 rounded-[1.25rem] bg-zinc-950 px-10 py-4 text-[14px] font-black text-white transition-all hover:bg-zinc-800 hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.2)] disabled:opacity-50 shadow-xl active:scale-95"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                {loading ? "게시물 등록 중..." : "게시물 등록하기"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}