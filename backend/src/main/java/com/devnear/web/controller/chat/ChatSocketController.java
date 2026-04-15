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
    public void sendMessage(ChatMessageSendRequest request, Authentication authentication) {
        // 웹소켓 인증 객체에서 현재 로그인 유저 꺼내기
        User user = (User) authentication.getPrincipal();

        // 메시지 저장
        ChatMessageResponse response = chatService.saveMessage(user, request);

        // 같은 채팅방을 구독 중인 사용자들에게 실시간 전송
        messagingTemplate.convertAndSend(
                "/sub/chat/rooms/" + request.getRoomId(),
                response
        );
    }
}