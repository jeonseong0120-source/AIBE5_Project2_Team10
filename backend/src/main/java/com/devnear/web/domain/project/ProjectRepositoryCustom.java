package com.devnear.web.domain.project;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProjectRepositoryCustom {
    Page<Project> search(ProjectSearchCond cond, Pageable pageable);
}