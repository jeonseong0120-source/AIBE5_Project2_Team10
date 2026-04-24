package com.devnear.web.domain.bookmark;

import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.project.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BookmarkProjectRepository extends JpaRepository<BookmarkProject, Long> {
    Optional<BookmarkProject> findByFreelancerProfileAndProject(FreelancerProfile freelancerProfile, Project project);

    @EntityGraph(attributePaths = {
            "project",
            "project.clientProfile",
            "project.clientProfile.user"
    })
    Page<BookmarkProject> findAllByFreelancerProfile(FreelancerProfile freelancerProfile, Pageable pageable);
    boolean existsByFreelancerProfile_IdAndProject_Id(Long profileId, Long projectId);

    @Query("SELECT b.project.id FROM BookmarkProject b WHERE b.freelancerProfile.id = :profileId AND b.project.id IN :projectIds")
    java.util.List<Long> findBookmarkedProjectIdsByProfileIdAndProjectIds(@Param("profileId") Long profileId, @Param("projectIds") java.util.List<Long> projectIds);

    @Query("SELECT b.project.id FROM BookmarkProject b WHERE b.freelancerProfile.id = :freelancerProfileId")
    java.util.List<Long> findBookmarkedProjectIds(@Param("freelancerProfileId") Long freelancerProfileId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM BookmarkProject b WHERE b.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
}
