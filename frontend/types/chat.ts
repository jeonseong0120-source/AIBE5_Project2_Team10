export interface ChatRoomResponse {
    roomId: number;
    otherUserId: number;
    otherNickname: string;
    lastMessage: string | null;
    lastMessageTime: string | null;
    unreadCount: number;
}

export interface ChatMessageResponse {
    id: number;
    roomId: number;
    senderId: number;
    senderNickname: string;
    message: string;
    createdAt: string;
    read: boolean;
}

export interface ChatMessageSendRequest {
    roomId: number;
    message: string;
}