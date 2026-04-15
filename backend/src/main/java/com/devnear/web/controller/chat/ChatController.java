package com.devnear.web.controller.chat;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.chat.ChatMessageResponse;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Chat", description = "1대1 채팅 관련 API")
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // 채팅방 생성 API
    @Operation(summary = "채팅방 생성", description = "프로젝트 기준 1대1 채팅방을 생성하거나 기존 방을 반환합니다.")
    @PostMapping("/rooms")
    public ResponseEntity<ChatRoomResponse> createRoom(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid ChatRoomCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.createRoom(user, request));
    }

    // 내 채팅방 목록 조회 API
    @Operation(summary = "내 채팅방 목록 조회")
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomListResponse>> getMyRooms(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(chatService.getMyRooms(user));
    }

    // 특정 채팅방 메시지 조회 API
    @Operation(summary = "채팅 메시지 조회")
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @AuthenticationPrincipal User user,
            @PathVariable Long roomId
    ) {
        return ResponseEntity.ok(chatService.getMessages(user, roomId));
    }

    // 특정 채팅방 읽음 처리 API
    @Operation(summary = "읽음 처리")
    @PatchMapping("/rooms/{roomId}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal User user,
            @PathVariable Long roomId
    ) {
        chatService.markAsRead(user, roomId);
        return ResponseEntity.noContent().build();
    }
}