package com.devnear.web.domain.freelancer;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FreelancerGradeRepository extends JpaRepository<FreelancerGrade, Long> {
    Optional<FreelancerGrade> findByName(String name);
}
