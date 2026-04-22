package com.devnear.web.domain.project;

import com.devnear.web.domain.enums.ProjectStatus;
import lombok.Data;

import java.util.List;

@Data // Lombok을 사용하면 Getter, Setter가 자동 생성됩니다.
public class ProjectSearchCond {
    private String keyword;
    private List<Long> skillIds;
    private List<String> skillNames;
    private ProjectStatus status;
    private Boolean online;
    private Boolean offline;
    private String location;
    private Long excludeOwnerUserId;
}