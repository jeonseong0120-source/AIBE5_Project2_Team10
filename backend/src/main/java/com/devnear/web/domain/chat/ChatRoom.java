package com.devnear.web.domain.chat;

import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "chat_rooms",
        uniqueConstraints = {
                // 같은 프로젝트 안에서 같은 두 유저가 중복 채팅방을 만들지 못하게 막는 제약조건
                @UniqueConstraint(
                        name = "uk_chat_room_project_users",
                        columnNames = {"project_id", "user1_id", "user2_id"}
                )
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_room_id")
    private Long id;

    // 채팅 참여자 1
    // User 기준으로 채팅방을 관리해야 인증/권한 체크가 쉬움
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;

    // 채팅 참여자 2
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;

    // 어떤 프로젝트에 대한 채팅인지 연결
    // DevNear는 프로젝트 기반 상담 구조라서 project 연결이 중요함
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Builder
    public ChatRoom(User user1, User user2, Project project) {
        this.user1 = user1;
        this.user2 = user2;
        this.project = project;
    }

    // 현재 로그인한 사용자가 이 채팅방의 참여자인지 확인하는 메서드
    public boolean isParticipant(User user) {
        return user1.getId().equals(user.getId()) || user2.getId().equals(user.getId());
    }

    // 내 기준에서 상대방이 누구인지 찾아주는 메서드
    // 채팅방 목록에서 "상대방 이름" 보여줄 때 사용
    public User getOpponent(User me) {
        if (user1.getId().equals(me.getId())) {
            return user2;
        }
        if (user2.getId().equals(me.getId())) {
            return user1;
        }

        // 참여자가 아닌 유저가 접근한 경우 예외 발생
        throw new IllegalArgumentException("해당 유저는 이 채팅방의 참여자가 아닙니다.");
    }
}