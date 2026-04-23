import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { resolveSockJsUrl } from "./wsUrl";

let client: Client | null = null;
let connectingPromise: Promise<Client> | null = null;

function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
}

function resolveChatSocketUrl(): string {
    return process.env.NEXT_PUBLIC_WS_URL?.trim() || resolveSockJsUrl();
}

export function connectChatSocket(onConnect?: () => void) {
    if (client?.active) return client;

    client = new Client({
        webSocketFactory: () => new SockJS(resolveChatSocketUrl()),
        reconnectDelay: 5000,
        debug: () => {},
        beforeConnect: () => {
            const token = getAccessToken();
            client!.connectHeaders = token
                ? { Authorization: `Bearer ${token}` }
                : {};
        },
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

export function disconnectChatSocket() {
    if (client) {
        client.deactivate();
        client = null;
    }
    connectingPromise = null;
}

export async function subscribeChatRoom(
    roomId: number,
    callback: (message: IMessage) => void
): Promise<StompSubscription> {
    const socketClient = await ensureChatSocketConnected();
    return socketClient.subscribe(`/sub/chat/rooms/${roomId}`, callback);

}