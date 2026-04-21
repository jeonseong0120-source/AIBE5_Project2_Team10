"use client";

import { Eye, Heart, MessageSquare } from "lucide-react";
import type { CommunityPost } from "@/types/community";

interface CommunityPostCardProps {
    post: CommunityPost;
    onClick: (postId: number) => void;
}

export default function CommunityPostCard({
                                              post,
                                              onClick,
                                          }: CommunityPostCardProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return dateString.replace("T", " ").slice(0, 16);
    };

    return (
        <button
            type="button"
            onClick={() => onClick(post.id)}
            className="group w-full cursor-pointer rounded-[2rem] border border-zinc-100 bg-white p-8 text-left shadow-xl transition-all duration-300 hover:scale-[1.01] hover:border-[#7A4FFF]/30 hover:shadow-2xl"
            aria-label={`게시글 ${post.title} 상세 보기`}
        >
            <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 text-[10px] font-black text-zinc-400 font-mono">
                        #{post.id}
                    </span>
                    <h2 className="line-clamp-1 text-2xl font-black tracking-tight text-zinc-900 group-hover:text-[#7A4FFF] transition-colors">
                        {post.title}
                    </h2>
                </div>
                <span className="shrink-0 font-mono text-[11px] font-bold text-zinc-400">
                    {formatDate(post.createdAt)}
                </span>
            </div>

            <p className="mb-8 line-clamp-2 text-sm font-medium leading-relaxed text-zinc-500">
                {post.content}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-50 pt-6">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[#7A4FFF]/10 flex items-center justify-center">
                        <span className="text-[10px] font-black text-[#7A4FFF] uppercase">
                            {post.authorNickname?.charAt(0) || "U"}
                        </span>
                    </div>
                    <span className="text-xs font-black text-zinc-700">
                        {post.authorNickname || `작성자 #${post.authorId}`}
                    </span>
                </div>

                <div className="flex items-center gap-6 text-[11px] font-black text-zinc-400 font-mono uppercase tracking-widest">
                    <span className="inline-flex items-center gap-2 transition-colors group-hover:text-zinc-600">
                        <Eye size={16} className="text-zinc-300 group-hover:text-[#7A4FFF]" />
                        {post.viewCount}
                    </span>

                    <span className="inline-flex items-center gap-2 transition-colors group-hover:text-zinc-600">
                        <Heart size={16} className="text-zinc-300 group-hover:text-red-400" />
                        {post.likeCount}
                    </span>

                    <span className="inline-flex items-center gap-2 transition-colors group-hover:text-zinc-600">
                        <MessageSquare size={16} className="text-zinc-300 group-hover:text-zinc-400" />
                        {post.commentCount}
                    </span>
                </div>
            </div>
        </button>
    );
}