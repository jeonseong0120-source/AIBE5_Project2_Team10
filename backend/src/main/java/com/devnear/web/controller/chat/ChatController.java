package com.devnear.web.controller.chat;

import com.devnear.global.auth.LoginUser;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.chat.ChatMessageResponse;
import com.devnear.web.dto.chat.ChatReadReceiptResponse;
import com.devnear.web.dto.chat.ChatRoomCreateRequest;
import com.devnear.web.dto.chat.ChatRoomListResponse;
import com.devnear.web.dto.chat.ChatRoomResponse;
import com.devnear.web.service.chat.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Chat", description = "1대1 채팅 관련 API")
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @Operation(summary = "채팅방 생성", description = "프로젝트 기준 1대1 채팅방을 생성하거나 기존 방을 반환합니다.")
    @PostMapping("/rooms")
    public ResponseEntity<ChatRoomResponse> createRoom(
            @LoginUser User user,
            @RequestBody @Valid ChatRoomCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.createRoom(user, request));
    }

    @Operation(summary = "내 채팅방 목록 조회")
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomListResponse>> getMyRooms(
            @LoginUser User user
    ) {
        return ResponseEntity.ok(chatService.getMyRooms(user));
    }

    @Operation(summary = "채팅 메시지 조회")
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @LoginUser User user,
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        if (page < 0) page = 0;
        if (size < 1) size = 1;
        if (size > 100) size = 100;
        return ResponseEntity.ok(chatService.getMessages(user, roomId, page, size));
    }

    @Operation(summary = "읽음 처리")
    @PatchMapping("/rooms/{roomId}/read")
    public ResponseEntity<Void> markAsRead(
            @LoginUser User user,
            @PathVariable Long roomId
    ) {
        int updatedCount = chatService.markAsRead(user, roomId);

        if (updatedCount > 0) {
            messagingTemplate.convertAndSend(
                    "/sub/chat/rooms/" + roomId + "/read",
                    ChatReadReceiptResponse.of(roomId, user.getId())
            );
        }

        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "채팅방 나가기")
    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<Void> leaveRoom(
            @LoginUser User user,
            @PathVariable Long roomId
    ) {
        chatService.leaveRoom(user, roomId);
        return ResponseEntity.noContent().build();
    }
}