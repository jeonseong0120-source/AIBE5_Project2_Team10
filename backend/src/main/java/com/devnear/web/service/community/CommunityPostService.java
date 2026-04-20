package com.devnear.web.service.community;

import com.devnear.web.domain.community.CommunityPost;
import com.devnear.web.domain.community.CommunityPostLike;
import com.devnear.web.domain.community.CommunityPostLikeRepository;
import com.devnear.web.domain.community.CommunityPostRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.dto.community.CommunityLikeResponse;
import com.devnear.web.dto.community.CommunityPostCreateRequest;
import com.devnear.web.dto.community.CommunityPostPageResponse;
import com.devnear.web.dto.community.CommunityPostResponse;
import com.devnear.web.dto.community.CommunityPostUpdateRequest;
import com.devnear.web.exception.ResourceConflictException;
import com.devnear.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityPostService {

    private final CommunityPostRepository communityPostRepository;
    private final CommunityPostLikeRepository communityPostLikeRepository;
    private final UserRepository userRepository;

    @Transactional
    public Long create(CommunityPostCreateRequest request, Long authorId) {
        validatePostRequest(request.getTitle(), request.getContent());
        CommunityPost post = new CommunityPost(request.getTitle(), request.getContent(), authorId);
        return communityPostRepository.save(post).getId();
    }

    public CommunityPostPageResponse findAll(String keyword, String sort, Pageable pageable) {
        Page<CommunityPost> postPage;

        if (keyword != null && !keyword.isBlank()) {
            postPage = communityPostRepository
                    .findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(keyword, keyword, pageable);
        } else if ("popular".equalsIgnoreCase(sort)) {
            postPage = communityPostRepository.findAllByOrderByLikeCountDescIdDesc(pageable);
        } else {
            postPage = communityPostRepository.findAllByOrderByIdDesc(pageable);
        }

        List<CommunityPost> posts = postPage.getContent();
        Map<Long, String> nicknamesByUserId = userRepository.findAllById(
                        posts.stream().map(CommunityPost::getAuthorId).distinct().toList()
                ).stream()
                .collect(Collectors.toMap(User::getId, User::getNickname));

        List<CommunityPostResponse> content = posts.stream()
                .map(post -> new CommunityPostResponse(
                        post,
                        nicknamesByUserId.getOrDefault(post.getAuthorId(), "알 수 없음"),
                        false
                ))
                .toList();

        return new CommunityPostPageResponse(
                content,
                postPage.getNumber(),
                postPage.getSize(),
                postPage.getTotalElements(),
                postPage.getTotalPages()
        );
    }
    
     @Transactional
        public CommunityPostResponse findById(Long postId, Long userId) {
            communityPostRepository.incrementViewCount(postId);
            CommunityPost post = getPost(postId);

            boolean isLiked = false;
            if (userId != null) {
                isLiked = communityPostLikeRepository.existsByPostIdAndUserId(postId, userId);
            }

            String nickname = getNickname(post.getAuthorId());
            return new CommunityPostResponse(post, nickname, isLiked);
        }

    @Transactional
    public void update(Long postId, CommunityPostUpdateRequest request, Long userId) {
        validatePostRequest(request.getTitle(), request.getContent());
        CommunityPost post = getPost(postId);
        validateAuthor(post.getAuthorId(), userId);
        post.update(request.getTitle(), request.getContent());
    }

    @Transactional
    public void delete(Long postId, Long userId) {
        CommunityPost post = getPost(postId);
        validateAuthor(post.getAuthorId(), userId);
        communityPostRepository.delete(post);
    }

    @Transactional
    public CommunityLikeResponse like(Long postId, Long userId) {
        CommunityPost post = getPost(postId);

        try {
            communityPostLikeRepository.save(new CommunityPostLike(postId, userId));
            communityPostRepository.incrementLikeCount(postId);
            return new CommunityLikeResponse(true, post.getLikeCount() + 1);
        } catch (DataIntegrityViolationException e) {
            throw new ResourceConflictException("이미 좋아요를 누른 게시글입니다.");
        }
    }

    @Transactional
    public CommunityLikeResponse cancelLike(Long postId, Long userId) {
        CommunityPost post = getPost(postId);

        int deletedCount = communityPostLikeRepository.deleteByPostIdAndUserId(postId, userId);
        if (deletedCount == 0) {
            throw new ResourceNotFoundException("좋아요 기록이 없습니다.");
        }

        communityPostRepository.decrementLikeCount(postId);
        return new CommunityLikeResponse(true, post.getLikeCount() > 0 ? post.getLikeCount() - 1 : 0);
    }

    CommunityPost getPost(Long postId) {
        return communityPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("게시글이 없습니다."));
    }

    private String getNickname(Long userId) {
        return userRepository.findById(userId)
                .map(User::getNickname)
                .orElse("알 수 없음");
    }

    private void validatePostRequest(String title, String content) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("제목은 비어 있을 수 없습니다.");
        }
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("내용은 비어 있을 수 없습니다.");
        }
    }

    private void validateAuthor(Long authorId, Long userId) {
        if (!authorId.equals(userId)) {
            throw new AccessDeniedException("작성자만 수정 또는 삭제할 수 있습니다.");
        }
    }
}