package com.devnear.web.domain.chat;

import com.devnear.web.domain.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @EntityGraph(attributePaths = {"sender"})
    List<ChatMessage> findAllByChatRoomOrderByCreatedAtAsc(ChatRoom chatRoom);

    @EntityGraph(attributePaths = {"sender"})
    Page<ChatMessage> findByChatRoomOrderByCreatedAtAsc(ChatRoom chatRoom, Pageable pageable);

    Optional<ChatMessage> findTopByChatRoomOrderByCreatedAtDesc(ChatRoom chatRoom);

    long countByChatRoomAndSenderNotAndIsReadFalse(ChatRoom chatRoom, User user);

    List<ChatMessage> findByChatRoomAndSenderNotAndIsReadFalse(ChatRoom chatRoom, User user);

    @Query(value = "SELECT m.* FROM chat_messages m " +
            "JOIN (SELECT chat_room_id, MAX(created_at) AS last_at FROM chat_messages WHERE chat_room_id IN :roomIds GROUP BY chat_room_id) lm " +
            "ON m.chat_room_id = lm.chat_room_id AND m.created_at = lm.last_at",
            nativeQuery = true)
    List<ChatMessage> findLastMessagesForChatRooms(@Param("roomIds") List<Long> roomIds);

    @Query(value = "SELECT chat_room_id AS room_id, COUNT(*) AS cnt FROM chat_messages " +
            "WHERE chat_room_id IN :roomIds AND is_read = false AND sender_id <> :meId " +
            "GROUP BY chat_room_id",
            nativeQuery = true)
    List<Object[]> countUnreadByChatRoomIn(@Param("roomIds") List<Long> roomIds, @Param("meId") Long meId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ChatMessage m WHERE m.chatRoom.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);

    @EntityGraph(attributePaths = {"sender"})
    Page<ChatMessage> findByChatRoomOrderByCreatedAtDesc(ChatRoom chatRoom, Pageable pageable);

    // 읽음 처리 bulk update
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE ChatMessage m
        SET m.isRead = true
        WHERE m.chatRoom = :room
          AND m.sender <> :user
          AND m.isRead = false
    """)
    int markAllAsRead(@Param("room") ChatRoom room, @Param("user") User user);
}