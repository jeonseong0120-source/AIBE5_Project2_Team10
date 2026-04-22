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
    ensureChatSocketConnected,
} from "../../app/lib/chatSocket";
import { getCurrentUserId } from "../../app/lib/auth";
import { useChatStore } from "../../app/store/chatStore";
import type { ChatMessageResponse, ChatRoomListResponse } from "../../types/chat";

function sortRoomsByLatest(roomList: ChatRoomListResponse[]) {
    return [...roomList].sort((a, b) => {
        const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return bTime - aTime;
    });
}

export default function ChatWidget() {
    const [input, setInput] = useState("");
    const [rooms, setRooms] = useState<ChatRoomListResponse[]>([]);
    const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [loadingRooms, setLoadingRooms] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const { isOpen, selectedRoomId, openChat, closeChat, setRoom } = useChatStore();

    const selectedRoomIdRef = useRef<number | null>(null);
    const currentUserIdRef = useRef<number | null>(null);
    const latestMessageReqId = useRef(0);
    const subscriptionRef = useRef<StompSubscription | null>(null);

    useEffect(() => {
        const userId = getCurrentUserId();
        setCurrentUserId(userId);
        currentUserIdRef.current = userId;
    }, []);

    useEffect(() => {
        selectedRoomIdRef.current = selectedRoomId;
    }, [selectedRoomId]);

    const fetchRooms = async () => {
        try {
            setLoadingRooms(true);

            const roomData = await getChatRooms();
            const sortedRooms = sortRoomsByLatest(roomData);
            setRooms(sortedRooms);

            const currentSelectedRoomId = selectedRoomIdRef.current;

            const nextSelectedRoomId =
                currentSelectedRoomId !== null &&
                sortedRooms.some((room) => room.roomId === currentSelectedRoomId)
                    ? currentSelectedRoomId
                    : sortedRooms[0]?.roomId ?? null;

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

        let cancelled = false;

        const subscribe = async () => {
            try {
                await ensureChatSocketConnected();

                if (cancelled) return;

                subscriptionRef.current?.unsubscribe();

                const sub = subscribeChatRoom(selectedRoomId, async (frame) => {
                    try {
                        const newMessage: ChatMessageResponse = JSON.parse(frame.body);
                        const isCurrentRoom = selectedRoomIdRef.current === newMessage.roomId;
                        const isMyMessage =
                            currentUserIdRef.current !== null &&
                            newMessage.senderId === currentUserIdRef.current;

                        if (isCurrentRoom) {
                            setMessages((prev) => {
                                const exists = prev.some(
                                    (msg) => msg.messageId === newMessage.messageId
                                );
                                if (exists) return prev;
                                return [...prev, newMessage];
                            });

                            if (!isMyMessage) {
                                await markChatAsRead(newMessage.roomId);
                            }
                        }

                        setRooms((prev) => {
                            const updated = prev.map((room) => {
                                if (room.roomId !== newMessage.roomId) return room;

                                return {
                                    ...room,
                                    lastMessage: newMessage.content,
                                    lastMessageTime: newMessage.createdAt,
                                    unreadCount: isCurrentRoom ? 0 : room.unreadCount + 1,
                                };
                            });

                            return sortRoomsByLatest(updated);
                        });
                    } catch (error) {
                        console.error("실시간 메시지 처리 실패", error);
                    }
                });

                subscriptionRef.current = sub;
            } catch (error) {
                console.error("채팅방 구독 실패", error);
            }
        };

        subscribe();

        return () => {
            cancelled = true;
            subscriptionRef.current?.unsubscribe();
            subscriptionRef.current = null;
        };
    }, [isOpen, selectedRoomId]);

    const handleOpenToggle = () => {
        if (isOpen) {
            setInput("");
            closeChat();
        } else {
            openChat();
        }
    };

    const handleSelectRoom = (roomId: number) => {
        setRoom(roomId);
        setInput("");
        setMessages([]);

        setRooms((prev) =>
            prev.map((room) =>
                room.roomId === roomId ? { ...room, unreadCount: 0 } : room
            )
        );
    };

    const handleSend = async () => {
        const trimmed = input.trim();

        if (!trimmed || !selectedRoomId || sending) return;

        if (trimmed.length > 500) {
            alert("메시지는 500자 이하로 입력해주세요.");
            return;
        }

        try {
            setSending(true);

            await sendChatMessage({
                roomId: selectedRoomId,
                message: trimmed,
            });

            setRooms((prev) =>
                sortRoomsByLatest(
                    prev.map((room) =>
                        room.roomId === selectedRoomId
                            ? {
                                ...room,
                                lastMessage: trimmed,
                                lastMessageTime: new Date().toISOString(),
                            }
                            : room
                    )
                )
            );

            setInput("");
        } catch (error) {
            console.error("메시지 전송 실패", error);
            alert("메시지 전송에 실패했습니다. 다시 시도해주세요.");
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