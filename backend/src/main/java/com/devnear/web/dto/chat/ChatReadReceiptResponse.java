package com.devnear.web.dto.chat;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatReadReceiptResponse {

    private Long roomId;
    private Long readerId;
    private boolean read;

    public static ChatReadReceiptResponse of(Long roomId, Long readerId) {
        return ChatReadReceiptResponse.builder()
                .roomId(roomId)
                .readerId(readerId)
                .read(true)
                .build();
    }
}