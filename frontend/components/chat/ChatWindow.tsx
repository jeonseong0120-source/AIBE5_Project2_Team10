"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ChatInput from "./ChatInput";
import ChatMessageBubble from "./ChatMessageBubble";
import type { ChatMessageResponse, ChatRoomListResponse } from "../../types/chat";
import { formatChatTime } from "../../app/lib/chatTime";

interface ChatWindowProps {
    isOpen: boolean;
    view: "list" | "room";
    onClose: () => void;
    onBack: () => void;
    onLeaveRoom: () => void | Promise<void>;
    rooms: ChatRoomListResponse[];
    selectedRoom: ChatRoomListResponse | null;
    selectedRoomId: number | null;
    onSelectRoom: (roomId: number) => void | Promise<void>;
    messages: ChatMessageResponse[];
    input: string;
    onChangeInput: (value: string) => void;
    onSend: () => void;
    loadingRooms: boolean;
    loadingMessages: boolean;
    sending: boolean;
    leaving?: boolean;
    currentUserId?: number | null;
}

function formatRoomPreviewTime(value: string | null) {
    if (!value) return "";

    const date = new Date(value);
    const now = new Date();

    const sameDay =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();

    if (sameDay) {
        return new Intl.DateTimeFormat("ko-KR", {
            hour: "numeric",
            minute: "2-digit",
        }).format(date);
    }

    return new Intl.DateTimeFormat("ko-KR", {
        month: "numeric",
        day: "numeric",
    }).format(date);
}

function formatDateDivider(value: string) {
    const date = new Date(value);
    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
    }).format(date);
}

function isSameDay(a: string, b: string) {
    const da = new Date(a);
    const db = new Date(b);

    return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate()
    );
}

function isSameMinute(a: string, b: string) {
    const da = new Date(a);
    const db = new Date(b);

    return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate() &&
        da.getHours() === db.getHours() &&
        da.getMinutes() === db.getMinutes()
    );
}

export default function ChatWindow({
                                       isOpen,
                                       view,
                                       onClose,
                                       onBack,
                                       onLeaveRoom,
                                       rooms,
                                       selectedRoom,
                                       selectedRoomId,
                                       onSelectRoom,
                                       messages,
                                       input,
                                       onChangeInput,
                                       onSend,
                                       loadingRooms,
                                       loadingMessages,
                                       sending,
                                       leaving = false,
                                       currentUserId = null,
                                   }: ChatWindowProps) {
    const [mounted, setMounted] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen || view !== "room") return;
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen, view]);

    const renderedMessages = useMemo(() => {
        return messages.map((msg, index) => {
            const prev = messages[index - 1];

            const showDateDivider = !prev || !isSameDay(prev.createdAt, msg.createdAt);
            const showTime = !prev || !isSameMinute(prev.createdAt, msg.createdAt);

            return {
                ...msg,
                showDateDivider,
                showTime,
            };
        });
    }, [messages]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            style={{
                position: "fixed",
                right: "16px",
                bottom: "80px",
                width: "calc(100vw - 32px)",
                maxWidth: "380px",
                height: "70vh",
                maxHeight: "600px",
                zIndex: 9999,
            }}
            className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl"
        >
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
                {view === "room" ? (
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="text-lg text-gray-500 transition hover:text-gray-700"
                            aria-label="목록으로 돌아가기"
                        >
                            ←
                        </button>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                                {selectedRoom?.opponentNickname || "채팅"}
                            </p>
                            <p className="truncate text-xs text-gray-400">
                                {selectedRoom?.projectName || "대화방"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-semibold text-gray-900">1:1 채팅</p>
                        <p className="text-xs text-gray-400">대화할 상대를 선택하세요</p>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    {view === "room" && (
                        <button
                            type="button"
                            onClick={onLeaveRoom}
                            disabled={leaving || !selectedRoomId}
                            className="text-xs font-medium text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-gray-300"
                        >
                            {leaving ? "나가는 중" : "나가기"}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xl text-gray-400 hover:text-gray-600"
                        aria-label="채팅 닫기"
                    >
                        ×
                    </button>
                </div>
            </div>

            {view === "list" ? (
                <div className="flex-1 overflow-y-auto bg-gray-50 px-3 py-3">
                    {loadingRooms ? (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                            채팅방 불러오는 중...
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center text-sm text-gray-400">
                            <p>채팅방이 없습니다.</p>
                            <p className="mt-1 text-xs">문의하기 버튼으로 대화를 시작해보세요.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {rooms.map((room) => (
                                <button
                                    key={room.roomId}
                                    type="button"
                                    onClick={() => onSelectRoom(room.roomId)}
                                    className={`flex w-full items-start justify-between rounded-2xl border px-4 py-3 text-left transition ${
                                        selectedRoomId === room.roomId
                                            ? "border-violet-600 bg-violet-50"
                                            : "border-gray-200 bg-white hover:bg-gray-50"
                                    }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-semibold text-gray-900">
                                                {room.opponentNickname}
                                            </p>

                                            {room.unreadCount > 0 && (
                                                <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-medium text-white">
                                                    {room.unreadCount}
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-1 truncate text-[11px] text-gray-500">
                                            {room.projectName}
                                        </p>

                                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                            {room.lastMessageMine && !room.lastMessageSystem && (
                                                <span className={room.lastMessageRead ? "text-violet-600" : "text-gray-400"}>
                                                    {room.lastMessageRead ? "읽음" : "전송됨"}
                                                </span>
                                            )}

                                            {room.lastMessageSystem && (
                                                <span className="text-gray-500">안내</span>
                                            )}

                                            <p className="truncate">
                                                {room.lastMessage || "대화를 시작해보세요"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="ml-3 shrink-0 pt-0.5 text-[11px] text-gray-400">
                                        {formatRoomPreviewTime(room.lastMessageAt)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
                        {loadingMessages ? (
                            <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                메시지를 불러오는 중...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-gray-400">
                                <p>아직 메시지가 없습니다.</p>
                                <p className="mt-1 text-xs">첫 메시지를 보내보세요.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {renderedMessages.map((msg) => (
                                    <div key={msg.messageId} className="space-y-2">
                                        {msg.showDateDivider && (
                                            <div className="flex justify-center py-1">
                                                <div className="rounded-full bg-gray-200 px-3 py-1 text-[11px] text-gray-600">
                                                    {formatDateDivider(msg.createdAt)}
                                                </div>
                                            </div>
                                        )}

                                        <ChatMessageBubble
                                            message={msg.content}
                                            time={msg.showTime ? formatChatTime(msg.createdAt) : ""}
                                            isMine={
                                                currentUserId !== null &&
                                                msg.senderId === currentUserId
                                            }
                                            isRead={msg.read}
                                            senderNickname={msg.senderNickname}
                                            systemMessage={msg.systemMessage}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <ChatInput
                        value={input}
                        onChange={onChangeInput}
                        onSend={onSend}
                        disabled={sending || !selectedRoomId || leaving}
                        sending={sending}
                        canSend={!!selectedRoomId && !leaving}
                    />
                </>
            )}
        </div>,
        document.body
    );
}