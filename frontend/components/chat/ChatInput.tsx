"use client";

import { useState } from "react";

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    disabled?: boolean;
    sending?: boolean;
    canSend?: boolean;
}

export default function ChatInput({
                                      value,
                                      onChange,
                                      onSend,
                                      disabled = false,
                                      sending = false,
                                      canSend = true,
                                  }: ChatInputProps) {
    const [isComposing, setIsComposing] = useState(false);

    const placeholder = sending
        ? "전송 중..."
        : canSend
            ? "메시지를 입력하세요..."
            : "채팅방을 선택하세요";

    return (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
                <input
                    type="text"
                    value={value}
                    maxLength={500}
                    onChange={(e) => onChange(e.target.value)}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !disabled && !isComposing) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                    type="button"
                    onClick={onSend}
                    disabled={disabled}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    ➤
                </button>
            </div>
        </div>
    );
}