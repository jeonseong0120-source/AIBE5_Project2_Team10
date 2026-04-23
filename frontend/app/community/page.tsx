"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine, Search, Loader2, Flame, Clock, MessageSquare, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { getCommunityPosts } from "@/app/lib/communityApi";
import type { CommunityPost } from "@/types/community";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import GlobalNavbar from "@/components/common/GlobalNavbar";
import { useSessionBootstrap } from "@/app/hooks/useSessionBootstrap";

export default function CommunityPage() {
    const router = useRouter();
    const { user, profile } = useSessionBootstrap();

    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);

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
        fetchPosts();
    }, [page, keyword, sort]);

    const handleSearch = () => {
        setPage(0);
        setKeyword(keywordInput.trim());
    };

    const handleMoveWrite = () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (!token) {
            alert("로그인 후 글쓰기가 가능합니다.");
            router.push("/");
            return;
        }
        router.push("/community/write");
    };

    return (
        // 🎯 [복구됨] 이 최상위 div가 빠져서 에러가 났던 겁니다!
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 relative overflow-hidden font-sans">

            {/* 🎯 개발자 감성 배경 데코레이션 코드 (오렌지 & 퍼플 테마 + 글래스/블러 이펙트) */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none font-mono text-[10px] sm:text-xs" aria-hidden="true">
                {/* 1. 보라색 테마 + 약간의 블러 (원경) */}
                <div className="absolute top-10 left-10 -rotate-12 text-[#7A4FFF]/20 blur-[1px]">
                    <pre>{`@RestController\n@RequestMapping("/api/community")\npublic class CommunityController {\n  @GetMapping\n  public ResponseEntity<?> getPosts() {\n    return ResponseEntity.ok();\n  }\n}`}</pre>
                </div>

                {/* 2. 오렌지 테마 + 비교적 선명하게 (근경) */}
                <div className="absolute top-40 right-10 md:right-20 rotate-6 text-[#FF7D00]/15">
                    <pre>{`const fetchPosts = async () => {\n  setLoading(true);\n  const data = await getCommunityPosts(page, size);\n  setPosts(data.content);\n  setLoading(false);\n};`}</pre>
                </div>

                {/* 3. 🎯 오렌지 & 퍼플 그라데이션 텍스트 (포인트) */}
                <div className="absolute bottom-32 left-10 md:left-1/4 -rotate-6 opacity-[0.25]">
                    <pre className="bg-gradient-to-r from-[#7A4FFF] to-[#FF7D00] bg-clip-text text-transparent blur-[0.5px]">
{`SELECT id, title, author_id, created_at
FROM community_posts
WHERE status = 'ACTIVE'
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;`}
                    </pre>
                </div>

                {/* 4. 보라색 테마 + 강한 블러 (매우 멀리 있는 느낌) */}
                <div className="absolute top-1/2 left-[-2%] rotate-90 hidden lg:block text-[#7A4FFF]/15 blur-[2px]">
                    <pre>{`export interface CommunityPost {\n  id: number;\n  title: string;\n  content: string;\n  viewCount: number;\n  likeCount: number;\n}`}</pre>
                </div>

                {/* 5. 오렌지 테마 + 블러 (우측 하단) */}
                <div className="absolute bottom-10 right-10 rotate-12 hidden md:block text-[#FF7D00]/20 blur-[1.5px]">
                    <pre>{`const router = useRouter();\nuseEffect(() => {\n  if (!token) router.push('/login');\n}, []);`}</pre>
                </div>
            </div>

            <GlobalNavbar user={user} profile={profile} />

            {/* 헤더 섹션 */}
            <header className="relative pt-28 pb-12 px-8 overflow-hidden max-w-6xl mx-auto z-10">
                <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
                            <span className="w-10 h-[3px] bg-gradient-to-r from-[#7A4FFF] to-[#FF7D00] rounded-full"></span>
                            <span className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.3em] font-mono flex items-center gap-1">
                                <Sparkles size={14} className="text-[#FF7D00]" /> Devnear Network
                            </span>
                        </motion.div>

                        {/* 그라데이션 텍스트 적용 */}
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-zinc-950 flex items-center gap-4">
                            데브니어 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7A4FFF] to-[#FF7D00]">커뮤니티</span>
                        </h1>
                        <p className="mt-6 text-[15px] font-medium text-zinc-500 max-w-md leading-relaxed">
                            프리랜서와 클라이언트가 자유롭게 지식을 공유하고 소통하는 열린 공간입니다.
                        </p>
                    </div>

                    {/* 화려한 그라데이션 버튼 + 호버 이펙트 */}
                    <button
                        onClick={handleMoveWrite}
                        className="group relative flex h-[60px] items-center justify-center gap-3 rounded-[1.25rem] bg-gradient-to-r from-[#7A4FFF] to-[#FF7D00] px-8 text-sm font-black text-white transition-all hover:scale-105 hover:shadow-[0_15px_30px_-5px_rgba(255,125,0,0.4)] focus:outline-none overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <PencilLine size={20} className="relative z-10 transition-transform group-hover:-translate-y-1 group-hover:rotate-12" />
                        <span className="relative z-10 tracking-wide">새 글 작성</span>
                    </button>
                </div>
            </header>

            {/* Reddit 스타일 검색 및 정렬 제어판 */}
            <section className="px-8 pb-12 relative z-10">
                <div className="mx-auto max-w-6xl">
                    <div className="rounded-[2.5rem] border border-white/60 bg-white/60 p-4 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center relative z-10">

                            {/* 검색창 */}
                            <div className="flex flex-1 items-center gap-3 rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-4 transition-all focus-within:border-[#7A4FFF]/50 focus-within:ring-4 focus-within:ring-[#7A4FFF]/10 focus-within:bg-white shadow-inner">
                                <Search size={20} className="text-zinc-400" />
                                <input
                                    type="text"
                                    value={keywordInput}
                                    onChange={(e) => setKeywordInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSearch();
                                    }}
                                    placeholder="무엇을 찾고 계신가요? 키워드를 검색해보세요."
                                    className="w-full bg-transparent text-[15px] font-bold outline-none placeholder:text-zinc-400 placeholder:font-medium text-zinc-800"
                                />
                            </div>

                            {/* 정렬 버튼 */}
                            <div className="flex items-center gap-2 bg-zinc-100/80 border border-zinc-200 rounded-[1.5rem] p-1.5 shadow-inner">
                                <button
                                    onClick={() => { setSort("latest"); setPage(0); }}
                                    className={`flex items-center gap-2 h-12 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                                        sort === 'latest'
                                            ? 'bg-white text-[#7A4FFF] shadow-md border border-zinc-100'
                                            : 'text-zinc-500 hover:text-zinc-700'
                                    }`}
                                >
                                    <Clock size={16} className={sort === 'latest' ? "text-[#7A4FFF]" : "text-zinc-400"} /> 최신
                                </button>
                                <button
                                    onClick={() => { setSort("likes"); setPage(0); }}
                                    className={`flex items-center gap-2 h-12 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                                        sort === 'likes'
                                            ? 'bg-gradient-to-r from-[#FF9E45] to-[#FF7D00] text-white shadow-lg shadow-orange-200/50'
                                            : 'text-zinc-500 hover:text-zinc-700'
                                    }`}
                                >
                                    <Flame size={16} className={sort === 'likes' ? "text-white" : "text-zinc-400"} /> 인기
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
                        <div className="flex flex-col items-center justify-center py-32 rounded-[3rem] border-2 border-dashed border-zinc-200 bg-white/40 backdrop-blur-sm shadow-inner">
                            <Loader2 className="h-10 w-10 animate-spin text-[#FF7D00] mb-4" />
                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono animate-pulse">데이터 동기화 중...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="py-32 text-center rounded-[3rem] border-2 border-dashed border-zinc-200 bg-white/40 backdrop-blur-sm shadow-inner">
                            <MessageSquare className="mx-auto mb-4 text-zinc-300" size={48} />
                            <p className="text-xl font-black text-zinc-400 italic uppercase">작성된 게시글이 없습니다</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {posts.map((post, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={post.id}
                                >
                                    <CommunityPostCard
                                        post={post}
                                        onClick={(id) => router.push(`/community/${id}`)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* 페이지네이션 */}
                    <div className="mt-16 flex items-center justify-center gap-6">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage((prev) => prev - 1)}
                            className="flex h-12 w-24 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-xs font-black uppercase tracking-tighter transition-all hover:bg-zinc-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            이전
                        </button>
                        <div className="flex h-12 items-center gap-2 rounded-2xl bg-white px-6 font-mono text-sm font-black text-zinc-500 shadow-sm border border-zinc-200">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7A4FFF] to-[#FF7D00] text-[16px]">
                                {totalPages === 0 ? 1 : page + 1}
                            </span>
                            <span className="opacity-30 mx-1">/</span>
                            <span>{totalPages === 0 ? 1 : totalPages}</span>
                        </div>
                        <button
                            disabled={totalPages === 0 || page + 1 >= totalPages}
                            onClick={() => setPage((prev) => prev + 1)}
                            className="flex h-12 w-24 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-xs font-black uppercase tracking-tighter transition-all hover:bg-zinc-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            다음
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}