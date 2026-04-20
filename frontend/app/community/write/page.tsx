"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine } from "lucide-react";
import { createCommunityPost } from "@/app/lib/communityApi";

export default function CommunityWritePage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

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

            await createCommunityPost({
                title,
                content,
            });

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
        <div className="min-h-screen bg-zinc-50 px-6 py-10 md:px-10">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-[#FF7D00]">
                        <PencilLine size={18} />
                        <span className="text-sm font-bold">Write Post</span>
                    </div>

                    <h1 className="mt-2 text-3xl font-black text-zinc-900">
                        커뮤니티 글쓰기
                    </h1>

                    <p className="mt-2 text-sm text-zinc-500">
                        자유롭게 내용을 작성해보세요.
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
                                placeholder="제목을 입력해주세요"
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
                                placeholder="내용을 입력해주세요"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={10}
                                className="w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-[#FF7D00]"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
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
                                {loading ? "등록 중..." : "등록하기"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}