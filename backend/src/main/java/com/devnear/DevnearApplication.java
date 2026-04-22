package com.devnear;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableJpaAuditing // 바로 이 줄이 핵심입니다!
@EnableScheduling
@SpringBootApplication
public class DevnearApplication {

    public static void main(String[] args) {
        SpringApplication.run(DevnearApplication.class, args);
    }

}