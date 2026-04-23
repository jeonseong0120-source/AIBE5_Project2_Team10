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