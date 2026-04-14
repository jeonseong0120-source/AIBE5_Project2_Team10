package com.devnear.web.domain.review;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FreelancerReviewRepository extends JpaRepository<FreelancerReview, Long> {

    boolean existsByProjectIdAndReviewerClientAndFreelancer(Long projectId,
                                                            ClientProfile reviewerClient,
                                                            FreelancerProfile freelancer);

    List<FreelancerReview> findByFreelancer(FreelancerProfile freelancer);
}