package com.devnear.web.service.community;

import com.devnear.web.domain.community.CommunityComment;
import com.devnear.web.domain.community.CommunityCommentRepository;
import com.devnear.web.domain.community.CommunityPost;
import com.devnear.web.domain.community.CommunityPostRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.dto.community.CommunityCommentCreateRequest;
import com.devnear.web.dto.community.CommunityCommentResponse;
import com.devnear.web.dto.community.CommunityCommentUpdateRequest;
import com.devnear.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityCommentService {

    private final CommunityCommentRepository communityCommentRepository;
    private final CommunityPostService communityPostService;
    private final CommunityPostRepository communityPostRepository;
    private final UserRepository userRepository;

    @Transactional
    public Long create(CommunityCommentCreateRequest request, Long authorId) {
        if (request.getPostId() == null) {
            throw new IllegalArgumentException("게시글 ID는 필수입니다.");
        }
        if (authorId == null) {
            throw new IllegalArgumentException("작성자 ID는 필수입니다.");
        }
        validateCommentRequest(request.getContent());
        CommunityPost post = communityPostService.getPost(request.getPostId());

        CommunityComment comment = new CommunityComment(post.getId(), authorId, request.getContent());
        Long commentId = communityCommentRepository.save(comment).getId();
        communityPostRepository.incrementCommentCount(post.getId());
        return commentId;
    }

    public List<CommunityCommentResponse> findByPostId(Long postId) {
        communityPostService.getPost(postId);
        List<CommunityComment> comments = communityCommentRepository.findByPostIdOrderByIdAsc(postId);
        if (comments.isEmpty()) {
            return List.of();
        }
        Set<Long> authorIds = comments.stream()
                .map(CommunityComment::getAuthorId)
                .collect(Collectors.toSet());
        Map<Long, String> nicknameByUserId = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, User::getNickname));

        return comments.stream()
                .map(c -> new CommunityCommentResponse(
                        c,
                        nicknameByUserId.getOrDefault(c.getAuthorId(), "알 수 없는 사용자")
                ))
                .toList();
    }

    @Transactional
    public void update(Long commentId, CommunityCommentUpdateRequest request, Long userId) {
        validateCommentRequest(request.getContent());
        CommunityComment comment = getComment(commentId);
        validateAuthor(comment.getAuthorId(), userId);
        comment.update(request.getContent());
    }

    @Transactional
    public void delete(Long commentId, Long userId) {
        CommunityComment comment = getComment(commentId);
        validateAuthor(comment.getAuthorId(), userId);

        Long postId = comment.getPostId();
        communityCommentRepository.delete(comment);
        communityPostRepository.decrementCommentCount(postId);
    }

    private CommunityComment getComment(Long commentId) {
        return communityCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("댓글이 없습니다."));
    }

    private void validateCommentRequest(String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("댓글 내용은 비어 있을 수 없습니다.");
        }
    }

    private void validateAuthor(Long authorId, Long userId) {
        if (!authorId.equals(userId)) {
            throw new AccessDeniedException("작성자만 수정 또는 삭제할 수 있습니다.");
        }
    }
}