package com.devnear.web.domain.bookmark;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookmarkFreelancerRepository extends JpaRepository<BookmarkFreelancer, Long> {

    boolean existsByClientProfileAndFreelancerProfile(ClientProfile clientProfile, FreelancerProfile freelancerProfile);

    Optional<BookmarkFreelancer> findByClientProfileAndFreelancerProfile(ClientProfile clientProfile, FreelancerProfile freelancerProfile);

    /**
     * OneToMany(스킬)까지 그래프에 넣으면 {@code Page}와 함께 쓸 때 Hibernate가 DB LIMIT 대신 메모리 페이징(HHH90003004)을 할 수 있어,
     * ManyToOne/OneToOne만 그래프로 묶고 스킬은 {@code default_batch_fetch_size} 배치 로딩에 맡깁니다.
     */
    @EntityGraph(attributePaths = {
            "freelancerProfile",
            "freelancerProfile.user"
    })
    Page<BookmarkFreelancer> findAllByClientProfile(ClientProfile clientProfile, Pageable pageable);
}

