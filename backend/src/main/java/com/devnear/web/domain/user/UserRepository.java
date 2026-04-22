package com.devnear.web.domain.user;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // 이메일로 가입된 회원이 있는지 찾는 기능 (로그인/중복체크용)
    Optional<User> findByEmail(String email);

    /**
     * 회원 탈퇴 등 동시성 제어가 필요할 때 같은 {@code users} 행에 대해 배타 락을 겁니다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.email = :email")
    Optional<User> findByEmailForUpdate(@Param("email") String email);

    // 닉네임 중복 체크용
    boolean existsByNickname(String nickname);
    
    // 특정 유저 ID를 제외하고 닉네임 중복 체크용
    boolean existsByNicknameAndIdNot(String nickname, Long id);
}
