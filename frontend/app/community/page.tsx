"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine, Search } from "lucide-react";
import { getCommunityPosts } from "@/app/lib/communityApi";
import type { CommunityPost } from "@/types/community";
import CommunityPostCard from "@/components/community/CommunityPostCard";

export default function CommunityPage() {
    const router = useRouter();

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
        <div className="min-h-screen bg-zinc-50 pb-20">
            {/* 상단 */}
            <section className="border-b border-zinc-200 bg-white px-6 py-12 md:px-10">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-2 flex items-center">
                        <img
                            src="/devnear-logo.png" 
                            alt="DevNear_Logo"
                            className="h-5 w-auto object-contain mr-1" 
                        />
                        <p className="text-sm font-bold text-[#FF7D00]">DevNear Community</p>
                    </div>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-zinc-900">
                                커뮤니티
                            </h1>
                            <p className="mt-2 text-sm text-zinc-500">
                                프리랜서와 클라이언트가 자유롭게 소통하는 공간입니다.
                            </p>
                        </div>

                        <button
                            onClick={handleMoveWrite}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF7D00] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
                        >
                            <PencilLine size={18} />
                            글쓰기
                        </button>
                    </div>
                </div>
            </section>

            {/* 검색/정렬 */}
            <section className="px-6 py-8 md:px-10">
                <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3">
                            <Search size={18} className="text-zinc-400" />
                            <input
                                type="text"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSearch();
                                }}
                                placeholder="제목 또는 내용으로 검색"
                                className="w-full bg-transparent text-sm outline-none"
                            />
                        </div>

                        <select
                            value={sort}
                            onChange={(e) => {
                                setPage(0);
                                setSort(e.target.value);
                            }}
                            className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none"
                        >
                            <option value="latest">최신순</option>
                            <option value="likes">좋아요순</option>
                        </select>

                        <button
                            onClick={handleSearch}
                            className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
                        >
                            검색
                        </button>
                    </div>
                </div>
            </section>

            {/* 목록 */}
            <main className="px-6 md:px-10">
                <div className="mx-auto max-w-6xl">
                    {loading ? (
                        <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
                            게시글을 불러오는 중...
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
                            게시글이 없습니다.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <CommunityPostCard
                                    key={post.id}
                                    post={post}
                                    onClick={handleMoveDetail}
                                />
                            ))}
                        </div>
                    )}

                    <div className="mt-8 flex items-center justify-center gap-2">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage((prev) => prev - 1)}
                            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            이전
                        </button>

                        <span className="px-3 text-sm text-zinc-600">
              {totalPages === 0 ? 1 : page + 1} / {totalPages === 0 ? 1 : totalPages}
            </span>

                        <button
                            disabled={totalPages === 0 || page + 1 >= totalPages}
                            onClick={() => setPage((prev) => prev + 1)}
                            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            다음
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}