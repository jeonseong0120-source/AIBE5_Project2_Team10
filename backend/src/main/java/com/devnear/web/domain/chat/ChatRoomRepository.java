package com.devnear.web.domain.chat;

import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.user.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // 특정 프로젝트 안에서 user1, user2 조합의 채팅방이 있는지 찾기
    // EntityGraph를 사용해서 user, project를 함께 가져오면 N+1 문제를 줄일 수 있음
    @EntityGraph(attributePaths = {"user1", "user2", "project", "project.clientProfile", "project.freelancerProfile"})
    Optional<ChatRoom> findByProjectAndUser1AndUser2(Project project, User user1, User user2);

    // 내가 참여한 모든 채팅방 조회
    // user1 또는 user2 중 하나라도 나이면 조회
    // updatedAt 기준 최신순 정렬
    @EntityGraph(attributePaths = {"user1", "user2", "project"})
    List<ChatRoom> findAllByUser1OrUser2OrderByUpdatedAtDesc(User user1, User user2);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ChatRoom c WHERE c.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
}