package com.devnear.web.controller.chat;

import com.devnear.global.auth.SecurityUser;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.dto.chat.ChatMessageResponse;
import com.devnear.web.dto.chat.ChatMessageSendRequest;
import com.devnear.web.exception.ResourceNotFoundException;
import com.devnear.web.service.chat.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    @MessageMapping("/chat/send")
    public void sendMessage(@Valid @Payload ChatMessageSendRequest request, Authentication authentication) {
        log.debug("소켓 메시지 도착: roomId={}", request.getRoomId());

        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("소켓 인증 정보가 없습니다.");
        }

        Object principal = authentication.getPrincipal();

        Long userId;

        if (principal instanceof SecurityUser securityUser) {
            userId = securityUser.getId();
        } else if (principal instanceof User domainUser) {
            userId = domainUser.getId();
        } else {
            throw new IllegalStateException("지원하지 않는 인증 principal 타입입니다: " + principal.getClass().getName());
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다. id=" + userId));

        ChatMessageResponse response = chatService.saveMessage(user, request);

        log.debug("DB 저장 완료: roomId={}, messageId={}", request.getRoomId(), response.getMessageId());

        messagingTemplate.convertAndSend(
                "/sub/chat/rooms/" + request.getRoomId(),
                response
        );
    }
}