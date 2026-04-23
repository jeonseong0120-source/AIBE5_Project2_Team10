import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client: Client | null = null;

export const connectChatSocket = () => {
    if (client && client.connected) return;

    client = new Client({
        webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
        reconnectDelay: 5000,
    });

    client.onConnect = () => {
        console.log("WebSocket 연결 성공");
    };

    client.onStompError = (frame) => {
        console.error("STOMP error", frame);
    };

    client.activate();
};

export const disconnectChatSocket = () => {
    if (client && client.connected) {
        client.deactivate();
        client = null;
    }
};

export const ensureChatSocketConnected = async () => {
    if (!client) {
        connectChatSocket();
    }

    return new Promise<void>((resolve) => {
        const check = () => {
            if (client && client.connected) {
                resolve();
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });
};

export const subscribeChatRoom = (
    roomId: number,
    callback: (message: IMessage) => void
): StompSubscription => {
    if (!client || !client.connected) {
        throw new Error("WebSocket not connected");
    }

    return client.subscribe(`/sub/chat/rooms/${roomId}`, callback);
};
export async function subscribeChatReadReceipt(
    roomId: number,
    callback: (message: IMessage) => void
): Promise<StompSubscription> {
    const socketClient = await ensureChatSocketConnected();
    return socketClient.subscribe(`/sub/chat/rooms/${roomId}/read`, callback);
}