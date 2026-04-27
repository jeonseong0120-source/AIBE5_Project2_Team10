"use client";

import { useEffect, useRef, useState } from "react";
import type { StompSubscription, IMessage } from "@stomp/stompjs";
import ChatWindow from "./ChatWindow";
import {
    getChatMessages,
    getChatRooms,
    leaveChatRoom,
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
import { DEVNEAR_AUTH_CHANGED } from "../../app/lib/authEvents";
import { useChatStore } from "../../app/store/chatStore";
import type {
    ChatMessageResponse,
    ChatReadReceiptResponse,
    ChatRoomListResponse,
} from "../../types/chat";
import { dnAlert, dnConfirm } from "@/lib/swal";

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

function hasToken() {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("accessToken");
}

export default function ChatWidget() {
    const [view, setView] = useState<ChatView>("list");
    const [input, setInput] = useState("");
    const [rooms, setRooms] = useState<ChatRoomListResponse[]>([]);
    const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);

    const [loadingRooms, setLoadingRooms] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [leaving, setLeaving] = useState(false);

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

    const syncAuthState = () => {
        const tokenExists = hasToken();
        const userId = getCurrentUserId();

        setLoggedIn(tokenExists);
        setCurrentUserId(userId);
        currentUserIdRef.current = userId;

        if (!tokenExists) {
            cleanupSubscription(messageSubscriptionRef);
            cleanupSubscription(readSubscriptionRef);
            disconnectChatSocket();

            setInput("");
            setMessages([]);
            setRooms([]);
            setRoom(null);
            setView("list");
            closeChat();
        }
    };

    useEffect(() => {
        syncAuthState();

        const handleStorage = () => syncAuthState();
        const handleFocus = () => syncAuthState();
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                syncAuthState();
            }
        };
        const handleAuthChanged = () => syncAuthState();

        window.addEventListener("storage", handleStorage);
        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener(DEVNEAR_AUTH_CHANGED, handleAuthChanged);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener(DEVNEAR_AUTH_CHANGED, handleAuthChanged);
        };
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
        if (!hasToken()) return;

        try {
            setLoadingRooms(true);

            const roomData = await getChatRooms();
            const currentSelectedRoomId = selectedRoomIdRef.current;

            const existsSelected =
                currentSelectedRoomId !== null &&
                roomData.some((room) => room.roomId === currentSelectedRoomId);

            const filtered = roomData.filter(
                (room) =>
                    room.lastMessage !== null ||
                    room.unreadCount > 0 ||
                    room.roomId === currentSelectedRoomId
            );

            const sortedRooms = sortRoomsByLatest(filtered);
            setRooms(sortedRooms);

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
        if (!hasToken()) return;

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
        if (!isOpen || !loggedIn) return;
        fetchRooms();
    }, [isOpen, loggedIn]);

    useEffect(() => {
        if (!isOpen || !loggedIn || !selectedRoomId || view !== "room") return;
        fetchMessages(selectedRoomId);
    }, [isOpen, loggedIn, selectedRoomId, view]);

    useEffect(() => {
        if (!isOpen || !loggedIn) return;

        connectChatSocket();

        return () => {
            cleanupSubscription(messageSubscriptionRef);
            cleanupSubscription(readSubscriptionRef);
            disconnectChatSocket();
        };
    }, [isOpen, loggedIn]);

    useEffect(() => {
        if (!isOpen || !loggedIn || !selectedRoomId) return;

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

                messageSubscriptionRef.current = messageSub;

                try {
                    const readSub = await subscribeChatReadReceipt(
                        selectedRoomId,
                        (frame: IMessage) => {
                            try {
                                const receipt: ChatReadReceiptResponse = JSON.parse(frame.body);

                                if (!receipt.read) return;
                                if (receipt.roomId !== selectedRoomIdRef.current) return;

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

                    readSubscriptionRef.current = readSub;
                } catch (error) {
                    cleanupSubscription(messageSubscriptionRef);
                    cleanupSubscription(readSubscriptionRef);
                    throw error;
                }
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
    }, [isOpen, loggedIn, selectedRoomId]);

    const handleOpenToggle = () => {
        syncAuthState();

        if (!hasToken()) {
            return;
        }

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

    const handleLeaveRoom = async () => {
        if (!selectedRoomId || leaving) return;

        const ok = await dnConfirm("채팅방을 나가시겠습니까?");
        if (!ok) return;

        try {
            setLeaving(true);
            await leaveChatRoom(selectedRoomId);

            cleanupSubscription(messageSubscriptionRef);
            cleanupSubscription(readSubscriptionRef);

            setRooms((prev) => prev.filter((room) => room.roomId !== selectedRoomId));
            setMessages([]);
            setInput("");
            setRoom(null);
            setView("list");

            await fetchRooms();
        } catch (error) {
            console.error("채팅방 나가기 실패", error);
            await dnAlert("채팅방 나가기에 실패했습니다. 다시 시도해주세요.", "error");
        } finally {
            setLeaving(false);
        }
    };

    const handleSend = async () => {
        const trimmed = input.trim();

        if (!trimmed || !selectedRoomId || sending) return;

        if (trimmed.length > 500) {
            await dnAlert("메시지는 500자 이하로 입력해주세요.", "warning");
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
            await dnAlert("메시지 전송에 실패했습니다. 다시 시도해주세요.", "error");
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
                isOpen={isOpen && loggedIn}
                view={view}
                onClose={closeChat}
                onBack={handleBack}
                onLeaveRoom={handleLeaveRoom}
                rooms={rooms}
                selectedRoom={selectedRoom}
                selectedRoomId={selectedRoomId}
                messages={messages}
                input={input}
                onChangeInput={setInput}
                onSelectRoom={handleSelectRoom}
                onSend={handleSend}
                loadingRooms={loadingRooms}
                loadingMessages={loadingMessages}
                sending={sending}
                leaving={leaving}
                currentUserId={currentUserId}
            />

            {loggedIn && (
                <button
                    type="button"
                    onClick={handleOpenToggle}
                    className="fixed bottom-6 right-6 z-[9999] h-16 w-16 rounded-full shadow-xl transition hover:scale-105 overflow-hidden"
                    aria-label="채팅 열기"
                >
                    {/* 사용자가 첨부한 이미지의 파일명에 맞게 src 경로를 수정해주세요. 예: /chat-icon.png */}
                    <img 
                        src="/chat-icon.png" 
                        alt="채팅 아이콘" 
                        className="h-full w-full object-cover"
                    />
                </button>
            )}
        </>
    );
}