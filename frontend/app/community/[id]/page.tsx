"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye, Heart, MessageSquare, Loader2, Send, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import GlobalNavbar from "@/components/common/GlobalNavbar";
import { useSessionBootstrap } from "@/app/hooks/useSessionBootstrap";

export default function CommunityDetailPage() {
    const params = useParams();
    const router = useRouter();

    const postId = Number(params.id);
    const { user, profile, loading: sessionLoading } = useSessionBootstrap();

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

    const [cursor, setCursor] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

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
        if (!params.id || Number.isNaN(Number(params.id))) {
            setLoading(false);
            router.push("/community");
            return;
        }
        fetchAll();
    }, [params.id]);

    useEffect(() => {
        setCurrentUserId(getCurrentUserId());
    }, []);

    const handleLikeToggle = async () => {
        const token = getAccessToken();
        if (!token) {
            alert("로그인 후 좋아요가 가능합니다.");
            router.push("/login");
            return;
        }

        try {
            setLikeLoading(true);
            if (liked) {
                const result = await unlikeCommunityPost(postId);
                setPost((prev) => prev ? { ...prev, likeCount: result.likeCount } : prev);
                setLiked(false);
            } else {
                const result = await likeCommunityPost(postId);
                setPost((prev) => prev ? { ...prev, likeCount: result.likeCount } : prev);
                setLiked(true);
            }
        } catch (error) {
            alert("좋아요 처리에 실패했습니다.");
        } finally {
            setLikeLoading(false);
        }
    };

    const handleCreateComment = async () => {
        const token = getAccessToken();
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
            await createCommunityComment({ postId, content: commentContent });
            setCommentContent("");
            await fetchComments();
            setPost((prev) => prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev);
        } catch (error) {
            alert("댓글 등록에 실패했습니다.");
        } finally {
            setCommentLoading(false);
        }
    };

    const handleMoveEdit = () => router.push(`/community/${postId}/edit`);

    const handleDelete = async () => {
        if (!confirm("게시글을 삭제하시겠습니까?")) return;
        try {
            setDeleteLoading(true);
            await deleteCommunityPost(postId);
            alert("게시글이 삭제되었습니다.");
            router.push("/community");
        } catch (error) {
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
            alert("댓글 수정에 실패했습니다.");
        } finally {
            setCommentActionLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!confirm("댓글을 삭제하시겠습니까?")) return;
        try {
            setCommentActionLoading(true);
            await deleteCommunityComment(commentId);
            await fetchComments();
            setPost((prev) => prev ? { ...prev, commentCount: Math.max(prev.commentCount - 1, 0) } : prev);
        } catch (error) {
            alert("댓글 삭제에 실패했습니다.");
        } finally {
            setCommentActionLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        return dateString.replace("T", " ").slice(0, 16);
    };

    const isInitialLoading = loading || (postId && sessionLoading);

    if (isInitialLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-black text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">
                게시글 데이터를 동기화 중입니다...
            </div>
        );
    }

    if (!post) return null;

    const isMyPost = currentUserId !== null && post.authorId === currentUserId;

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 relative overflow-hidden font-sans">
            {/* 배경 글로우 */}
            <div
                className="pointer-events-none fixed left-0 top-0 z-0 h-[300px] w-[300px] rounded-full bg-[#7A4FFF]/10 blur-[120px] will-change-transform"
                style={{ transform: `translate(${cursor.x - 150}px, ${cursor.y - 150}px)` }}
            />

            <GlobalNavbar user={user} profile={profile} />

            <div className="max-w-4xl mx-auto px-8 relative z-10 pt-12">
                <button
                    onClick={() => router.push("/community")}
                    className="group mb-10 inline-flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-md px-6 py-3 text-xs font-black uppercase tracking-widest text-zinc-500 transition-all hover:bg-white hover:text-zinc-950 shadow-sm"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    목록으로 돌아가기
                </button>

                {/* 메인 포스트 카드 */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[2.5rem] border border-zinc-100 bg-white p-12 shadow-2xl"
                >
                    <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-[10px] font-black text-zinc-400 font-mono uppercase tracking-widest">Post #{post.id}</span>
                                <span className="text-[10px] font-black text-[#7A4FFF] bg-purple-50 px-2 py-1 rounded-lg border border-purple-100 uppercase tracking-widest">COMMUNITY</span>
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter text-zinc-950 leading-tight">
                                {post.title}
                            </h1>
                        </div>

                        {isMyPost && (
                            <div className="flex gap-2 shrink-0">
                                <button onClick={handleMoveEdit} className="p-3 bg-zinc-50 text-zinc-400 hover:text-[#7A4FFF] hover:bg-purple-50 rounded-xl transition-all border border-zinc-100"><Edit size={18} /></button>
                                <button onClick={handleDelete} disabled={deleteLoading} className="p-3 bg-zinc-50 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-zinc-100"><Trash2 size={18} /></button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mb-10 pb-10 border-b border-zinc-50">
                        <div className="w-10 h-10 rounded-full bg-[#7A4FFF]/10 flex items-center justify-center font-black text-[#7A4FFF] text-sm">
                            {post.authorNickname?.charAt(0) || "U"}
                        </div>
                        <div>
                            <p className="text-sm font-black text-zinc-900">{post.authorNickname || `작성자 #${post.authorId}`}</p>
                            <p className="text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-wider">{formatDate(post.createdAt)}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-6 text-[11px] font-black text-zinc-400 font-mono uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Eye size={16} className="text-zinc-300" /> {post.viewCount}</span>
                            <span className="flex items-center gap-2"><Heart size={16} className="text-zinc-300" /> {post.likeCount}</span>
                            <span className="flex items-center gap-2"><MessageSquare size={16} className="text-zinc-300" /> {post.commentCount}</span>
                        </div>
                    </div>

                    <div className="min-h-[300px] whitespace-pre-wrap text-base font-medium leading-8 text-zinc-600">
                        {post.content}
                    </div>

                    <div className="mt-12 flex justify-center pt-10 border-t border-zinc-50">
                        <button
                            onClick={handleLikeToggle}
                            disabled={likeLoading}
                            className={`flex items-center gap-3 rounded-full px-10 py-5 text-sm font-black uppercase tracking-[0.2em] transition-all shadow-xl font-mono ${liked ? 'bg-[#7A4FFF] text-white shadow-purple-200' : 'bg-white border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white hover:shadow-zinc-200'}`}
                        >
                            <Heart size={20} fill={liked ? "white" : "transparent"} className={liked ? "animate-bounce" : ""} />
                            {liked ? "게시글이 좋습니다" : "게시글 추천하기"}
                        </button>
                    </div>
                </motion.section>

                {/* 댓글 섹션 */}
                <section className="mt-12">
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-2xl font-black tracking-tight text-zinc-950 uppercase font-mono">
                            댓글 <span className="text-[#7A4FFF]">{comments.length}</span>
                        </h2>
                    </div>

                    {/* 댓글 입력창 */}
                    <div className="mb-12 overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white/50 backdrop-blur-md shadow-xl">
                        <textarea
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            rows={4}
                            placeholder="이 게시글에 대한 마스터의 생각을 공유해주세요."
                            className="w-full resize-none bg-transparent px-8 py-8 text-sm font-medium leading-relaxed outline-none placeholder:text-zinc-400"
                        />
                        <div className="flex justify-end p-4 bg-zinc-50/50 border-t border-zinc-100">
                            <button
                                onClick={handleCreateComment}
                                disabled={commentLoading}
                                className="flex items-center gap-3 rounded-[1.25rem] bg-zinc-950 px-8 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800 disabled:opacity-50 shadow-lg"
                            >
                                <Send size={14} />
                                {commentLoading ? "전송 중..." : "댓글 게시"}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <AnimatePresence>
                            {comments.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center rounded-[2.5rem] border-2 border-dashed border-zinc-200 bg-white/40 backdrop-blur-sm shadow-inner text-zinc-300 font-black italic uppercase tracking-widest">
                                    첫 번째 댓글의 주인공이 되어보세요
                                </motion.div>
                            ) : (
                                comments.map((comment, idx) => {
                                    const isMyComment = currentUserId !== null && comment.authorId === currentUserId;
                                    const isEditing = editingCommentId === comment.id;

                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={comment.id}
                                            className="group rounded-[2rem] border border-zinc-100 bg-white p-8 shadow-md transition-all hover:border-[#7A4FFF]/20 hover:shadow-xl"
                                        >
                                            <div className="mb-6 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center font-black text-zinc-400 text-[10px]">
                                                        {comment.authorNickname?.charAt(0) || "U"}
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] font-black text-zinc-900 leading-none mb-1">{comment.authorNickname || `User #${comment.authorId}`}</p>
                                                        <p className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider">{formatDate(comment.createdAt)}</p>
                                                    </div>
                                                </div>

                                                {isMyComment && !isEditing && (
                                                    <div className="flex gap-1 transition-opacity opacity-100 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
                                                        <button onClick={() => startEditComment(comment)} className="p-2 text-zinc-400 hover:text-[#7A4FFF] hover:bg-purple-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A4FFF]/30"><Edit size={14} /></button>
                                                        <button onClick={() => handleDeleteComment(comment.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30"><Trash2 size={14} /></button>
                                                    </div>
                                                )}
                                            </div>

                                            {isEditing ? (
                                                <div className="space-y-4">
                                                    <textarea
                                                        value={editingCommentContent}
                                                        onChange={(e) => setEditingCommentContent(e.target.value)}
                                                        rows={3}
                                                        className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 text-sm font-medium outline-none focus:border-[#7A4FFF] focus:ring-4 focus:ring-[#7A4FFF]/5 transition-all"
                                                    />
                                                    <div className="flex justify-end gap-3">
                                                        <button onClick={cancelEditComment} className="rounded-xl px-5 py-2 text-xs font-black uppercase text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-400/30">취소</button>
                                                        <button onClick={() => handleUpdateComment(comment.id)} disabled={commentActionLoading} className="rounded-xl bg-[#7A4FFF] px-6 py-2 text-xs font-black uppercase text-white shadow-lg shadow-purple-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30">저장</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap text-[14px] font-medium leading-7 text-zinc-600">
                                                    {comment.content}
                                                </p>
                                            )}
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </div>
        </div>
    );
}