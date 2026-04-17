"use client";

import { Bell } from "lucide-react";
import { useNotifications } from "./notificationContext";

/** 상단 네비 등에 인라인으로 배치 (MY_PAGE / MY_PROFILE 옆). */
export function NotificationBell() {
    const { showBell, open, setOpen, unreadCount, items, loading, panelRef, onRowClick } = useNotifications();

    if (!showBell) {
        return null;
    }

    return (
        <div ref={panelRef} className="relative z-20 flex items-center">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                aria-label="알림"
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF7D00] px-0.5 text-[9px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                ) : null}
            </button>
            {open ? (
                <div className="absolute right-0 top-full mt-2 max-h-[min(70vh,28rem)] w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
                    <div className="border-b border-zinc-100 px-4 py-3">
                        <p className="text-sm font-semibold text-zinc-900">알림</p>
                        <p className="text-xs text-zinc-500">항목을 누르면 읽음 처리되고 창이 닫힙니다.</p>
                    </div>
                    <div className="max-h-[min(60vh,24rem)] overflow-y-auto">
                        {loading ? (
                            <p className="px-4 py-6 text-center text-sm text-zinc-500">불러오는 중…</p>
                        ) : items.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-zinc-500">알림이 없습니다.</p>
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
                                                <span className="line-clamp-2 text-xs text-zinc-600">{n.message}</span>
                                            ) : null}
                                            <span className="text-[10px] text-zinc-400">
                                                {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
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
    );
}
