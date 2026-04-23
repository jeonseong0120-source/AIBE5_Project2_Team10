package com.devnear.web.domain.chat;

import com.devnear.web.domain.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 특정 채팅방의 전체 메시지를 오래된 순서부터 조회 (불필요한 대용량 조회용, 가능하면 페이지 사용)
    @EntityGraph(attributePaths = {"sender"})
    List<ChatMessage> findAllByChatRoomOrderByCreatedAtAsc(ChatRoom chatRoom);

    // Pageable variant for bounded queries
    @EntityGraph(attributePaths = {"sender"})
    Page<ChatMessage> findByChatRoomOrderByCreatedAtAsc(ChatRoom chatRoom, Pageable pageable);

    // 마지막 메시지 1개 조회
    // 채팅방 목록에서 미리보기용으로 사용
    Optional<ChatMessage> findTopByChatRoomOrderByCreatedAtDesc(ChatRoom chatRoom);

    // 내가 보낸 메시지를 제외하고, 아직 안 읽은 메시지 개수 조회
    long countByChatRoomAndSenderNotAndIsReadFalse(ChatRoom chatRoom, User user);

    // 내가 받은 메시지 중 아직 안 읽은 메시지들 조회
    List<ChatMessage> findByChatRoomAndSenderNotAndIsReadFalse(ChatRoom chatRoom, User user);

    // Bulk: 가장 최근 메시지들을 여러 채팅방에 대해 한 번에 조회 (네이티브 쿼리)
    @Query(value = "SELECT m.* FROM chat_messages m " +
            "JOIN (SELECT chat_room_id, MAX(created_at) AS last_at FROM chat_messages WHERE chat_room_id IN :roomIds GROUP BY chat_room_id) lm " +
            "ON m.chat_room_id = lm.chat_room_id AND m.created_at = lm.last_at",
            nativeQuery = true)
    List<ChatMessage> findLastMessagesForChatRooms(@Param("roomIds") List<Long> roomIds);

    // Bulk: 채팅방별 읽지 않은 메시지 개수 (sender != :meId)
    @Query(value = "SELECT chat_room_id AS room_id, COUNT(*) AS cnt FROM chat_messages " +
            "WHERE chat_room_id IN :roomIds AND is_read = false AND sender_id <> :meId " +
            "GROUP BY chat_room_id",
            nativeQuery = true)
    List<Object[]> countUnreadByChatRoomIn(@Param("roomIds") List<Long> roomIds, @Param("meId") Long meId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ChatMessage m WHERE m.chatRoom.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);



    // 👇 이거 추가 (내림차순)
    @EntityGraph(attributePaths = {"sender"})
    Page<ChatMessage> findByChatRoomOrderByCreatedAtDesc(ChatRoom chatRoom, Pageable pageable);
}
