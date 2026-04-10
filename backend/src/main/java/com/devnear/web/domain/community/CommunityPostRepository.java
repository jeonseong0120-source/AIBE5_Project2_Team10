package com.devnear.web.domain.community;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    List<CommunityPost> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrderByIdDesc(String titleKeyword, String contentKeyword);
    List<CommunityPost> findAllByOrderByIdDesc();
    List<CommunityPost> findAllByOrderByLikeCountDescIdDesc();

    // Paginated queries
    Page<CommunityPost> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(String titleKeyword, String contentKeyword, Pageable pageable);
    Page<CommunityPost> findAllByOrderByIdDesc(Pageable pageable);
    Page<CommunityPost> findAllByOrderByLikeCountDescIdDesc(Pageable pageable);

    // Atomic counter updates
    @Modifying
    @Query("UPDATE CommunityPost p SET p.likeCount = p.likeCount + 1 WHERE p.id = :postId")
    int incrementLikeCount(@Param("postId") Long postId);

    @Modifying
    @Query("UPDATE CommunityPost p SET p.likeCount = p.likeCount - 1 WHERE p.id = :postId AND p.likeCount > 0")
    int decrementLikeCount(@Param("postId") Long postId);

    @Modifying
    @Query("UPDATE CommunityPost p SET p.viewCount = p.viewCount + 1 WHERE p.id = :postId")
    int incrementViewCount(@Param("postId") Long postId);

    @Modifying
    @Query("UPDATE CommunityPost p SET p.commentCount = p.commentCount + 1 WHERE p.id = :postId")
    int incrementCommentCount(@Param("postId") Long postId);

    @Modifying
    @Query("UPDATE CommunityPost p SET p.commentCount = p.commentCount - 1 WHERE p.id = :postId AND p.commentCount > 0")
    int decrementCommentCount(@Param("postId") Long postId);
}