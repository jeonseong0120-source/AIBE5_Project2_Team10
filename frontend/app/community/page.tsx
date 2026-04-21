"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine, Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/app/lib/axios";
import { getCommunityPosts } from "@/app/lib/communityApi";
import type { CommunityPost } from "@/types/community";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import GlobalNavbar from "@/components/common/GlobalNavbar";
import { getActiveRole } from "@/app/lib/auth";

export default function CommunityPage() {
    const router = useRouter();

    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [sort, setSort] = useState("latest");

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const data = await getCommunityPosts(page, size, keyword, sort);
            setPosts(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            alert("게시글 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkUser = async () => {
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
            } catch (err) {
                // 비로그인 상태일 수 있음
            }
        };
        checkUser();
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [page, keyword, sort]);

    const handleSearch = () => {
        setPage(0);
        setKeyword(keywordInput.trim());
    };

    const [cursor, setCursor] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    const handleMoveWrite = () => {
        const token =
            typeof window !== "undefined"
                ? localStorage.getItem("accessToken")
                : null;

        if (!token) {
            alert("로그인 후 글쓰기가 가능합니다.");
            router.push("/login");
            return;
        }

        router.push("/community/write");
    };

    const handleMoveDetail = (postId: number) => {
        router.push(`/community/${postId}`);
    };

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 relative overflow-hidden font-sans">
            {/* 배경 글로우 */}
            <div
                className="pointer-events-none fixed left-0 top-0 z-0 h-[300px] w-[300px] rounded-full bg-[#7A4FFF]/10 blur-[120px] will-change-transform"
                style={{ transform: `translate(${cursor.x - 150}px, ${cursor.y - 150}px)` }}
            />

            <GlobalNavbar user={user} profile={profile} />

            {/* 헤더 섹션 */}
            <header className="relative pt-24 pb-16 px-8 overflow-hidden max-w-6xl mx-auto">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-6">
                    <span className="w-12 h-[3px] bg-[#7A4FFF] rounded-full"></span>
                    <span className="text-[11px] font-black text-[#7A4FFF] uppercase tracking-[0.4em] font-mono">커뮤니티 광장</span>
                </motion.div>

                <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter text-zinc-950">
                            데브니어 <span className="text-zinc-400">커뮤니티</span>
                        </h1>
                        <p className="mt-4 text-sm font-medium text-zinc-500 max-w-md leading-relaxed">
                            프리랜서와 클라이언트가 자유롭게 지식을 공유하고 소통하는 열린 공간입니다.
                        </p>
                    </div>

                    <button
                        onClick={handleMoveWrite}
                        className="group flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#7A4FFF] px-8 text-sm font-black text-white transition-all hover:scale-105 hover:shadow-[0_10px_20px_-5px_rgba(122,79,255,0.3)]"
                    >
                        <PencilLine size={18} className="transition-transform group-hover:rotate-12" />
                        새 글 작성하기
                    </button>
                </div>
            </header>

            {/* 검색 및 정렬 제어판 */}
            <section className="px-8 pb-10">
                <div className="mx-auto max-w-6xl">
                    <div className="rounded-[2.5rem] border border-zinc-200 bg-white/50 p-3 backdrop-blur-md shadow-xl">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="flex flex-1 items-center gap-3 rounded-[1.5rem] border border-zinc-200 bg-white px-6 py-4 transition-all focus-within:border-[#7A4FFF]/50 focus-within:ring-4 focus-within:ring-[#7A4FFF]/5">
                                <Search size={20} className="text-zinc-400" />
                                <input
                                    type="text"
                                    value={keywordInput}
                                    onChange={(e) => setKeywordInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSearch();
                                    }}
                                    placeholder="무엇을 찾고 계신가요? 키워드를 입력해보세요."
                                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-zinc-400"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={sort}
                                    onChange={(e) => {
                                        setPage(0);
                                        setSort(e.target.value);
                                    }}
                                    className="h-14 rounded-[1.5rem] border border-zinc-200 bg-white px-6 text-xs font-black uppercase tracking-wider outline-none transition-all hover:border-zinc-300"
                                >
                                    <option value="latest">최신순</option>
                                    <option value="likes">좋아요순</option>
                                </select>

                                <button
                                    onClick={handleSearch}
                                    className="h-14 rounded-[1.5rem] bg-zinc-950 px-8 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800 hover:shadow-lg"
                                >
                                    검색
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 게시글 목록 메인 */}
            <main className="px-8 relative z-10">
                <div className="mx-auto max-w-6xl">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 rounded-[3rem] border-2 border-dashed border-zinc-200 bg-white/40 backdrop-blur-sm shadow-inner">
                            <Loader2 className="h-10 w-10 animate-spin text-[#7A4FFF] mb-4" />
                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono animate-pulse">최신 글을 동기화 중입니다...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="py-24 text-center rounded-[3rem] border-2 border-dashed border-zinc-200 bg-white/40 backdrop-blur-sm shadow-inner">
                            <p className="text-xl font-black text-zinc-300 italic uppercase">작성된 게시글이 없습니다</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {posts.map((post, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    transition={{ delay: idx * 0.05 }}
                                    key={post.id}
                                >
                                    <CommunityPostCard
                                        post={post}
                                        onClick={handleMoveDetail}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* 페이지네이션 */}
                    <div className="mt-12 flex items-center justify-center gap-6">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage((prev) => prev - 1)}
                            className="flex h-12 w-24 items-center justify-center rounded-xl border border-zinc-200 bg-white text-xs font-black uppercase tracking-tighter transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                        >
                            이전
                        </button>

                        <div className="flex h-12 items-center gap-2 rounded-xl bg-zinc-100 px-6 font-mono text-sm font-black text-zinc-500 shadow-inner">
                            <span className="text-[#7A4FFF]">{totalPages === 0 ? 1 : page + 1}</span>
                            <span className="opacity-30">/</span>
                            <span>{totalPages === 0 ? 1 : totalPages}</span>
                        </div>

                        <button
                            disabled={totalPages === 0 || page + 1 >= totalPages}
                            onClick={() => setPage((prev) => prev + 1)}
                            className="flex h-12 w-24 items-center justify-center rounded-xl border border-zinc-200 bg-white text-xs font-black uppercase tracking-tighter transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                        >
                            다음
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}