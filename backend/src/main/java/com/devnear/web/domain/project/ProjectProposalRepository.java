package com.devnear.web.domain.project;

import com.devnear.web.domain.enums.ProjectProposalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProjectProposalRepository extends JpaRepository<ProjectProposal, Long> {

    boolean existsByProject_IdAndFreelancerProfile_IdAndStatus(
            Long projectId,
            Long freelancerProfileId,
            ProjectProposalStatus status);

    @EntityGraph(attributePaths = {
            "project",
            "project.clientProfile",
            "project.clientProfile.user",
            "freelancerProfile",
            "freelancerProfile.user"
    })
    Page<ProjectProposal> findByProject_ClientProfile_IdOrderByCreatedAtDesc(Long clientProfileId, Pageable pageable);

    @EntityGraph(attributePaths = {
            "project",
            "project.clientProfile",
            "project.clientProfile.user",
            "freelancerProfile",
            "freelancerProfile.user"
    })
    Page<ProjectProposal> findByFreelancerProfile_IdOrderByCreatedAtDesc(Long freelancerProfileId, Pageable pageable);

    @EntityGraph(attributePaths = {
            "project",
            "project.clientProfile",
            "project.clientProfile.user",
            "freelancerProfile",
            "freelancerProfile.user"
    })
    @Query("select p from ProjectProposal p where p.id = :id")
    Optional<ProjectProposal> findDetailedById(@Param("id") Long id);
}
