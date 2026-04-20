"use client";

import { useState } from "react";
import ChatWindow from "./ChatWindow";

const initialMessages = [
    {
        id: 1,
        message: "안녕하세요! 문의 주신 내용 확인 도와드릴게요.",
        time: "오후 2:10",
        isMine: false,
    },
    {
        id: 2,
        message: "채팅 위젯 UI를 먼저 붙이고 있어요.",
        time: "오후 2:11",
        isMine: true,
    },
    {
        id: 3,
        message: "좋아요. 지금은 오른쪽 하단에 뜨는지만 확인하면 됩니다.",
        time: "오후 2:12",
        isMine: false,
    },
];

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState(initialMessages);

    const handleSend = () => {
        if (!input.trim()) return;

        const newMessage = {
            id: Date.now(),
            message: input,
            time: "방금",
            isMine: true,
        };

        setMessages((prev) => [...prev, newMessage]);
        setInput("");
    };

    return (
        <>
            <ChatWindow
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                messages={messages}
                input={input}
                onChangeInput={setInput}
                onSend={handleSend}
            />

            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="fixed bottom-6 right-6 z-[9999] flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-2xl text-white shadow-xl transition hover:scale-105 hover:bg-violet-700"
                aria-label="채팅 열기"
            >
                💬
            </button>
        </>
    );
}