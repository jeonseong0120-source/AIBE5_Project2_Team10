package com.devnear.web.domain.chat;

import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chat_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_message_id")
    private Long id;

    // 어떤 채팅방의 메시지인지 연결
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    // 누가 보낸 메시지인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    // 메시지 내용
    // 길이가 길어질 수 있으니 TEXT 사용
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // 읽음 여부
    // 기본값은 false로 시작하고, 상대방이 읽으면 true로 변경
    @Column(nullable = false)
    private boolean isRead;

    @Builder
    public ChatMessage(ChatRoom chatRoom, User sender, String content) {
        this.chatRoom = chatRoom;
        this.sender = sender;
        this.content = content;
        this.isRead = false; // 메시지 생성 시 처음엔 안 읽은 상태
    }

    // 읽음 처리 메서드
    public void markAsRead() {
        this.isRead = true;
    }
}