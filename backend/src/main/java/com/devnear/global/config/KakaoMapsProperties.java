package com.devnear.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "kakao.maps")
@Getter
@Setter
public class KakaoMapsProperties {
    private String apiKey;
    private String restApiKey;
}
