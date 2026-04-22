"use client";

import api from "@/app/lib/axios";
import { DEVNEAR_AUTH_CHANGED } from "@/app/lib/authEvents";
import { resolveSockJsUrl } from "@/app/lib/wsUrl";
import { Client, IMessage } from "@stomp/stompjs";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type ReactNode,
    type RefObject,
    type SetStateAction,
} from "react";
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

export type NotificationsContextValue = {
    showBell: boolean;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    unreadCount: number;
    items: InboxNotification[];
    loading: boolean;
    panelRef: RefObject<HTMLDivElement | null>;
    onRowClick: (n: InboxNotification) => Promise<void>;
    onDismissClick: (n: InboxNotification) => Promise<void>;
    setToast: Dispatch<SetStateAction<string | null>>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications(): NotificationsContextValue {
    const ctx = useContext(NotificationsContext);
    if (!ctx) {
        throw new Error("useNotifications must be used within NotificationsProvider");
    }
    return ctx;
}

/** 알림 상태·STOMP·토스트(전역). UI 벨은 `NotificationBell`을 네비 등에 배치합니다. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [me, setMe] = useState<MeResponse | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const tokenRef = useRef<string | null>(null);
    const [items, setItems] = useState<InboxNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const stompRef = useRef<Client | null>(null);
    const wsSeenIds = useRef<Set<number>>(new Set());

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
                params: { page: 0, size: 30, unreadOnly: true },
            });
            const list = data.content ?? [];
            wsSeenIds.current = new Set(list.map((n) => n.notificationId));
            setItems(list);
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
            wsSeenIds.current.clear();
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
                    if (wsSeenIds.current.has(row.notificationId)) {
                        return;
                    }
                    wsSeenIds.current.add(row.notificationId);
                    setItems((prev) => [row, ...prev]);
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

    const onRowClick = useCallback(
        async (n: InboxNotification) => {
            if (!n.read) {
                try {
                    await api.patch(`/v1/notifications/${n.notificationId}/read`);
                    setUnreadCount((c) => Math.max(0, c - 1));
                    setItems((prev) => prev.filter((x) => x.notificationId !== n.notificationId));
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
        },
        [router],
    );

    const onDismissClick = useCallback(async (n: InboxNotification) => {
        if (n.read) {
            setItems((prev) => prev.filter((x) => x.notificationId !== n.notificationId));
            return;
        }
        try {
            await api.patch(`/v1/notifications/${n.notificationId}/read`);
            setUnreadCount((c) => Math.max(0, c - 1));
            setItems((prev) => prev.filter((x) => x.notificationId !== n.notificationId));
        } catch (err) {
            let msg = "읽음 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.";
            if (isAxiosError(err)) {
                const data = err.response?.data as { message?: string } | undefined;
                if (data?.message && typeof data.message === "string") {
                    msg = data.message;
                }
            }
            setToast(msg);
        }
    }, []);

    const showBell = Boolean(me && me.role !== "GUEST");

    const value = useMemo<NotificationsContextValue>(
        () => ({
            showBell,
            open,
            setOpen,
            unreadCount,
            items,
            loading,
            panelRef,
            onRowClick,
            onDismissClick,
            setToast,
        }),
        [showBell, open, unreadCount, items, loading, onRowClick, onDismissClick, setToast],
    );

    return (
        <NotificationsContext.Provider value={value}>
            {toast ? (
                <div
                    role="alert"
                    className="pointer-events-none fixed bottom-6 left-1/2 z-[10000] max-w-[min(100vw-2rem,24rem)] -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-900 shadow-lg"
                >
                    {toast}
                </div>
            ) : null}
            {children}
        </NotificationsContext.Provider>
    );
}
