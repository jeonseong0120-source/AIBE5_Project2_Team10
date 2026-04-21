import { create } from "zustand";

interface ChatState {
    isOpen: boolean;
    selectedRoomId: number | null;

    openChat: (roomId?: number) => void;
    closeChat: () => void;
    setRoom: (roomId: number | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    isOpen: false,
    selectedRoomId: null,

    openChat: (roomId) =>
        set({
            isOpen: true,
            selectedRoomId: roomId ?? null,
        }),

    closeChat: () =>
        set({
            isOpen: false,
        }),

    setRoom: (roomId) =>
        set({
            selectedRoomId: roomId,
        }),
}));