package com.devnear.web.domain.client;

import com.devnear.web.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientProfileRepository extends JpaRepository<ClientProfile, Long> {

    Optional<ClientProfile> findByUser_Id(Long userId);

    boolean existsByUser(User user);

    boolean existsByBn(String bn);

    boolean existsByBnAndIdNot(String bn, Long id);
}