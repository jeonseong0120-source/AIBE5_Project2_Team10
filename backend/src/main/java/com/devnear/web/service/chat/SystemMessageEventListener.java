package com.devnear.web.service.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class SystemMessageEventListener {
    private final SimpMessagingTemplate messagingTemplate;
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSystemMessageCreated(SystemMessageCreatedEvent event) {
        try {
            messagingTemplate.convertAndSend("/sub/chat/rooms/" + event.roomId(), event.response());
        } catch (RuntimeException ex) {
            log.error("Failed to broadcast system message. roomId={}", event.roomId(), ex);
        }

    }
}
