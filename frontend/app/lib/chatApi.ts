import api from "./axios";
import type {
    ChatMessageResponse,
    ChatMessageSendRequest,
    ChatRoomResponse,
} from "../../types/chat";

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
): Promise<ChatMessageResponse> {
    const { data } = await api.post<ChatMessageResponse>(
        `/chat/rooms/${body.roomId}/messages`,
        {
            message: body.message,
        }
    );
    return data;
}