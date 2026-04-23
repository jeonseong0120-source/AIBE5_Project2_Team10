import api from "./axios";
import type {
    ChatMessageResponse,
    ChatMessageSendRequest,
    ChatRoomCreateResponse,
    ChatRoomListResponse,
} from "../../types/chat";
import { ensureChatSocketConnected } from "./chatSocket";

export async function getChatRooms(): Promise<ChatRoomListResponse[]> {
    const { data } = await api.get<ChatRoomListResponse[]>("/chat/rooms");
    return data;
}

export async function getChatMessages(
    roomId: number,
    page = 0,
    size = 50
): Promise<ChatMessageResponse[]> {
    const { data } = await api.get<ChatMessageResponse[]>(
        `/chat/rooms/${roomId}/messages`,
        {
            params: { page, size },
        }
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
    targetUserId: number,
    projectId: number
): Promise<ChatRoomCreateResponse> {
    const { data } = await api.post<ChatRoomCreateResponse>("/chat/rooms", {
        targetUserId,
        projectId,
    });
    return data;
}