"use client";

import { useEffect, useRef, useState } from "react";
import type { StompSubscription, IMessage } from "@stomp/stompjs";
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
    subscribeChatReadReceipt,
    ensureChatSocketConnected,
} from "../../app/lib/chatSocket";
import { getCurrentUserId } from "../../app/lib/auth";
import { useChatStore } from "../../app/store/chatStore";
import type {
    ChatMessageResponse,
    ChatReadReceiptResponse,
    ChatRoomListResponse,
} from "../../types/chat";

type ChatView = "list" | "room";

function sortRoomsByLatest(roomList: ChatRoomListResponse[]) {
    return [...roomList].sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;

        if (bTime === aTime) {
            return b.roomId - a.roomId;
        }

        return bTime - aTime;
    });
}

export default function ChatWidget() {
    const [view, setView] = useState<ChatView>("list");
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

    const messageSubscriptionRef = useRef<StompSubscription | null>(null);
    const readSubscriptionRef = useRef<StompSubscription | null>(null);

    const cleanupSubscription = (
        ref: React.MutableRefObject<StompSubscription | null>
    ) => {
        const current = ref.current;
        if (!current) return;

        try {
            current.unsubscribe();
        } catch (error) {
            console.error("구독 해제 실패", error);
        }

        ref.current = null;
    };

    useEffect(() => {
        const userId = getCurrentUserId();
        setCurrentUserId(userId);
        currentUserIdRef.current = userId;
    }, []);

    useEffect(() => {
        selectedRoomIdRef.current = selectedRoomId;
    }, [selectedRoomId]);

    useEffect(() => {
        if (!isOpen) return;

        if (selectedRoomId) {
            setView("room");
        } else {
            setView("list");
        }
    }, [isOpen, selectedRoomId]);

    const fetchRooms = async () => {
        try {
            setLoadingRooms(true);

            const roomData = await getChatRooms();

            const filtered = roomData.filter(
                (room) => room.lastMessage !== null || room.unreadCount > 0
            );

            const sortedRooms = sortRoomsByLatest(filtered);
            setRooms(sortedRooms);

            const currentSelectedRoomId = selectedRoomIdRef.current;
            const existsSelected =
                currentSelectedRoomId !== null &&
                sortedRooms.some((room) => room.roomId === currentSelectedRoomId);

            if (!existsSelected && currentSelectedRoomId !== null) {
                setRoom(null);
                setMessages([]);
                setView("list");
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
        if (!isOpen || !selectedRoomId || view !== "room") return;
        fetchMessages(selectedRoomId);
    }, [isOpen, selectedRoomId, view]);

    useEffect(() => {
        if (!isOpen) return;

        connectChatSocket();

        return () => {
            cleanupSubscription(messageSubscriptionRef);
            cleanupSubscription(readSubscriptionRef);
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

                cleanupSubscription(messageSubscriptionRef);
                cleanupSubscription(readSubscriptionRef);

                const messageSub = await subscribeChatRoom(
                    selectedRoomId,
                    async (frame: IMessage) => {
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
                                const existing = prev.find(
                                    (room) => room.roomId === newMessage.roomId
                                );

                                if (!existing) {
                                    return prev;
                                }

                                const updated = prev.map((room) => {
                                    if (room.roomId !== newMessage.roomId) return room;

                                    return {
                                        ...room,
                                        lastMessage: newMessage.content,
                                        lastMessageAt: newMessage.createdAt,
                                        lastMessageMine: isMyMessage,
                                        lastMessageRead: newMessage.read,
                                        lastMessageSystem: newMessage.systemMessage,
                                        unreadCount:
                                            isCurrentRoom || isMyMessage
                                                ? 0
                                                : room.unreadCount + 1,
                                    };
                                });

                                return sortRoomsByLatest(updated);
                            });
                        } catch (error) {
                            console.error("실시간 메시지 처리 실패", error);
                        }
                    }
                );

                const readSub = await subscribeChatReadReceipt(
                    selectedRoomId,
                    (frame: IMessage) => {
                        try {
                            const receipt: ChatReadReceiptResponse = JSON.parse(frame.body);

                            if (!receipt.read) return;
                            if (receipt.roomId !== selectedRoomIdRef.current) return;
                            // Only process when opponent reads; ignore own read events.
                                    if (
                                        currentUserIdRef.current !== null &&
                                        receipt.readerId === currentUserIdRef.current
                                    ) {
                                        return;
                                    }
                            setMessages((prev) =>
                                prev.map((msg) => {
                                    const isMyMessage =
                                        currentUserIdRef.current !== null &&
                                        msg.senderId === currentUserIdRef.current;

                                    return isMyMessage ? { ...msg, read: true } : msg;
                                })
                            );

                            setRooms((prev) =>
                                prev.map((room) =>
                                    room.roomId === receipt.roomId && room.lastMessageMine
                                        ? { ...room, lastMessageRead: true }
                                        : room
                                )
                            );
                        } catch (error) {
                            console.error("읽음 이벤트 처리 실패", error);
                        }
                    }
                );

                messageSubscriptionRef.current = messageSub;
                readSubscriptionRef.current = readSub;
            } catch (error) {
                console.error("채팅방 구독 실패", error);
            }
        };

        subscribe();

        return () => {
            cancelled = true;
            cleanupSubscription(messageSubscriptionRef);
            cleanupSubscription(readSubscriptionRef);
        };
    }, [isOpen, selectedRoomId]);

    const handleOpenToggle = () => {
        if (isOpen) {
            setInput("");
            setMessages([]);
            setView("list");
            closeChat();
        } else {
            setView("list");
            openChat();
        }
    };

    const handleSelectRoom = async (roomId: number) => {
        setRoom(roomId);
        setInput("");
        setMessages([]);

        setRooms((prev) =>
            prev.map((room) =>
                room.roomId === roomId ? { ...room, unreadCount: 0 } : room
            )
        );

        setView("room");
    };

    const handleBack = async () => {
        setView("list");
        setInput("");
        await fetchRooms();
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
                                lastMessageAt: new Date().toISOString(),
                                lastMessageMine: true,
                                lastMessageRead: false,
                                lastMessageSystem: false,
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

    const selectedRoom =
        selectedRoomId !== null
            ? rooms.find((room) => room.roomId === selectedRoomId) ?? null
            : null;

    return (
        <>
            <ChatWindow
                isOpen={isOpen}
                view={view}
                onClose={closeChat}
                onBack={handleBack}
                rooms={rooms}
                selectedRoom={selectedRoom}
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