import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client: Client | null = null;

function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
}

export function connectChatSocket(onConnect?: () => void) {
    if (client?.active) return client;

    const token = getAccessToken();

    client = new Client({
        webSocketFactory: () => new SockJS("http://localhost:8080/ws-chat"),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 5000,
        debug: () => {},
        onConnect: () => {
            onConnect?.();
        },
        onStompError: (frame) => {
            console.error("STOMP 에러", frame);
        },
        onWebSocketError: (event) => {
            console.error("WebSocket 에러", event);
        },
    });

    client.activate();
    return client;
}

export function disconnectChatSocket() {
    if (client) {
        client.deactivate();
        client = null;
    }
}

export function subscribeChatRoom(
    roomId: number,
    callback: (message: IMessage) => void
): StompSubscription | null {
    if (!client || !client.connected) return null;
    return client.subscribe(`/sub/chat/rooms/${roomId}`, callback);
}

export function isChatSocketConnected() {
    return !!client?.connected;
}