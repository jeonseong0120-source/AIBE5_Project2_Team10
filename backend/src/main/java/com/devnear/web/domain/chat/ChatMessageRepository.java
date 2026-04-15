package com.devnear.web.domain.chat;

import com.devnear.web.domain.user.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 특정 채팅방의 전체 메시지를 오래된 순서부터 조회
    @EntityGraph(attributePaths = {"sender"})
    List<ChatMessage> findAllByChatRoomOrderByCreatedAtAsc(ChatRoom chatRoom);

    // 마지막 메시지 1개 조회
    // 채팅방 목록에서 미리보기용으로 사용
    Optional<ChatMessage> findTopByChatRoomOrderByCreatedAtDesc(ChatRoom chatRoom);

    // 내가 보낸 메시지를 제외하고, 아직 안 읽은 메시지 개수 조회
    long countByChatRoomAndSenderNotAndIsReadFalse(ChatRoom chatRoom, User user);

    // 내가 받은 메시지 중 아직 안 읽은 메시지들 조회
    List<ChatMessage> findByChatRoomAndSenderNotAndIsReadFalse(ChatRoom chatRoom, User user);
}