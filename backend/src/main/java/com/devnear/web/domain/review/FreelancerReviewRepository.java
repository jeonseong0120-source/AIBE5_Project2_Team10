package com.devnear.web.domain.review;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FreelancerReviewRepository extends JpaRepository<FreelancerReview, Long> {

    boolean existsByProjectIdAndReviewerClientAndFreelancer(Long projectId,
                                                            ClientProfile reviewerClient,
                                                            FreelancerProfile freelancer);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"reviewerClient", "reviewerClient.user"})
    List<FreelancerReview> findByFreelancer(FreelancerProfile freelancer);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM FreelancerReview r WHERE r.projectId = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
}