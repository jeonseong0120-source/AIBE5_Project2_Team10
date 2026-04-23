export interface ChatMessageResponse {
    messageId: number;
    roomId: number;
    senderId: number;
    senderName: string;
    senderNickname: string;
    content: string;
    read: boolean;
    systemMessage: boolean;
    createdAt: string;
}

export interface ChatMessageSendRequest {
    roomId: number;
    message: string;
}

export interface ChatRoomCreateResponse {
    roomId: number;
    projectId: number;
    projectName: string;
    opponentUserId: number;
    opponentName: string;
    opponentNickname: string;
}

export interface ChatRoomListResponse {
    roomId: number;
    projectId: number;
    projectName: string;
    opponentUserId: number;
    opponentName: string;
    opponentNickname: string;
    lastMessage: string | null;
    lastMessageTime: string | null;
    unreadCount: number;
}