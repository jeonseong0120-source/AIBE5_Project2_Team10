"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ChatInput from "./ChatInput";
import ChatMessageBubble from "./ChatMessageBubble";
import type { ChatMessageResponse, ChatRoomResponse } from "../../types/chat";
import { formatChatTime } from "../../app/lib/chatTime";

interface ChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
    rooms: ChatRoomResponse[];
    selectedRoomId: number | null;
    onSelectRoom: (roomId: number) => void | Promise<void>;
    messages: ChatMessageResponse[];
    input: string;
    onChangeInput: (value: string) => void;
    onSend: () => void;
    loadingRooms: boolean;
    loadingMessages: boolean;
    sending: boolean;
    currentUserId?: number | null;
}

export default function ChatWindow({
                                       isOpen,
                                       onClose,
                                       rooms,
                                       selectedRoomId,
                                       onSelectRoom,
                                       messages,
                                       input,
                                       onChangeInput,
                                       onSend,
                                       loadingRooms,
                                       loadingMessages,
                                       sending,
                                       currentUserId = null,
                                   }: ChatWindowProps) {
    const [mounted, setMounted] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            style={{
                position: "fixed",
                right: "24px",
                bottom: "88px",
                width: "380px",
                height: "540px",
                zIndex: 9999,
            }}
            className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl"
        >
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
                <div>
                    <p className="text-sm font-semibold text-gray-900">1:1 채팅</p>
                    <p className="text-xs text-gray-400">메시지를 주고받을 수 있습니다</p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="text-xl text-gray-400 hover:text-gray-600"
                >
                    ×
                </button>
            </div>

            <div className="border-b border-gray-100 bg-white px-3 py-2">
                <div className="flex max-h-[96px] flex-col gap-2 overflow-y-auto">
                    {loadingRooms ? (
                        <div className="px-2 py-1 text-xs text-gray-400">
                            채팅방 불러오는 중...
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="px-2 py-1 text-xs text-gray-400">
                            채팅방이 없습니다.
                        </div>
                    ) : (
                        rooms.map((room) => (
                            <button
                                key={room.roomId}
                                type="button"
                                onClick={() => onSelectRoom(room.roomId)}
                                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                                    selectedRoomId === room.roomId
                                        ? "border-violet-600 bg-violet-50"
                                        : "border-gray-200 bg-white hover:bg-gray-50"
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium text-gray-900">
                                        {room.otherNickname}
                                    </div>
                                    <div className="truncate text-xs text-gray-400">
                                        {room.lastMessage || "대화를 시작해보세요"}
                                    </div>
                                </div>

                                {room.unreadCount > 0 && (
                                    <span className="ml-3 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] text-white">
                                        {room.unreadCount}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
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
                    messages.map((msg) => (
                        <ChatMessageBubble
                            key={msg.id}
                            message={msg.message}
                            time={formatChatTime(msg.createdAt)}
                            isMine={currentUserId !== null && msg.senderId === currentUserId}
                            senderNickname={msg.senderNickname}
                        />
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            <ChatInput
                value={input}
                onChange={onChangeInput}
                onSend={onSend}
                disabled={sending || !selectedRoomId}
                sending={sending}
                canSend={!!selectedRoomId}
            />
        </div>,
        document.body
    );
}