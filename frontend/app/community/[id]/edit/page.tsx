"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCommunityPostDetail, updateCommunityPost } from "@/app/lib/communityApi";

export default function CommunityEditPage() {
    const params = useParams();
    const router = useRouter();
    const postId = Number(params.id);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
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

        if (!postId || Number.isNaN(postId)) return;
        fetchPost();
    }, [postId, router]);

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

            await updateCommunityPost(postId, {
                title,
                content,
            });

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
            <div className="min-h-screen bg-zinc-50 px-6 py-10 md:px-10">
                <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
                    게시글 정보를 불러오는 중...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 px-6 py-10 md:px-10">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-zinc-900">게시글 수정</h1>
                    <p className="mt-2 text-sm text-zinc-500">
                        제목과 내용을 수정할 수 있습니다.
                    </p>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                제목
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-[#FF7D00]"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                내용
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={10}
                                className="w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-[#FF7D00]"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleCancel}
                                className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                            >
                                취소
                            </button>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="rounded-xl bg-[#FF7D00] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                            >
                                {loading ? "수정 중..." : "수정하기"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}