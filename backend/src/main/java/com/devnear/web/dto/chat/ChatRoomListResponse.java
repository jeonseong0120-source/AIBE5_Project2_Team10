package com.devnear.web.dto.chat;

import com.devnear.web.domain.chat.ChatMessage;
import com.devnear.web.domain.chat.ChatRoom;
import com.devnear.web.domain.user.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatRoomListResponse {

    private Long roomId;
    private Long projectId;
    private String projectName;
    private Long opponentUserId;
    private String opponentName;
    private String opponentNickname;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount;

    // 추가
    private boolean lastMessageMine;
    private boolean lastMessageRead;
    private boolean lastMessageSystem;

    public static ChatRoomListResponse of(ChatRoom room, User me, ChatMessage lastMessage, long unreadCount) {
        User opponent = room.getOpponent(me);

        boolean lastMessageMine = false;
        boolean lastMessageRead = false;
        boolean lastMessageSystem = false;

        if (lastMessage != null) {
            lastMessageMine = lastMessage.getSender() != null
                    && lastMessage.getSender().getId().equals(me.getId());
            lastMessageRead = lastMessage.isRead();
            lastMessageSystem = lastMessage.isSystemMessage();
        }

        return ChatRoomListResponse.builder()
                .roomId(room.getId())
                .projectId(room.getProject().getId())
                .projectName(room.getProject().getProjectName())
                .opponentUserId(opponent.getId())
                .opponentName(opponent.getName())
                .opponentNickname(opponent.getNickname())
                .lastMessage(lastMessage != null ? lastMessage.getContent() : null)
                .lastMessageAt(lastMessage != null ? lastMessage.getCreatedAt() : null)
                .unreadCount(unreadCount)
                .lastMessageMine(lastMessageMine)
                .lastMessageRead(lastMessageRead)
                .lastMessageSystem(lastMessageSystem)
                .build();
    }
}