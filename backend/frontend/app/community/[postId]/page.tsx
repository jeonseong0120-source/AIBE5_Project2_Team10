"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    getCommunityPostDetail,
    getCommunityComments,
    likeCommunityPost,
    unlikeCommunityPost,
} from "@/app/lib/communityApi";
import type {
    CommunityPost,
    CommunityComment,
    CommunityLikeResponse,
} from "@/types/community";

export default function CommunityPostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params?.postId ? Number(params.postId) : null;

    const [post, setPost] = useState<CommunityPost | null>(null);
    const [comments, setComments] = useState<CommunityComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);

    const fetchData = async () => {
        if (!postId) return;
        try {
            setLoading(true);
            const p = await getCommunityPostDetail(postId);
            const c = await getCommunityComments(postId);
            setPost(p);
            setComments(c);
        } catch (e) {
 .DS_Store .gitattributes .gradle HELP.md build build.gradle chat-test.html dataSources.local.xml docker-compose.yml frontend gradle gradle.xml gradlew gradlew.bat out package-lock.json settings.gradle src .");
            router.push("/community");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId]);

    const handleLike = async () => {
        if (!postId) return;
        try {
            if (!liked) {
                const res: CommunityLikeResponse = await likeCommunityPost(postId);
                setPost((prev) => (prev ? { ...prev, likeCount: res.likeCount } : prev));
                setLiked(true);
            } else {
                const res: CommunityLikeResponse = await unlikeCommunityPost(postId);
                setPost((prev) => (prev ? { ...prev, likeCount: res.likeCount } : prev));
                setLiked(false);
            }
        } catch (e) {
.");
        }
    };

    if (loading) {
 ...</div>;
    }

    if (!post) {
        return <div className=".</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-50 pb-20">
            <main className="px-6 md:px-10">
                <div className="mx-auto max-w-3xl space-y-6">
                    <div className="rounded-3xl border border-zinc-200 bg-white p-6">
                        <h1 className="mb-2 text-2xl font-black">{post.title}</h1>
                        <div className="mb-4 text-sm text-zinc-500"> #{post.       {post.createdAt?.replace("T", " ").slice(0,16)}</div>authorId} 
                        <div className="prose max-w-full text-zinc-700">{post.content}</div>

                        <div className="mt-6 flex items-center gap-4">
                            <button onClick={handleLike} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-bold text-white">
                                {liked ? " " : ""} ({post.likeCount})
                            </button>
mvn clean install -U</button>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-zinc-200 bg-white p-6">
                        <h2 className="mb-4 text-lg font-bold"> ({comments.length})</h2>
                        {comments.length === 0 ? (
                            <div className="text-zinc-.</div>
                        ) : (
                            <ul className="space-y-3">
                                {comments.map((c) => (
                                    <li key={c.id} className="rounded-lg border p-3">
                                        <div className="text-sm text-zinc-500"> #{c.       {c.createdAt?.replace("T"," ").slice(0,16)}</div>authorId} 
                                        <div className="mt-2 text-zinc-700">{c.content}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
