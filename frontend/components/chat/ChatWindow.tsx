"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ChatInput from "./ChatInput";
import ChatMessageBubble from "./ChatMessageBubble";
import { ChatMessageResponse, ChatRoomResponse } from "../../types/chat";

interface ChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
    rooms: ChatRoomResponse[];
    selectedRoomId: number | null;
    onSelectRoom: (roomId: number) => void;
    messages: ChatMessageResponse[];
    input: string;
    onChangeInput: (value: string) => void;
    onSend: () => void;
    loadingRooms: boolean;
    loadingMessages: boolean;
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
                                   }: ChatWindowProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
                    <p className="text-xs text-gray-400">채팅방과 메시지를 불러옵니다</p>
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
                <div className="flex gap-2 overflow-x-auto">
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
                                className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                                    selectedRoomId === room.roomId
                                        ? "border-violet-600 bg-violet-600 text-white"
                                        : "border-gray-200 bg-white text-gray-700"
                                }`}
                            >
                                {room.otherNickname}
                                {room.unreadCount > 0 ? ` (${room.unreadCount})` : ""}
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
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        아직 메시지가 없습니다.
                    </div>
                ) : (
                    messages.map((msg) => (
                        <ChatMessageBubble
                            key={msg.id}
                            message={msg.message}
                            time={new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                            isMine={false}
                        />
                    ))
                )}
            </div>

            <ChatInput value={input} onChange={onChangeInput} onSend={onSend} />
        </div>,
        document.body
    );
}