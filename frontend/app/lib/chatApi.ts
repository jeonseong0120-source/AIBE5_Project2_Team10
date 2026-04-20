import { ChatMessageResponse, ChatRoomResponse } from "../types/chat";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function getAuthHeaders() {
    if (typeof window === "undefined") {
        return {
            "Content-Type": "application/json",
        };
    }

    const token = localStorage.getItem("accessToken");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export async function getChatRooms(): Promise<ChatRoomResponse[]> {
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms`, {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("채팅방 목록 조회에 실패했습니다.");
    }

    return response.json();
}

export async function getChatMessages(
    roomId: number
): Promise<ChatMessageResponse[]> {
    const response = await fetch(
        `${API_BASE_URL}/api/chat/rooms/${roomId}/messages`,
        {
            method: "GET",
            headers: getAuthHeaders(),
            cache: "no-store",
        }
    );

    if (!response.ok) {
        throw new Error("채팅 메시지 조회에 실패했습니다.");
    }

    return response.json();
}

export async function markChatAsRead(roomId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("읽음 처리에 실패했습니다.");
    }
}