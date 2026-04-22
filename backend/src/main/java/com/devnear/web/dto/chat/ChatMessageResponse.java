package com.devnear.web.dto.chat;

import com.devnear.web.domain.chat.ChatMessage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {

    private Long messageId;
    private Long roomId;
    private Long senderId;
    private String senderName;
    private String senderNickname;
    private String content;
    private boolean read;
    private boolean systemMessage;
    private LocalDateTime createdAt;

    public static ChatMessageResponse from(ChatMessage message) {
        return ChatMessageResponse.builder()
                .messageId(message.getId())
                .roomId(message.getChatRoom().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getName())
                .senderNickname(message.getSender().getNickname())
                .content(message.getContent())
                .read(message.isRead())
                .systemMessage(message.isSystemMessage())
                .createdAt(message.getCreatedAt())
                .build();
    }
}