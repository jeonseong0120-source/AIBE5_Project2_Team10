import api from "./axios";
import type {
    ChatMessageResponse,
    ChatMessageSendRequest,
    ChatRoomCreateResponse,
    ChatRoomResponse,
} from "../../types/chat";
import { ensureChatSocketConnected } from "./chatSocket";

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
    const client = await ensureChatSocketConnected();

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
): Promise<ChatRoomCreateResponse> {
    const { data } = await api.post<ChatRoomCreateResponse>("/chat/rooms", {
        targetUserId,
    });
    return data;
}