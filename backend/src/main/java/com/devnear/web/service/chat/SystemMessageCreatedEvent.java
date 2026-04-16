package com.devnear.web.service.chat;

import com.devnear.web.dto.chat.ChatMessageResponse;

public record SystemMessageCreatedEvent(Long roomId, ChatMessageResponse response) {
}
