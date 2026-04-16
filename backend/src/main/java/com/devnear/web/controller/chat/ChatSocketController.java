package com.devnear.web.controller.chat;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.chat.ChatMessageResponse;
import com.devnear.web.dto.chat.ChatMessageSendRequest;
import com.devnear.web.service.chat.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/send")
    public void sendMessage(@Valid @Payload ChatMessageSendRequest request, Authentication authentication) {
        if (authentication == null) {
            throw new IllegalArgumentException("웹소켓 인증 정보가 없습니다.");
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof User user)) {
            throw new IllegalArgumentException("principal 타입이 User가 아닙니다: " + principal.getClass().getName());
        }

        ChatMessageResponse response = chatService.saveMessage(user, request);

        messagingTemplate.convertAndSend(
                "/sub/chat/rooms/" + request.getRoomId(),
                response
        );
    }
}