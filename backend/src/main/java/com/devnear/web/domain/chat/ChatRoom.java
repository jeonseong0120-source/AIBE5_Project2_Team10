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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "user1_exited", nullable = false)
    private boolean user1Exited = false;

    @Column(name = "user2_exited", nullable = false)
    private boolean user2Exited = false;

    @Builder
    public ChatRoom(User user1, User user2, Project project) {
        this.user1 = user1;
        this.user2 = user2;
        this.project = project;
        this.user1Exited = false;
        this.user2Exited = false;
    }

    public boolean isParticipant(User user) {
        return user1.getId().equals(user.getId()) || user2.getId().equals(user.getId());
    }

    public User getOpponent(User me) {
        if (user1.getId().equals(me.getId())) {
            return user2;
        }
        if (user2.getId().equals(me.getId())) {
            return user1;
        }

        throw new IllegalArgumentException("해당 유저는 이 채팅방의 참여자가 아닙니다.");
    }

    public void exit(User user) {
        if (user1.getId().equals(user.getId())) {
            this.user1Exited = true;
            return;
        }

        if (user2.getId().equals(user.getId())) {
            this.user2Exited = true;
            return;
        }

        throw new IllegalArgumentException("해당 유저는 이 채팅방의 참여자가 아닙니다.");
    }

    public boolean isExited(User user) {
        if (user1.getId().equals(user.getId())) {
            return user1Exited;
        }

        if (user2.getId().equals(user.getId())) {
            return user2Exited;
        }

        throw new IllegalArgumentException("User is not a participant: " + user.getId());
    }

    public void restoreFor(User initiator) {
        if (user1.getId().equals(initiator.getId())) {
            this.user1Exited = false;
            return;
        }

        if (user2.getId().equals(initiator.getId())) {
            this.user2Exited = false;
            return;
        }

        throw new IllegalArgumentException("User is not a participant: " + initiator.getId());
    }
}