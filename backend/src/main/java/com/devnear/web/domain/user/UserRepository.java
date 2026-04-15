package com.devnear.web.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // 이메일로 가입된 회원이 있는지 찾는 기능 (로그인/중복체크용)
    Optional<User> findByEmail(String email);

    // 닉네임 중복 체크용
    boolean existsByNickname(String nickname);
    
    // 특정 유저 ID를 제외하고 닉네임 중복 체크용
    boolean existsByNicknameAndIdNot(String nickname, Long id);
}
