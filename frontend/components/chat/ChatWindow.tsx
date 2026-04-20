"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ChatInput from "./ChatInput";
import ChatMessageBubble from "./ChatMessageBubble";

interface DummyMessage {
    id: number;
    message: string;
    time: string;
    isMine: boolean;
}

interface ChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
    messages: DummyMessage[];
    input: string;
    onChangeInput: (value: string) => void;
    onSend: () => void;
}

export default function ChatWindow({
                                       isOpen,
                                       onClose,
                                       messages,
                                       input,
                                       onChangeInput,
                                       onSend,
                                   }: ChatWindowProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            style={{
                position: "fixed",
                right: "24px",
                bottom: "88px",
                width: "380px",
                height: "540px",
                zIndex: 9999,
            }}
            className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl"
        >
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-lg">
                        👤
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">1:1 채팅</p>
                        <p className="text-xs text-gray-400">현재는 UI 미리보기 단계입니다</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="채팅 닫기"
                    className="text-xl text-gray-400 hover:text-gray-600"
                >
                    ×
                </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
                {messages.map((msg) => (
                    <ChatMessageBubble
                        key={msg.id}
                        message={msg.message}
                        time={msg.time}
                        isMine={msg.isMine}
                    />
                ))}
            </div>

            <ChatInput value={input} onChange={onChangeInput} onSend={onSend} />
        </div>,
        document.body
    );
}