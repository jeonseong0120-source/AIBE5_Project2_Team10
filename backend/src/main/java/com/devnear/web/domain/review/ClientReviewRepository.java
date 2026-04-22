package com.devnear.web.domain.review;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClientReviewRepository extends JpaRepository<ClientReview, Long> {

    boolean existsByProjectIdAndReviewerFreelancerAndClient(Long projectId,
                                                            FreelancerProfile reviewerFreelancer,
                                                            ClientProfile client);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"reviewerFreelancer", "reviewerFreelancer.user"})
    List<ClientReview> findByClient(ClientProfile client);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ClientReview r WHERE r.projectId = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
}