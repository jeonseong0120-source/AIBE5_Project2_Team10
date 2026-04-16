package com.devnear.web.dto.chat;

import com.devnear.web.domain.chat.ChatRoom;
import com.devnear.web.domain.user.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatRoomResponse {

    private Long roomId;
    private Long projectId;
    private String projectName;
    private Long opponentUserId;
    private String opponentName;
    private String opponentNickname;

    // 채팅방 생성 후, 현재 로그인한 사용자 기준으로 상대방 정보를 담아 응답
    public static ChatRoomResponse from(ChatRoom room, User me) {
        User opponent = room.getOpponent(me);

        return ChatRoomResponse.builder()
                .roomId(room.getId())
                .projectId(room.getProject().getId())
                .projectName(room.getProject().getProjectName())
                .opponentUserId(opponent.getId())
                .opponentName(opponent.getName())
                .opponentNickname(opponent.getNickname())
                .build();
    }
}