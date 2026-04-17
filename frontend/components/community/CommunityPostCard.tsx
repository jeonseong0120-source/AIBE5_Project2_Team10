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
        <div
            onClick={() => onClick(post.id)}
            className="cursor-pointer rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#FF7D00]/40"
        >
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="line-clamp-1 text-xl font-black tracking-tight text-zinc-900">
                    {post.title}
                </h2>
                <span className="shrink-0 text-xs text-zinc-400">
          {formatDate(post.createdAt)}
        </span>
            </div>

            <p className="mb-4 line-clamp-2 text-sm leading-6 text-zinc-600">
                {post.content}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500">
                <span>작성자 #{post.authorId}</span>

                <span className="inline-flex items-center gap-1">
          <Eye size={14} />
                    {post.viewCount}
        </span>

                <span className="inline-flex items-center gap-1">
          <Heart size={14} />
                    {post.likeCount}
        </span>

                <span className="inline-flex items-center gap-1">
          <MessageSquare size={14} />
                    {post.commentCount}
        </span>
            </div>
        </div>
    );
}