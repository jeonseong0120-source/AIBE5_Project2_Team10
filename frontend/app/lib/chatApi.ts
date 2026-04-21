import api from "./axios";
import type {
    ChatMessageResponse,
    ChatMessageSendRequest,
    ChatRoomResponse,
} from "../../types/chat";
import { connectChatSocket } from "./chatSocket";

export async function getChatRooms(): Promise<ChatRoomResponse[]> {
    const { data } = await api.get<ChatRoomResponse[]>("/chat/rooms");
    return data;
}

export async function getChatMessages(
    roomId: number
): Promise<ChatMessageResponse[]> {
    const { data } = await api.get<ChatMessageResponse[]>(
        `/chat/rooms/${roomId}/messages`
    );
    return data;
}

export async function markChatAsRead(roomId: number): Promise<void> {
    await api.patch(`/chat/rooms/${roomId}/read`);
}

export async function sendChatMessage(
    body: ChatMessageSendRequest
): Promise<void> {
    const client = connectChatSocket();

    if (!client.connected) {
        throw new Error("채팅 서버에 연결되지 않았습니다.");
    }

    client.publish({
        destination: "/pub/chat/send",
        body: JSON.stringify({
            roomId: body.roomId,
            content: body.message,
        }),
    });
}

export async function createOrGetChatRoom(
    targetUserId: number
): Promise<{ roomId: number }> {
    const { data } = await api.post<{ roomId: number }>("/chat/rooms", {
        targetUserId,
    });
    return data;
}