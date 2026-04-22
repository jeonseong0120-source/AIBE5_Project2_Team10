"use client";

import { createOrGetChatRoom } from "../../app/lib/chatApi";
import { useChatStore } from "../../app/store/chatStore";

interface ChatStartButtonProps {
    targetUserId: number;
    className?: string;
    children?: React.ReactNode;
}

export default function ChatStartButton({
                                            targetUserId,
                                            className = "rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700",
                                            children = "채팅하기",
                                        }: ChatStartButtonProps) {
    const { openChat } = useChatStore();

    const handleStartChat = async () => {
        try {
            const { roomId } = await createOrGetChatRoom(targetUserId);
            openChat(roomId);
        } catch (error) {
            console.error("채팅방 생성 실패", error);
        }
    };

    return (
        <button type="button" onClick={handleStartChat} className={className}>
            {children}
        </button>
    );
}