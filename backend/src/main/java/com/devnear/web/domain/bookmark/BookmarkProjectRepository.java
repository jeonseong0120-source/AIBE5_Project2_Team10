package com.devnear.web.domain.bookmark;

import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.project.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookmarkProjectRepository extends JpaRepository<BookmarkProject, Long> {
    Optional<BookmarkProject> findByFreelancerProfileAndProject(FreelancerProfile freelancerProfile, Project project);
    Page<BookmarkProject> findAllByFreelancerProfile(FreelancerProfile freelancerProfile, Pageable pageable);
    boolean existsByFreelancerProfileAndProject(FreelancerProfile freelancerProfile, Project project);
}
