"use client";

import { useEffect, useRef, useState } from "react";
import type { StompSubscription } from "@stomp/stompjs";
import ChatWindow from "./ChatWindow";
import {
    getChatMessages,
    getChatRooms,
    markChatAsRead,
    sendChatMessage,
} from "../../app/lib/chatApi";
import {
    connectChatSocket,
    disconnectChatSocket,
    subscribeChatRoom,
} from "../../app/lib/chatSocket";
import { ChatMessageResponse, ChatRoomResponse } from "../../types/chat";

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");

    const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessageResponse[]>([]);

    const [loadingRooms, setLoadingRooms] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const latestMessageReqId = useRef(0);
    const subscriptionRef = useRef<StompSubscription | null>(null);

    // 필요하면 실제 current user id를 연결
    const currentUserId: number | null = null;

    const fetchRooms = async () => {
        try {
            setLoadingRooms(true);
            const roomData = await getChatRooms();
            setRooms(roomData);

            const roomData = await getChatRooms();
            setRooms(roomData);
            const nextSelectedRoomId =
                selectedRoomId !== null &&
                roomData.some((room) => room.roomId === selectedRoomId)
                    ? selectedRoomId
                    : roomData[0]?.roomId ?? null;

            setSelectedRoomId(nextSelectedRoomId);
            if (nextSelectedRoomId === null) {
                setMessages([]);
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

    useEffect(() => {
        if (!isOpen) return;

        connectChatSocket();

        return () => {
            subscriptionRef.current?.unsubscribe();
            subscriptionRef.current = null;
            disconnectChatSocket();
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !selectedRoomId) return;

        const subscribe = () => {
            subscriptionRef.current?.unsubscribe();

            subscriptionRef.current = subscribeChatRoom(selectedRoomId, (frame) => {
                try {
                    const newMessage: ChatMessageResponse = JSON.parse(frame.body);

                    setMessages((prev) => {
                        const exists = prev.some((msg) => msg.id === newMessage.id);
                        if (exists) return prev;
                        return [...prev, newMessage];
                    });

                    setRooms((prev) =>
                        prev.map((room) =>
                            room.roomId === selectedRoomId
                                ? {
                                    ...room,
                                    lastMessage: newMessage.message,
                                    lastMessageTime: newMessage.createdAt,
                                    unreadCount: 0,
                                }
                                : room
                        )
                    );
                } catch (error) {
                    console.error("실시간 메시지 처리 실패", error);
                }
            });
        };

        const timer = setTimeout(subscribe, 300);

        return () => {
            clearTimeout(timer);
            subscriptionRef.current?.unsubscribe();
            subscriptionRef.current = null;
        };
    }, [isOpen, selectedRoomId]);

    const handleOpenToggle = () => {
        setIsOpen((prev) => !prev);
    };

    const handleSelectRoom = (roomId: number) => {
        setSelectedRoomId(roomId);
    };

    const handleSend = async () => {
        const trimmed = input.trim();

        if (!trimmed || !selectedRoomId || sending) return;

        try {
            setSending(true);

            await sendChatMessage({
                roomId: selectedRoomId,
                message: trimmed,
            });

            setInput("");
            await fetchMessages(selectedRoomId);
            await fetchRooms();
        } catch (error) {
            console.error("메시지 전송 실패", error);
        } finally {
            setSending(false);
        }
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
                sending={sending}
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