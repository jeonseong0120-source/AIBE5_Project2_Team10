package com.devnear.web.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatRoomCreateRequest {

    // 어떤 프로젝트에 대한 채팅방인지
    @NotNull
    private Long projectId;

    // 누구와 채팅할지 상대 유저 ID
    @NotNull
    private Long targetUserId;
}