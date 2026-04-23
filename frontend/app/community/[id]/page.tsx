"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye, Heart, MessageSquare, Send, Edit, Trash2, TerminalSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAccessToken, getCurrentUserId } from "@/app/lib/auth";
import {
    createCommunityComment, deleteCommunityComment, deleteCommunityPost,
    getCommunityComments, getCommunityPostDetail, likeCommunityPost,
    unlikeCommunityPost, updateCommunityComment,
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

    const fetchPostDetail = async () => {
        try {
            const data = await getCommunityPostDetail(postId);
            setPost(data);
            setLiked(data.isLiked ?? false);
        } catch (error) {
            router.push("/community");
        }
    };

    const fetchComments = async () => {
        try {
            const data = await getCommunityComments(postId);
            setComments(data);
        } catch (error) {}
    };

    const fetchAll = async () => {
        try { setLoading(true); await Promise.all([fetchPostDetail(), fetchComments()]); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!params.id || Number.isNaN(Number(params.id))) return;
        fetchAll();
    }, [params.id]);

    useEffect(() => { setCurrentUserId(getCurrentUserId()); }, []);

    const handleLikeToggle = async () => {
        const token = getAccessToken();
        if (!token) { alert("로그인 후 좋아요가 가능합니다."); router.push("/"); return; }
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
        } catch (error) { alert("좋아요 처리에 실패했습니다."); }
        finally { setLikeLoading(false); }
    };

    const handleCreateComment = async () => {
        const token = getAccessToken();
        if (!token) { alert("로그인 후 댓글 작성이 가능합니다."); router.push("/"); return; }
        if (!commentContent.trim()) return;
        try {
            setCommentLoading(true);
            await createCommunityComment({ postId, content: commentContent });
            setCommentContent("");
            await fetchComments();
            setPost((prev) => prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev);
        } catch (error) { alert("댓글 등록에 실패했습니다."); }
        finally { setCommentLoading(false); }
    };

    const handleMoveEdit = () => router.push(`/community/${postId}/edit`);

    const handleDelete = async () => {
        if (!confirm("게시글을 삭제하시겠습니까?")) return;
        try {
            setDeleteLoading(true);
            await deleteCommunityPost(postId);
            router.push("/community");
        } catch (error) { alert("게시글 삭제에 실패했습니다."); }
        finally { setDeleteLoading(false); }
    };

    const startEditComment = (c: CommunityComment) => { setEditingCommentId(c.id); setEditingCommentContent(c.content); };
    const cancelEditComment = () => { setEditingCommentId(null); setEditingCommentContent(""); };

    const handleUpdateComment = async (id: number) => {
        if (!editingCommentContent.trim()) return;
        try {
            setCommentActionLoading(true);
            await updateCommunityComment(id, editingCommentContent);
            await fetchComments();
            cancelEditComment();
        } catch (error) { alert("댓글 수정에 실패했습니다."); }
        finally { setCommentActionLoading(false); }
    };

    const handleDeleteComment = async (id: number) => {
        if (!confirm("댓글을 삭제하시겠습니까?")) return;
        try {
            setCommentActionLoading(true);
            await deleteCommunityComment(id);
            await fetchComments();
            setPost((prev) => prev ? { ...prev, commentCount: Math.max(prev.commentCount - 1, 0) } : prev);
        } catch (error) { alert("댓글 삭제에 실패했습니다."); }
        finally { setCommentActionLoading(false); }
    };

    const formatDate = (dateString?: string) => dateString ? dateString.replace("T", " ").slice(0, 16) : "";

    // 🎯 Notion 스타일 코드 블록 파서 (가독성 개선)
    const renderNotionStyleContent = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(```[\s\S]*?```)/g);

        return parts.map((part, index) => {
            if (part.startsWith('```') && part.endsWith('```')) {
                const codeBlock = part.slice(3, -3);
                const firstLineBreak = codeBlock.indexOf('\n');
                let lang = "code";
                let code = codeBlock;

                if (firstLineBreak !== -1) {
                    const potentialLang = codeBlock.slice(0, firstLineBreak).trim();
                    if (!potentialLang.includes(' ') && potentialLang.length > 0) {
                        lang = potentialLang;
                        code = codeBlock.slice(firstLineBreak + 1);
                    }
                }

                return (
                    <div key={index} className="my-10 rounded-[1.25rem] bg-[#1e1e1e] overflow-hidden shadow-xl border border-zinc-800">
                        <div className="flex items-center px-5 py-3 bg-[#2d2d2d] border-b border-zinc-800">
                            <TerminalSquare size={16} className="text-zinc-400 mr-3" />
                            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{lang}</span>
                            <div className="ml-auto flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                            </div>
                        </div>
                        <pre className="p-6 overflow-x-auto custom-scrollbar">
                            <code className="text-sm font-mono leading-loose text-zinc-300">{code}</code>
                        </pre>
                    </div>
                );
            }
            // 🎯 본문 문단 여백 및 줄 간격 확대 (가독성 향상)
            return <p key={index} className="mb-8 whitespace-pre-wrap text-[16px] font-medium leading-[1.8] text-zinc-700 tracking-[-0.01em]">{part}</p>;
        });
    };

    if (loading || (postId && sessionLoading)) return <div className="min-h-screen bg-zinc-50 animate-pulse" />;
    if (!post) return null;

    const isMyPost = currentUserId !== null && post.authorId === currentUserId;

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-32 font-sans">
            <GlobalNavbar user={user} profile={profile} />

            {/* 🎯 Notion 스타일 좁은 레이아웃 (max-w-3xl) 적용 */}
            <main className="max-w-3xl mx-auto px-6 pt-24 relative z-10">

                {/* 뒤로 가기 버튼 (스타일 다듬기) */}
                <button
                    onClick={() => router.push("/community")}
                    className="group mb-12 inline-flex items-center gap-2.5 rounded-full bg-white border border-zinc-200 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 hover:shadow-sm transition-all"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> 목록으로
                </button>

                <article className="mb-24">
                    {/* 게시글 헤더 영역 */}
                    <header className="mb-14 pb-12 border-b border-zinc-200">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-[11px] font-black text-[#7A4FFF] bg-purple-50 px-3 py-1 rounded-full border border-purple-100 uppercase tracking-widest shadow-sm">
                                Community
                            </span>
                        </div>

                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-950 leading-[1.3] break-keep flex-1">
                                {post.title}
                            </h1>

                            {/* 작성자 본인일 경우 수정/삭제 버튼 */}
                            {isMyPost && (
                                <div className="flex gap-2 shrink-0 md:mt-2">
                                    <button onClick={handleMoveEdit} className="flex items-center justify-center w-10 h-10 bg-white border border-zinc-200 text-zinc-400 hover:text-[#7A4FFF] hover:border-purple-200 hover:bg-purple-50 rounded-xl transition-all shadow-sm">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={handleDelete} className="flex items-center justify-center w-10 h-10 bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all shadow-sm">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 작성자 정보 및 통계 */}
                        <div className="flex items-center justify-between mt-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#7A4FFF] to-[#FF7D00] flex items-center justify-center font-black text-white text-lg shadow-md ring-4 ring-white">
                                    {post.authorNickname?.charAt(0) || "U"}
                                </div>
                                <div>
                                    <p className="text-[15px] font-black text-zinc-900">{post.authorNickname || `User #${post.authorId}`}</p>
                                    <p className="text-xs font-bold text-zinc-400 font-mono mt-0.5">{formatDate(post.createdAt)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 text-[12px] font-black text-zinc-400 font-mono">
                                <span className="flex items-center gap-2"><Eye size={16} className="text-zinc-300" /> {post.viewCount}</span>
                                <span className="flex items-center gap-2"><Heart size={16} className={liked ? "text-red-500 fill-red-500" : "text-zinc-300"} /> {post.likeCount}</span>
                            </div>
                        </div>
                    </header>

                    {/* 본문 렌더링 영역 */}
                    <div className="prose-container">
                        {renderNotionStyleContent(post.content)}
                    </div>

                    {/* 좋아요 액션 버튼 */}
                    <div className="mt-24 flex justify-center">
                        <button
                            onClick={handleLikeToggle}
                            disabled={likeLoading}
                            className={`group flex items-center gap-4 rounded-full px-10 py-5 text-[15px] font-black transition-all duration-300 shadow-xl border-2 ${
                                liked
                                    ? 'bg-red-50 border-red-100 text-red-500 shadow-red-100'
                                    : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-900 hover:text-zinc-950 hover:shadow-2xl'
                            }`}
                        >
                            <Heart size={22} className={`transition-transform group-hover:scale-110 ${liked ? "fill-red-500" : ""}`} />
                            {liked ? "유용한 글입니다" : "이 글 추천하기"}
                        </button>
                    </div>
                </article>

                {/* 댓글 섹션 */}
                <section className="mt-20 border-t border-zinc-200 pt-16">
                    <h2 className="text-2xl font-black tracking-tight text-zinc-950 flex items-center gap-3 mb-10">
                        Comments
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-[#7A4FFF] text-sm">
                            {comments.length}
                        </span>
                    </h2>

                    {/* 댓글 입력창 (세련된 포커스 효과) */}
                    <div className="mb-14 overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white shadow-sm focus-within:border-[#7A4FFF]/50 focus-within:ring-4 focus-within:ring-[#7A4FFF]/10 transition-all">
                        <textarea
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            rows={3}
                            placeholder="이 글에 대한 생각이나 의견을 남겨주세요."
                            className="w-full resize-none bg-transparent px-6 py-6 text-[15px] font-medium leading-relaxed outline-none placeholder:text-zinc-400 text-zinc-800"
                        />
                        <div className="flex justify-end p-4 bg-zinc-50 border-t border-zinc-100">
                            <button
                                onClick={handleCreateComment}
                                disabled={commentLoading}
                                className="flex items-center gap-2.5 rounded-xl bg-zinc-900 px-7 py-3 text-sm font-black text-white transition-all hover:bg-zinc-800 disabled:opacity-50 shadow-md"
                            >
                                <Send size={16} /> 댓글 등록
                            </button>
                        </div>
                    </div>

                    {/* 댓글 목록 */}
                    <div className="space-y-6">
                        <AnimatePresence>
                            {comments.length === 0 ? (
                                <div className="py-16 text-center border-2 border-dashed border-zinc-200 rounded-[2rem] bg-zinc-50/50">
                                    <p className="text-zinc-400 text-sm font-bold">아직 작성된 댓글이 없습니다. 첫 번째로 의견을 남겨보세요!</p>
                                </div>
                            ) : (
                                comments.map((comment) => {
                                    const isMyComment = currentUserId !== null && comment.authorId === currentUserId;
                                    const isEditing = editingCommentId === comment.id;

                                    return (
                                        <div key={comment.id} className="group rounded-[1.5rem] border border-zinc-100 bg-white p-7 shadow-sm transition-all hover:border-zinc-200 hover:shadow-md">
                                            <div className="mb-5 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-black text-zinc-500 text-xs">
                                                        {comment.authorNickname?.charAt(0) || "U"}
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-black text-zinc-900 leading-none mb-1.5">{comment.authorNickname || `User #${comment.authorId}`}</p>
                                                        <p className="text-[11px] font-bold text-zinc-400 font-mono">{formatDate(comment.createdAt)}</p>
                                                    </div>
                                                </div>

                                                {/* 내 댓글일 경우 나오는 액션 버튼 */}
                                                {isMyComment && !isEditing && (
                                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEditComment(comment)} className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-[#7A4FFF] hover:bg-purple-50 rounded-lg transition-colors"><Edit size={14} /></button>
                                                        <button onClick={() => handleDeleteComment(comment.id)} className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                    </div>
                                                )}
                                            </div>

                                            {isEditing ? (
                                                <div className="space-y-4">
                                                    <textarea
                                                        value={editingCommentContent}
                                                        onChange={(e) => setEditingCommentContent(e.target.value)}
                                                        rows={2}
                                                        className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-[15px] outline-none focus:border-[#7A4FFF] focus:bg-white transition-all"
                                                    />
                                                    <div className="flex justify-end gap-3">
                                                        <button onClick={cancelEditComment} className="rounded-lg px-5 py-2.5 text-xs font-black text-zinc-500 hover:bg-zinc-100 transition-colors">취소</button>
                                                        <button onClick={() => handleUpdateComment(comment.id)} className="rounded-lg bg-[#7A4FFF] px-5 py-2.5 text-xs font-black text-white shadow-md shadow-purple-100">저장</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap text-[15px] font-medium leading-[1.7] text-zinc-700 pl-[3.5rem]">{comment.content}</p>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </main>
        </div>
    );
}