package com.devnear.web.domain.enums;

/**
 * [보고] 애플리케이션 내 사용자의 권한(역할)을 정의하는 Enum 클래스.
 * Spring Security의 권한 검증(GrantedAuthority)과 연동하여 사용됨.
 */
public enum Role {
    // [추가] 소셜 로그인 직후 온보딩 절차(닉네임, 권한 선택)를 거치지 않은 임시 상태의 권한
    GUEST,
    // [보고] 서비스를 의뢰하는 일반 클라이언트 사용자 권한.
    CLIENT,      
    // [보고] 서비스를 제공하는 프리랜서 사용자 권한.
    FREELANCER,  
    // [보고] 의뢰와 제공을 동시에 수행하는 겸업 사용자 권한.
    BOTH         
}
