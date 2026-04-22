"use client";

import { useState } from "react";
import { createOrGetChatRoom } from "@/app/lib/chatApi";
import { useChatStore } from "@/app/store/chatStore";

interface ChatStartButtonProps {
    targetUserId: number;
    className?: string;
    label?: string;
    disabled?: boolean;
}

export default function ChatStartButton({
                                            targetUserId,
                                            className = "",
                                            label = "채팅하기",
                                            disabled = false,
                                        }: ChatStartButtonProps) {
    const openChat = useChatStore((state) => state.openChat);
    const [isLoading, setIsLoading] = useState(false);

    const handleStartChat = async () => {
        if (disabled || isLoading) return;

        try {
            setIsLoading(true);

            const response = await createOrGetChatRoom(targetUserId);
            openChat(response.roomId);
        } catch (error) {
            console.error("채팅방 생성/조회 실패:", error);
            alert("채팅방을 열지 못했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleStartChat}
            disabled={disabled || isLoading}
            className={className}
        >
            {isLoading ? "채팅방 여는 중..." : label}
        </button>
    );
}