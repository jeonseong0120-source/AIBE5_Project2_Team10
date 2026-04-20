interface ChatMessageBubbleProps {
  message: string;
  time: string;
  isMine: boolean;
}

export default function ChatMessageBubble({
  message,
  time,
  isMine,
}: ChatMessageBubbleProps) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
            isMine
              ? "bg-violet-600 text-white rounded-br-md"
              : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
          }`}
        >
          {message}
        </div>
        <span className="mt-1 px-1 text-[11px] text-gray-400">{time}</span>
      </div>
    </div>
  );
}