"use client";

import { Eye, Heart, MessageSquare, Clock } from "lucide-react"; // 🎯 Flame, Hash 제거, Heart 추가
import type { CommunityPost } from "@/types/community";

interface CommunityPostCardProps {
    post: CommunityPost;
    onClick: (postId: number) => void;
}

export default function CommunityPostCard({ post, onClick }: CommunityPostCardProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return dateString.replace("T", " ").slice(0, 16);
    };

    return (
        <button
            type="button"
            onClick={() => onClick(post.id)}
            className="group w-full cursor-pointer rounded-[2rem] border border-zinc-100 bg-white p-6 sm:p-8 text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-[#7A4FFF]/30 hover:shadow-2xl flex flex-col sm:flex-row gap-6 items-start"
            aria-label={`게시글 ${post.title} 상세 보기`}
        >
            {/* 🎯 레딧 스타일: 좌측 투표/좋아요 바 (데스크탑 전용, 하트로 변경) */}
            <div className="hidden sm:flex flex-col items-center gap-2 min-w-[64px] p-3 rounded-2xl bg-zinc-50 border border-zinc-100 transition-all group-hover:bg-red-50 group-hover:border-red-100">
                <Heart size={24} className="text-zinc-300 group-hover:text-red-500 transition-colors" /> {/* 🎯 하트로 변경, 빨간색 하이라이트 */}
                <span className="text-sm font-black text-zinc-400 group-hover:text-red-500">{post.likeCount}</span>
            </div>

            <div className="flex-1 w-full">
                {/* 상단 메타 정보 (작성자, 시간) */}
                <div className="mb-3 flex items-center gap-3 text-[11px] font-bold text-zinc-400 font-mono">
                    <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-[#7A4FFF]/10 flex items-center justify-center">
                            <span className="text-[8px] font-black text-[#7A4FFF] uppercase">
                                {post.authorNickname?.charAt(0) || "U"}
                            </span>
                        </div>
                        <span className="text-zinc-600 hover:text-[#7A4FFF] transition-colors">{post.authorNickname || `User #${post.authorId}`}</span>
                    </div>
                    <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(post.createdAt)}</span>
                </div>

                {/* 제목 (태그 제거) */}
                <div className="mb-4">
                    <h2 className="mb-3 text-xl sm:text-2xl font-black tracking-tight text-zinc-900 group-hover:text-[#7A4FFF] transition-colors leading-snug line-clamp-2">
                        {post.title}
                    </h2>
                </div>

                {/* 본문 요약 */}
                <p className="mb-6 line-clamp-2 text-sm font-medium leading-relaxed text-zinc-500">
                    {post.content}
                </p>

                {/* 🎯 하단 통계 바 (댓글, 조회수 등, 하트로 변경) */}
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
                    {/* 모바일에서만 보이는 좋아요 버튼 (데스크탑에선 좌측 바가 담당, 하트로 변경) */}
                    <div className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-100 text-red-500">
                        <Heart size={16} />
                        <span className="text-xs font-black">{post.likeCount}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-500 transition-colors group-hover:bg-zinc-100">
                        <MessageSquare size={14} className="group-hover:text-zinc-700" />
                        <span className="text-xs font-black">{post.commentCount} <span className="hidden sm:inline">Comments</span></span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-500 transition-colors group-hover:bg-zinc-100">
                        <Eye size={14} className="group-hover:text-zinc-700" />
                        <span className="text-xs font-black">{post.viewCount} <span className="hidden sm:inline">Views</span></span>
                    </div>
                </div>
            </div>
        </button>
    );
}