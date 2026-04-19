"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye, Heart, MessageSquare } from "lucide-react";
import { getAccessToken, getCurrentUserId } from "@/app/lib/auth";
import {
    createCommunityComment,
    deleteCommunityComment,
    deleteCommunityPost,
    getCommunityComments,
    getCommunityPostDetail,
    likeCommunityPost,
    unlikeCommunityPost,
    updateCommunityComment,
} from "@/app/lib/communityApi";
import type { CommunityComment, CommunityPost } from "@/types/community";

export default function CommunityDetailPage() {
    const params = useParams();
    const router = useRouter();

    const postId = Number(params.id);

    const [post, setPost] = useState<CommunityPost | null>(null);
    const [comments, setComments] = useState<CommunityComment[]>([]);
    const [commentContent, setCommentContent] = useState("");

    const [loading, setLoading] = useState(true);
    const [commentLoading, setCommentLoading] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [liked, setLiked] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentContent, setEditingCommentContent] = useState("");
    const [commentActionLoading, setCommentActionLoading] = useState(false);

    const fetchPostDetail = async () => {
        try {
            const data = await getCommunityPostDetail(postId);
            setPost(data);
            setLiked(data.isLiked ?? false);
        } catch (error) {
            console.error("게시글 상세 조회 실패:", error);
            alert("게시글을 불러오지 못했습니다.");
            router.push("/community");
        }
    };

    const fetchComments = async () => {
        try {
            const data = await getCommunityComments(postId);
            setComments(data);
        } catch (error) {
            console.error("댓글 조회 실패:", error);
            alert("댓글을 불러오지 못했습니다.");
        }
    };

    const fetchAll = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchPostDetail(), fetchComments()]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (Number.isNaN(postId)) return;
        fetchAll();
    }, [postId]);

    useEffect(() => {
        setCurrentUserId(getCurrentUserId());
    }, []);

    const getToken = () => getAccessToken();

    const handleLikeToggle = async () => {
        const token = getToken();

        if (!token) {
            alert("로그인 후 좋아요가 가능합니다.");
            router.push("/login");
            return;
        }

        try {
            setLikeLoading(true);

            if (liked) {
                const result = await unlikeCommunityPost(postId);

                setPost((prev) =>
                    prev
                        ? {
                            ...prev,
                            likeCount: result.likeCount,
                        }
                        : prev
                );
                setLiked(false);
            } else {
                const result = await likeCommunityPost(postId);

                setPost((prev) =>
                    prev
                        ? {
                            ...prev,
                            likeCount: result.likeCount,
                        }
                        : prev
                );
                setLiked(true);
            }
        } catch (error) {
            console.error("좋아요 처리 실패:", error);
            alert("좋아요 처리에 실패했습니다.");
        } finally {
            setLikeLoading(false);
        }
    };

    const handleCreateComment = async () => {
        const token = getToken();

        if (!token) {
            alert("로그인 후 댓글 작성이 가능합니다.");
            router.push("/login");
            return;
        }

        if (!commentContent.trim()) {
            alert("댓글 내용을 입력해주세요.");
            return;
        }

        try {
            setCommentLoading(true);

            await createCommunityComment({
                postId,
                content: commentContent,
            });

            setCommentContent("");
            await fetchComments();

            setPost((prev) =>
                prev
                    ? {
                        ...prev,
                        commentCount: prev.commentCount + 1,
                    }
                    : prev
            );
        } catch (error) {
            console.error("댓글 등록 실패:", error);
            alert("댓글 등록에 실패했습니다.");
        } finally {
            setCommentLoading(false);
        }
    };

    const handleMoveEdit = () => {
        const token = getToken();

        if (!token) {
            alert("로그인 후 수정이 가능합니다.");
            router.push("/login");
            return;
        }

        router.push(`/community/${postId}/edit`);
    };

    const handleDelete = async () => {
        const token = getToken();

        if (!token) {
            alert("로그인 후 삭제가 가능합니다.");
            router.push("/login");
            return;
        }

        const confirmed = confirm("게시글을 삭제하시겠습니까?");
        if (!confirmed) return;

        try {
            setDeleteLoading(true);
            await deleteCommunityPost(postId);
            alert("게시글이 삭제되었습니다.");
            router.push("/community");
        } catch (error) {
            console.error("게시글 삭제 실패:", error);
            alert("게시글 삭제에 실패했습니다.");
        } finally {
            setDeleteLoading(false);
        }
    };

    const startEditComment = (comment: CommunityComment) => {
        setEditingCommentId(comment.id);
        setEditingCommentContent(comment.content);
    };

    const cancelEditComment = () => {
        setEditingCommentId(null);
        setEditingCommentContent("");
    };

    const handleUpdateComment = async (commentId: number) => {
        const token = getToken();

        if (!token) {
            alert("로그인 후 댓글 수정이 가능합니다.");
            router.push("/login");
            return;
        }

        if (!editingCommentContent.trim()) {
            alert("댓글 내용을 입력해주세요.");
            return;
        }

        try {
            setCommentActionLoading(true);
            await updateCommunityComment(commentId, editingCommentContent);
            await fetchComments();
            cancelEditComment();
        } catch (error) {
            console.error("댓글 수정 실패:", error);
            alert("댓글 수정에 실패했습니다.");
        } finally {
            setCommentActionLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        const token = getToken();

        if (!token) {
            alert("로그인 후 댓글 삭제가 가능합니다.");
            router.push("/login");
            return;
        }

        const confirmed = confirm("댓글을 삭제하시겠습니까?");
        if (!confirmed) return;

        try {
            setCommentActionLoading(true);
            await deleteCommunityComment(commentId);
            await fetchComments();

            setPost((prev) =>
                prev
                    ? {
                        ...prev,
                        commentCount: Math.max(prev.commentCount - 1, 0),
                    }
                    : prev
            );
        } catch (error) {
            console.error("댓글 삭제 실패:", error);
            alert("댓글 삭제에 실패했습니다.");
        } finally {
            setCommentActionLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        return dateString.replace("T", " ").slice(0, 16);
    };

    if (Number.isNaN(postId)) {
        return (
            <div className="min-h-screen bg-zinc-50 px-6 py-10 md:px-10">
                <div className="mx-auto max-w-4xl rounded-3xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
                    잘못된 접근입니다.
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 px-6 py-10 md:px-10">
                <div className="mx-auto max-w-4xl rounded-3xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
                    게시글을 불러오는 중...
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-zinc-50 px-6 py-10 md:px-10">
                <div className="mx-auto max-w-4xl rounded-3xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
                    게시글을 찾을 수 없습니다.
                </div>
            </div>
        );
    }

    const isMyPost = currentUserId !== null && post.authorId === currentUserId;

    return (
        <div className="min-h-screen bg-zinc-50 px-6 py-10 md:px-10">
            <div className="mx-auto max-w-4xl">
                <button
                    onClick={() => router.push("/community")}
                    className="mb-6 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                >
                    <ArrowLeft size={16} />
                    목록으로
                </button>

                <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="mb-4">
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900">
                            {post.title}
                        </h1>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                            <span>{post.authorNickname || `작성자 #${post.authorId}`}</span>
                            <span>{formatDate(post.createdAt)}</span>

                            <span className="inline-flex items-center gap-1">
                <Eye size={15} />
                                {post.viewCount}
              </span>

                            <span className="inline-flex items-center gap-1">
                <Heart size={15} />
                                {post.likeCount}
              </span>

                            <span className="inline-flex items-center gap-1">
                <MessageSquare size={15} />
                                {post.commentCount}
              </span>
                        </div>
                    </div>

                    <div className="min-h-[220px] whitespace-pre-wrap rounded-2xl bg-zinc-50 p-5 text-sm leading-7 text-zinc-700">
                        {post.content}
                    </div>

                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <button
                            onClick={handleLikeToggle}
                            disabled={likeLoading}
                            className="rounded-xl bg-[#FF7D00] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                        >
                            {likeLoading ? "처리 중..." : liked ? "좋아요 취소" : "좋아요"}
                        </button>

                        {isMyPost && (
                            <>
                                <button
                                    onClick={handleMoveEdit}
                                    className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                                >
                                    수정
                                </button>

                                <button
                                    onClick={handleDelete}
                                    disabled={deleteLoading}
                                    className="rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                                >
                                    {deleteLoading ? "삭제 중..." : "삭제"}
                                </button>
                            </>
                        )}
                    </div>
                </section>

                <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-xl font-black text-zinc-900">
                        댓글 {comments.length}개
                    </h2>

                    <div className="mb-6 rounded-2xl bg-zinc-50 p-4">
            <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={4}
                placeholder="댓글을 입력해주세요"
                className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#FF7D00]"
            />

                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={handleCreateComment}
                                disabled={commentLoading}
                                className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                            >
                                {commentLoading ? "등록 중..." : "댓글 등록"}
                            </button>
                        </div>
                    </div>

                    {comments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
                            아직 댓글이 없습니다.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => {
                                const isMyComment =
                                    currentUserId !== null && comment.authorId === currentUserId;
                                const isEditing = editingCommentId === comment.id;

                                return (
                                    <div
                                        key={comment.id}
                                        className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                                    >
                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
                                            <div className="flex flex-wrap items-center gap-3">
                        <span>
                          {comment.authorNickname || `작성자 #${comment.authorId}`}
                        </span>
                                                <span>{formatDate(comment.createdAt)}</span>
                                            </div>

                                            {isMyComment && !isEditing && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => startEditComment(comment)}
                                                        disabled={commentActionLoading}
                                                        className="text-xs font-medium text-zinc-600 hover:underline disabled:opacity-50"
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        disabled={commentActionLoading}
                                                        className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50"
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {isEditing ? (
                                            <div className="space-y-3">
                        <textarea
                            value={editingCommentContent}
                            onChange={(e) => setEditingCommentContent(e.target.value)}
                            rows={3}
                            className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#FF7D00]"
                        />
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={cancelEditComment}
                                                        className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
                                                    >
                                                        취소
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateComment(comment.id)}
                                                        disabled={commentActionLoading}
                                                        className="rounded-xl bg-[#FF7D00] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                                                    >
                                                        {commentActionLoading ? "수정 중..." : "저장"}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                                                {comment.content}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}