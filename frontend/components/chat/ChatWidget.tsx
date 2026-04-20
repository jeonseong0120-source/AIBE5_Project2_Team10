"use client";

import { useEffect, useRef, useState } from "react";
import ChatWindow from "./ChatWindow";
import {
    getChatMessages,
    getChatRooms,
    markChatAsRead,
} from "../../app/lib/chatApi";
import { ChatMessageResponse, ChatRoomResponse } from "../../types/chat";
import { getCurrentUserId } from "../../app/lib/auth";

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const currentUserId = getCurrentUserId();
    const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessageResponse[]>([]);

    const [loadingRooms, setLoadingRooms] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const fetchRooms = async () => {
        try {
            setLoadingRooms(true);
            const roomData = await getChatRooms();
            setRooms(roomData);

            if (roomData.length === 0) {
                setSelectedRoomId(null);
                setMessages([]);
                return;
            }

            const selectedStillExists =
                selectedRoomId !== null &&
                roomData.some((room) => room.roomId === selectedRoomId);

            if (!selectedStillExists) {
                setSelectedRoomId(roomData[0].roomId);
            }
        } catch (error) {
            console.error("채팅방 조회 실패", error);
        } finally {
            setLoadingRooms(false);
        }
    };

    const fetchMessages = async (roomId: number) => {
        const requestId = ++latestMessageReqId.current;
        try {
            setLoadingMessages(true);
            const messageData = await getChatMessages(roomId);
            if (requestId !== latestMessageReqId.current) return;
            setMessages(messageData);
            await markChatAsRead(roomId);
            setRooms((prev) =>
                prev.map((room) =>
                    room.roomId === roomId ? { ...room, unreadCount: 0 } : room
                )
            );
        } catch (error) {
            console.error("메시지 조회 실패", error);
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        fetchRooms();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !selectedRoomId) return;
        fetchMessages(selectedRoomId);
    }, [isOpen, selectedRoomId]);

    const handleOpenToggle = () => {
        setIsOpen((prev) => !prev);
    };

    const handleSelectRoom = (roomId: number) => {
        setSelectedRoomId(roomId);
    };

    const handleSend = () => {
        if (!input.trim()) return;
        setInput("");
    };

    return (
        <>
            <ChatWindow
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                onSelectRoom={handleSelectRoom}
                messages={messages}
                input={input}
                onChangeInput={setInput}
                onSend={handleSend}
                loadingRooms={loadingRooms}
                loadingMessages={loadingMessages}
                currentUserId={currentUserId}
            />

            <button
                type="button"
                onClick={handleOpenToggle}
                className="fixed bottom-6 right-6 z-[9999] flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-2xl text-white shadow-xl transition hover:scale-105 hover:bg-violet-700"
                aria-label="채팅 열기"
            >
                💬
            </button>
        </>
    );
}