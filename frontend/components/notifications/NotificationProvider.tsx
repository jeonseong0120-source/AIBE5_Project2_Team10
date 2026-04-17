"use client";

import api from "@/app/lib/axios";
import { DEVNEAR_AUTH_CHANGED } from "@/app/lib/authEvents";
import { resolveSockJsUrl } from "@/app/lib/wsUrl";
import { Client, IMessage } from "@stomp/stompjs";
import { isAxiosError } from "axios";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";

export type InboxNotification = {
    notificationId: number;
    type: string;
    title: string;
    message: string;
    content: string;
    read: boolean;
    url: string | null;
    createdAt: string;
};

type MeResponse = {
    id: number;
    role: string;
};

type InboxApiResponse = {
    unreadCount: number;
    content: InboxNotification[];
};

function parseWsBody(raw: string): InboxNotification | null {
    try {
        const p = JSON.parse(raw) as Record<string, unknown>;
        const id = p.notificationId;
        if (id == null) {
            return null;
        }
        const title = String(p.title ?? "");
        const message = String(p.message ?? "");
        const urlRaw = p.url;
        return {
            notificationId: Number(id),
            type: String(p.type ?? ""),
            title,
            message,
            content: title + (message ? `\n${message}` : ""),
            read: false,
            url: urlRaw != null && String(urlRaw) !== "" ? String(urlRaw) : null,
            createdAt:
                typeof p.createdAt === "string"
                    ? p.createdAt
                    : p.createdAt != null
                      ? String(p.createdAt)
                      : "",
        };
    } catch {
        return null;
    }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [me, setMe] = useState<MeResponse | null>(null);
    /** STOMP `connectHeaders`가 클로저에 고정되지 않도록, 토큰 변경 시 effect가 다시 돌게 합니다. */
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const tokenRef = useRef<string | null>(null);
    const [items, setItems] = useState<InboxNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const stompRef = useRef<Client | null>(null);

    const disconnectStomp = useCallback(() => {
        const c = stompRef.current;
        if (c) {
            void c.deactivate();
            stompRef.current = null;
        }
    }, []);

    const syncTokenFromStorage = useCallback(() => {
        const t = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        tokenRef.current = t;
        setAccessToken(t);
    }, []);

    const loadInbox = useCallback(async () => {
        const token = tokenRef.current ?? localStorage.getItem("accessToken");
        if (!token) {
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get<InboxApiResponse>("/v1/notifications", {
                params: { page: 0, size: 30 },
            });
            setItems(data.content ?? []);
            setUnreadCount(data.unreadCount ?? 0);
        } catch {
            /* 401 등은 axios 인터셉터에서 처리 */
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMe = useCallback(() => {
        syncTokenFromStorage();
        const token = tokenRef.current;
        if (!token) {
            disconnectStomp();
            setMe(null);
            setItems([]);
            setUnreadCount(0);
            return;
        }
        api.get<MeResponse>("/v1/users/me")
            .then((res) => {
                setMe(res.data);
            })
            .catch(() => {
                setMe(null);
            });
    }, [disconnectStomp, syncTokenFromStorage]);

    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (!toast) {
            return;
        }
        const t = window.setTimeout(() => setToast(null), 4500);
        return () => window.clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        loadMe();
        const onAuthChanged = () => {
            disconnectStomp();
            loadMe();
        };
        const onStorage = (e: StorageEvent) => {
            if (e.key === "accessToken" || e.key === null) {
                disconnectStomp();
                loadMe();
            }
        };
        window.addEventListener(DEVNEAR_AUTH_CHANGED, onAuthChanged);
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener(DEVNEAR_AUTH_CHANGED, onAuthChanged);
            window.removeEventListener("storage", onStorage);
        };
    }, [disconnectStomp, loadMe]);

    useEffect(() => {
        if (!me || me.role === "GUEST") {
            return;
        }
        void loadInbox();
    }, [me, loadInbox]);

    useEffect(() => {
        if (!me || me.role === "GUEST") {
            return;
        }
        const token = accessToken ?? tokenRef.current;
        if (!token) {
            return;
        }

        const userId = me.id;
        const client = new Client({
            webSocketFactory: () => new SockJS(resolveSockJsUrl()) as unknown as WebSocket,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe(`/sub/notifications/users/${userId}`, (message: IMessage) => {
                    const row = parseWsBody(message.body);
                    if (!row) {
                        return;
                    }
                    setItems((prev) => {
                        if (prev.some((x) => x.notificationId === row.notificationId)) {
                            return prev;
                        }
                        return [row, ...prev];
                    });
                    setUnreadCount((c) => c + 1);
                });
            },
            onStompError: (frame) => {
                console.warn("알림 WebSocket 오류:", frame.headers["message"]);
            },
        });
        stompRef.current = client;
        client.activate();
        return () => {
            void client.deactivate();
            if (stompRef.current === client) {
                stompRef.current = null;
            }
        };
    }, [me, accessToken]);

    useEffect(() => {
        if (!open) {
            return;
        }
        void loadInbox();
    }, [open, loadInbox]);

    useEffect(() => {
        if (!open) {
            return;
        }
        const onDown = (e: MouseEvent) => {
            const el = panelRef.current;
            if (el && !el.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    const onRowClick = async (n: InboxNotification) => {
        if (!n.read) {
            try {
                await api.patch(`/v1/notifications/${n.notificationId}/read`);
                setUnreadCount((c) => Math.max(0, c - 1));
                setItems((prev) =>
                    prev.map((x) =>
                        x.notificationId === n.notificationId ? { ...x, read: true } : x,
                    ),
                );
            } catch (err) {
                let msg = "읽음 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.";
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
        setOpen(false);
        if (n.url) {
            router.push(n.url);
        }
    };

    const showBell = me && me.role !== "GUEST";

    return (
        <>
            {toast ? (
                <div
                    role="alert"
                    className="pointer-events-none fixed bottom-6 left-1/2 z-[10000] max-w-[min(100vw-2rem,24rem)] -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-900 shadow-lg"
                >
                    {toast}
                </div>
            ) : null}
            {showBell ? (
                <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col items-end gap-2">
                    <div ref={panelRef} className="pointer-events-auto flex flex-col items-end gap-2">
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                            aria-label="알림"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 ? (
                                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF7D00] px-1 text-[10px] font-bold text-white">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            ) : null}
                        </button>
                        {open ? (
                            <div className="max-h-[min(70vh,28rem)] w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
                                <div className="border-b border-zinc-100 px-4 py-3">
                                    <p className="text-sm font-semibold text-zinc-900">알림</p>
                                    <p className="text-xs text-zinc-500">
                                        항목을 누르면 읽음 처리되고 창이 닫힙니다.
                                    </p>
                                </div>
                                <div className="max-h-[min(60vh,24rem)] overflow-y-auto">
                                    {loading ? (
                                        <p className="px-4 py-6 text-center text-sm text-zinc-500">불러오는 중…</p>
                                    ) : items.length === 0 ? (
                                        <p className="px-4 py-6 text-center text-sm text-zinc-500">
                                            알림이 없습니다.
                                        </p>
                                    ) : (
                                        <ul className="divide-y divide-zinc-100">
                                            {items.map((n) => (
                                                <li key={n.notificationId}>
                                                    <button
                                                        type="button"
                                                        onClick={() => void onRowClick(n)}
                                                        className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm transition hover:bg-zinc-50 ${
                                                            n.read ? "text-zinc-500" : "bg-orange-50/40 text-zinc-900"
                                                        }`}
                                                    >
                                                        <span className="font-medium">{n.title}</span>
                                                        {n.message ? (
                                                            <span className="line-clamp-2 text-xs text-zinc-600">
                                                                {n.message}
                                                            </span>
                                                        ) : null}
                                                        <span className="text-[10px] text-zinc-400">
                                                            {n.createdAt
                                                                ? new Date(n.createdAt).toLocaleString()
                                                                : ""}
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
            {children}
        </>
    );
}
