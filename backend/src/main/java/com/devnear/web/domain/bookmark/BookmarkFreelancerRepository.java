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

    @EntityGraph(attributePaths = {"freelancerProfile", "freelancerProfile.user"})
    Page<BookmarkFreelancer> findAllByClientProfile(ClientProfile clientProfile, Pageable pageable);
}

