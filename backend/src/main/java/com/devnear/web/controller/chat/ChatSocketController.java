package com.devnear.web.controller.chat;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.chat.ChatMessageResponse;
import com.devnear.web.dto.chat.ChatMessageSendRequest;
import com.devnear.web.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/send")
    public void sendMessage(`@Valid` ChatMessageSendRequest request, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            throw new AccessDeniedException("웹소켓 인증 정보가 유효하지 않습니다.");
        }
        // 메시지 저장
        ChatMessageResponse response = chatService.saveMessage(user, request);

        // 같은 채팅방을 구독 중인 사용자들에게 실시간 전송
        messagingTemplate.convertAndSend(
                "/sub/chat/rooms/" + request.getRoomId(),
                response
        );
    }
}