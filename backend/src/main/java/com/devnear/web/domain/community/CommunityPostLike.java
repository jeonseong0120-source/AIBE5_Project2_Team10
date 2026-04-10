package com.devnear.web.domain.community;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "community_post_likes",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_post_user_like", columnNames = {"post_id", "user_id"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommunityPostLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_like_id")
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    public CommunityPostLike(Long postId, Long userId) {
        this.postId = postId;
        this.userId = userId;
    }
}
