interface ChatMessageBubbleProps {
    message: string;
    time: string;
    isMine: boolean;
    senderNickname?: string;
}

export default function ChatMessageBubble({
                                              message,
                                              time,
                                              isMine,
                                              senderNickname,
                                          }: ChatMessageBubbleProps) {
    return (
        <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
            <div
                className={`flex max-w-[75%] flex-col ${
                    isMine ? "items-end" : "items-start"
                }`}
            >
                {!isMine && senderNickname && (
                    <span className="mb-1 px-1 text-[11px] text-gray-400">
                        {senderNickname}
                    </span>
                )}

                <div
                    className={`break-words rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        isMine
                            ? "rounded-br-md bg-violet-600 text-white"
                            : "rounded-bl-md border border-gray-200 bg-white text-gray-900"
                    }`}
                >
                    {message}
                </div>

                <span className="mt-1 px-1 text-[11px] text-gray-400">{time}</span>
            </div>
        </div>
    );
}