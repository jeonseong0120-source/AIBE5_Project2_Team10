let connectingPromise: Promise<Client> | null = null;

export async function ensureChatSocketConnected(): Promise<Client> {
    // 이미 연결됨
    if (client?.connected) return client;

    // 🔥 이미 연결 시도 중이면 그거 재사용
    if (connectingPromise) return connectingPromise;

    connectingPromise = new Promise((resolve, reject) => {
        const socketClient = connectChatSocket();

        const timeout = setTimeout(() => {
            connectingPromise = null;
            reject(new Error("채팅 소켓 연결 시간 초과"));
        }, 5000);

        const originalOnConnect = socketClient.onConnect;
        const originalOnWebSocketError = socketClient.onWebSocketError;

        socketClient.onConnect = (frame) => {
            clearTimeout(timeout);
            connectingPromise = null;
            originalOnConnect?.(frame);
            resolve(socketClient);
        };

        socketClient.onWebSocketError = (event) => {
            clearTimeout(timeout);
            connectingPromise = null;
            originalOnWebSocketError?.(event);
            reject(new Error("채팅 소켓 연결 실패"));
        };
    });

    return connectingPromise;
}