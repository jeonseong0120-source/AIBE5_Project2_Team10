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
import { getCurrentUserId } from "../../app/lib/auth";
import { useChatStore } from "../../app/store/chatStore";
import { ChatMessageResponse, ChatRoomResponse } from "../../types/chat";

export default function ChatWidget() {
    const [input, setInput] = useState("");
    const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
    const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [loadingRooms, setLoadingRooms] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const { isOpen, selectedRoomId, openChat, closeChat, setRoom } = useChatStore();

    const selectedRoomIdRef = useRef<number | null>(null);
    const latestMessageReqId = useRef(0);
    const subscriptionRef = useRef<StompSubscription | null>(null);

    useEffect(() => {
        setCurrentUserId(getCurrentUserId());
    }, []);

    useEffect(() => {
        selectedRoomIdRef.current = selectedRoomId;
    }, [selectedRoomId]);

    const fetchRooms = async () => {
        try {
            setLoadingRooms(true);

            const roomData = await getChatRooms();
            setRooms(roomData);

            const currentSelectedRoomId = selectedRoomIdRef.current;

            const nextSelectedRoomId =
                currentSelectedRoomId !== null &&
                roomData.some((room) => room.roomId === currentSelectedRoomId)
                    ? currentSelectedRoomId
                    : roomData[0]?.roomId ?? null;

            setRoom(nextSelectedRoomId);

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
                                    lastMessage:
                                        newMessage.content ??
                                        newMessage.message ??
                                        "",
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
        if (isOpen) {
            closeChat();
        } else {
            openChat();
        }
    };

    const handleSelectRoom = (roomId: number) => {
        setRoom(roomId);
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
                onClose={closeChat}
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