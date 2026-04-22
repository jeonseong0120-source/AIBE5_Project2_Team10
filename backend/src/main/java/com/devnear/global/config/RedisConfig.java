package com.devnear.global.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.SerializationException;
import java.time.Duration;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // 1. 보안이 강화된 ObjectMapper 설정
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());

        // 🎯 [보안 강화] 모든 클래스(Object.class) 허용은 RCE 공격의 통로가 됨
        // 우리 프로젝트 내의 클래스와 날짜 관련 타입만 직렬화되도록 화이트리스트를 지정
        BasicPolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                .allowIfSubType("com.devnear.") // 우리 패키지 허용
                .allowIfSubType("java.time.")   // 날짜 타입 허용
                .allowIfSubType("java.util.")   // 컬렉션 등 허용
                .allowIfSubType("org.springframework.security.") // 시큐리티 권한 객체 등 허용
                .build();

        mapper.activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.NON_FINAL, JsonTypeInfo.As.PROPERTY);

        // 2. 커스텀 Serializer (SecurityUser 등의 DTO 처리에 최적화)
        RedisSerializer<Object> customSerializer = new RedisSerializer<>() {
            @Override
            public byte[] serialize(Object value) throws SerializationException {
                if (value == null) return new byte[0];
                try {
                    return mapper.writeValueAsBytes(value);
                } catch (Exception e) {
                    throw new SerializationException("직렬화 실패", e);
                }
            }

            @Override
            public Object deserialize(byte[] bytes) throws SerializationException {
                if (bytes == null || bytes.length == 0) return null;
                try {
                    // Object.class로 읽더라도 mapper가 타입 정보를(@class) 보고 타당하게 변환하지만,
                    // 보안 화이트리스트가 ptv에서 이미 걸러주므로 현재 방식도 안전
                    return mapper.readValue(bytes, Object.class);
                } catch (Exception e) {
                    throw new SerializationException("역직렬화 실패: 데이터 구조가 바뀌었을 수 있습니다.", e);
                }
            }
        };

// 3. 캐시 상세 설정
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                // .disableCachingNullValues() // 👈 [고민 포인트]
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(RedisSerializer.string()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(customSerializer));
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .transactionAware()
                .build();
    }
}