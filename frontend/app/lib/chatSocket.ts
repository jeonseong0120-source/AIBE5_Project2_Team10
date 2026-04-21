import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client: Client | null = null;

function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
}

function resolveChatSocketUrl(): string {
    const envUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();

    if (envUrl) {
        return envUrl;
    }

    return "http://127.0.0.1:8080/ws-chat";
}

export function connectChatSocket(onConnect?: () => void) {
    if (client?.active) return client;

    const token = getAccessToken();

    client = new Client({
        webSocketFactory: () => new SockJS(resolveChatSocketUrl()),
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

export async function ensureChatSocketConnected(): Promise<Client> {
    if (client?.connected) return client;

    return new Promise((resolve, reject) => {
        const socketClient = connectChatSocket();

        const timeout = setTimeout(() => {
            reject(new Error("채팅 소켓 연결 시간 초과"));
        }, 5000);

        const originalOnConnect = socketClient.onConnect;
        const originalOnWebSocketError = socketClient.onWebSocketError;

        socketClient.onConnect = (frame) => {
            clearTimeout(timeout);
            originalOnConnect?.(frame);
            resolve(socketClient);
        };

        socketClient.onWebSocketError = (event) => {
            clearTimeout(timeout);
            originalOnWebSocketError?.(event);
            reject(new Error("채팅 소켓 연결 실패"));
        };
    });
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