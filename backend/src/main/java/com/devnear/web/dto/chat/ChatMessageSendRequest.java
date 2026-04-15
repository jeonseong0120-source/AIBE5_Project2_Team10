package com.devnear.web.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatMessageSendRequest {

    // 어느 채팅방에 보낼지
    @NotNull
    private Long roomId;

    // 실제 메시지 내용
    @NotBlank
    @Size(max = 2000)
    private String content;
}