"use client";

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
}

export default function ChatInput({
                                      value,
                                      onChange,
                                      onSend,
                                  }: ChatInputProps) {
    return (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
                <button
                    type="button"
                    onClick={onSend}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-700"
                >
                    ➤
                </button>
            </div>
        </div>
    );
}