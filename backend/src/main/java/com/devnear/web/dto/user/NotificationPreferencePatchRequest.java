package com.devnear.web.dto.user;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class NotificationPreferencePatchRequest {
    private Boolean notifyCommunityComments;
}
