"use client";

import api from "@/app/lib/axios";
import type { InboxNotification } from "@/components/notifications/NotificationProvider";
import { isAxiosError } from "axios";
import { MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type InboxApiResponse = {
    unreadCount: number;
    content: InboxNotification[];
};

type MeApi = {
    notifyCommunityComments?: boolean;
};

export function MypageNotificationsTab({ accentColor }: { accentColor: string }) {
    const router = useRouter();
    const [items, setItems] = useState<InboxNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [communityOn, setCommunityOn] = useState(true);
    const [prefsLoading, setPrefsLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);

    const loadPrefs = useCallback(async () => {
        setPrefsLoading(true);
        try {
            const { data } = await api.get<MeApi>("/v1/users/me");
            setCommunityOn(data.notifyCommunityComments !== false);
        } catch {
            setCommunityOn(true);
        } finally {
            setPrefsLoading(false);
        }
    }, []);

    const loadInbox = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get<InboxApiResponse>("/v1/notifications", {
                params: { page: 0, size: 50, unreadOnly: false },
            });
            setItems(data.content ?? []);
            setUnreadCount(data.unreadCount ?? 0);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const id = window.setTimeout(() => {
            void loadPrefs();
            void loadInbox();
        }, 0);
        return () => clearTimeout(id);
    }, [loadPrefs, loadInbox]);

    const toggleCommunity = async () => {
        const next = !communityOn;
        setCommunityOn(next);
        try {
            await api.patch("/v1/users/me/notification-preferences", {
                notifyCommunityComments: next,
            });
        } catch {
            setCommunityOn(!next);
            setToast("설정 저장에 실패했습니다.");
        }
    };

    const onDismiss = async (n: InboxNotification) => {
        if (n.read) {
            setItems((prev) => prev.filter((x) => x.notificationId !== n.notificationId));
            return;
        }
        try {
            await api.patch(`/v1/notifications/${n.notificationId}/read`);
            setUnreadCount((c) => Math.max(0, c - 1));
            setItems((prev) =>
                prev.map((x) => (x.notificationId === n.notificationId ? { ...x, read: true } : x)),
            );
        } catch (err) {
            let msg = "읽음 처리에 실패했습니다.";
            if (isAxiosError(err)) {
                const data = err.response?.data as { message?: string } | undefined;
                if (data?.message && typeof data.message === "string") {
                    msg = data.message;
                }
            }
            setToast(msg);
        }
    };

    const onRow = async (n: InboxNotification) => {
        if (!n.read) {
            try {
                await api.patch(`/v1/notifications/${n.notificationId}/read`);
                setUnreadCount((c) => Math.max(0, c - 1));
                setItems((prev) =>
                    prev.map((x) => (x.notificationId === n.notificationId ? { ...x, read: true } : x)),
                );
            } catch (err) {
                let msg = "읽음 처리에 실패했습니다.";
                if (isAxiosError(err)) {
                    const data = err.response?.data as { message?: string } | undefined;
                    if (data?.message && typeof data.message === "string") {
                        msg = data.message;
                    }
                }
                setToast(msg);
                return;
            }
        }
        if (n.url) {
            router.push(n.url);
        }
    };

    useEffect(() => {
        if (!toast) return;
        const t = window.setTimeout(() => setToast(null), 4000);
        return () => window.clearTimeout(t);
    }, [toast]);

    return (
        <div className="space-y-8">
            <div>
                <span
                    className="mb-3 block text-[10px] font-black uppercase tracking-[0.35em]"
                    style={{ color: accentColor }}
                >
                    Notifications
                </span>
                <h2 className="text-3xl font-black tracking-tight text-zinc-900">알림</h2>
                <p className="mt-2 text-sm text-zinc-500">
                    최근 알림을 확인하고, 커뮤니티 댓글 알림만 켜거나 끌 수 있습니다.
                    {unreadCount > 0 ? (
                        <span className="ml-2 font-semibold text-zinc-800">미읽음 {unreadCount}건</span>
                    ) : null}
                </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-6">
                <div className="flex items-start gap-4">
                    <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white"
                        style={{ color: accentColor }}
                    >
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-zinc-900">커뮤니티 댓글 알림</p>
                        <p className="mt-1 text-xs text-zinc-500">내 게시글에 댓글이 달릴 때 알림을 받습니다.</p>
                    </div>
                    <button
                        type="button"
                        disabled={prefsLoading}
                        onClick={() => void toggleCommunity()}
                        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                            communityOn ? "" : "bg-zinc-200"
                        }`}
                        style={communityOn ? { backgroundColor: accentColor } : undefined}
                        aria-pressed={communityOn}
                        aria-label="커뮤니티 댓글 알림"
                    >
                        <span
                            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                                communityOn ? "left-7" : "left-1"
                            }`}
                        />
                    </button>
                </div>
            </div>

            {toast ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800" role="alert">
                    {toast}
                </p>
            ) : null}

            <div className="rounded-3xl border border-zinc-100 bg-white/90">
                {loading ? (
                    <p className="px-6 py-12 text-center text-sm text-zinc-500">불러오는 중…</p>
                ) : items.length === 0 ? (
                    <p className="px-6 py-12 text-center text-sm text-zinc-500">알림이 없습니다.</p>
                ) : (
                    <ul className="divide-y divide-zinc-100">
                        {items.map((n) => (
                            <li key={n.notificationId}>
                                <div
                                    className={`flex items-start gap-2 px-5 py-4 text-left text-sm ${
                                        n.read ? "text-zinc-500" : "bg-orange-50/30 text-zinc-900"
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => void onRow(n)}
                                        className="flex flex-1 flex-col gap-0.5 text-left transition hover:opacity-85"
                                    >
                                        <span className="font-semibold">{n.title}</span>
                                        {n.message ? (
                                            <span className="line-clamp-2 text-xs text-zinc-600">{n.message}</span>
                                        ) : null}
                                        <span className="text-[10px] text-zinc-400">
                                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                                            {n.read ? " · 읽음" : ""}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void onDismiss(n)}
                                        className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                                        aria-label="알림 닫기"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
