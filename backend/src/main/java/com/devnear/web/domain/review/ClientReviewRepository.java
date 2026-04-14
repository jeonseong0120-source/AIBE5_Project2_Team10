package com.devnear.web.domain.review;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClientReviewRepository extends JpaRepository<ClientReview, Long> {

    boolean existsByProjectIdAndReviewerFreelancerAndClient(Long projectId,
                                                            FreelancerProfile reviewerFreelancer,
                                                            ClientProfile client);

    List<ClientReview> findByClient(ClientProfile client);
}