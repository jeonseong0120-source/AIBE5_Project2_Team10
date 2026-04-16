package com.devnear.web.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ClientGrade {
    NORMAL("일반"),
    SILVER("실버"),
    GOLD("골드"),
    PLATINUM("플래티넘");

    private final String description;
}
