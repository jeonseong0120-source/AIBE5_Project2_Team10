package com.devnear.web.domain.user;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * [N+1 해결 버전] 이메일로 회원을 조회합니다.
     * @EntityGraph를 사용하여 연관된 프로필들을 한 번의 LEFT JOIN으로 함께 가져옵니다.
     * 이로 인해 '유저 조회 1번 + 프로필 조회 N번'이 나가는 현상을 원천 차단합니다.
     */
    @EntityGraph(attributePaths = {"freelancerProfile", "clientProfile"})
    Optional<User> findByEmail(String email);

    // 닉네임 중복 체크용
    boolean existsByNickname(String nickname);

    // 특정 유저 ID를 제외하고 닉네임 중복 체크용
    boolean existsByNicknameAndIdNot(String nickname, Long id);
}