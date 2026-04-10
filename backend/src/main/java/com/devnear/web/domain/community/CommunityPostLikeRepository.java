package com.devnear.web.domain.community;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPostLikeRepository extends JpaRepository<CommunityPostLike, Long> {
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    int deleteByPostIdAndUserId(Long postId, Long userId);
}