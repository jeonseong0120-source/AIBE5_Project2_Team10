interface ChatMessageBubbleProps {
    message: string;
    time: string;
    isMine: boolean;
    isRead?: boolean;
    senderNickname?: string;
    systemMessage?: boolean;
}

export default function ChatMessageBubble({
                                              message,
                                              time,
                                              isMine,
                                              isRead = false,
                                              senderNickname,
                                              systemMessage = false,
                                          }: ChatMessageBubbleProps) {
    if (systemMessage) {
        return (
            <div className="flex justify-center">
                <div className="max-w-[85%] rounded-full bg-gray-200 px-3 py-1.5 text-center text-[11px] text-gray-600">
                    {message}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
            <div
                className={`flex max-w-[78%] flex-col ${
                    isMine ? "items-end" : "items-start"
                }`}
            >
                {!isMine && senderNickname && (
                    <span className="mb-1 px-1 text-[11px] font-medium text-gray-500">
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

                {(time || isMine) && (
                    <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-gray-400">
                        {isMine && (
                            <span className={isRead ? "text-violet-600" : "text-gray-400"}>
                                {isRead ? "읽음" : "전송됨"}
                            </span>
                        )}
                        {time && <span>{time}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}