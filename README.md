# 🚀 DevNear (AI 기반 지역·재능 매칭 플랫폼)

<p align="center">
  <img width="633" height="298" alt="image" src="https://github.com/user-attachments/assets/5c21e5b1-72f7-42b5-987b-0c6f87d31d2f" />

## 📌 프로젝트 개요
🌍 "우리 동네에서 딱 맞는 재능을 찾다, DevNear"

기존의 대형 프리랜서 플랫폼은 '직무' 중심의 거대 카테고리로 묶여 있어, 사용자가 원하는 **세부적인 기술(Niche Skill)**을 가진 전문가를 찾기 위해 수많은 포트폴리오를 직접 검토해야 하는 **'탐색 비용'**이 큽니다. 또한, 신뢰 기반의 협업을 원하는 사용자들에게 **'물리적 거리'**는 중요한 요소임에도 불구하고 이를 정교하게 필터링해 주는 서비스는 부족합니다.

DevNear는 이러한 불편함을 하이브리드 AI 매칭 엔진으로 해결합니다. 사용자의 요구사항을 AI가 문맥적으로 이해(Gemini Embedding)하고, 예산·지역·근무 형태를 다각도로 분석하여 최적의 파트너를 상단에 배치함으로써 매칭의 질을 혁신적으로 높였습니다.

🔍 핵심 문제 정의 (Problem Statement)

검색의 한계: "자바 개발자" 검색 시 수만 명의 결과가 노출되어, 실제 필요한 '스프링 시큐리티 전문가'를 찾기까지 과도한 시간이 소요됨

로컬 협업의 부재: 오프라인 미팅이 필요한 단기 프로젝트의 경우에도 지역 기반 필터링이 미비하여 거리 조율에 어려움을 겪음

검증 데이터의 파편화: 단순히 이력서만으로는 실제 협업 시의 태도나 실력을 신뢰하기 어려움

💡 솔루션 및 핵심 가치 (Solution & Core Value)

지능형 자동 추천: 사용자가 공고를 올리는 순간, 추천 엔진이 후보군을 0.1초 내에 분석하여 매칭 점수가 높은 순으로 큐레이션합니다.

하이퍼 로컬(Hyper-local) 매칭: GPS 좌표 기반의 정밀 거리 계산을 통해 "가장 가까운 곳에 있는 유능한 파트너"를 연결합니다.

데이터 기반 신뢰 구축: 리뷰 데이터에 비관적 락(Pessimistic Lock)을 적용한 무결성 보장 및 자동 등급 산정 엔진으로 신뢰 지표를 객관화합니다.

👥 타겟 사용자 (Target Audience)

클라이언트: 구체적인 기술 스택을 가진 파트너를 빠르게 찾고 싶은 스타트업 및 개인 발주자

프리랜서: 자신의 세부 재능을 인정받고, 가급적 가까운 지역 내에서 안정적인 협업 기회를 잡고 싶은 전문가

- 개발 기간: 2026.04.15 ~ 2026.04.27  
- 참여 인원: 4명  

---

## 👨‍💻 팀원 및 역할

### 🧑🏻‍💻 전성 (jeonseong0120,922)
- 전체 시스템 아키텍처 설계
- 핵심 도메인 및 비즈니스 로직 구현
- 규칙 기반 자동 매칭 알고리즘 설계 및 구현
- JWT + OAuth2 기반 인증 시스템 구축 (Stateless)
- Redis 기반 UserContext 캐싱 도입
- Docker 개발 환경 구축
- GitHub PR 기반 협업 관리 및 코드 리뷰
- 프론트: 랜딩페이지, 온보딩, 대시보드 UI 구현

---

### 🛠️ 이준영 (leejy1019)
- 프리랜서 도메인 전체 구현
- 마이페이지, 리뷰, 포트폴리오 기능 개발
- N+1 문제 해결 및 Fetch Join 최적화
- DB 인덱싱 기반 조회 성능 개선
- Toss 결제 시스템 연동 및 동시성 제어
- Cloudinary 이미지 업로드 시스템 구축

---

### 💬 윤규식 (GyuSikYoon)
- WebSocket 기반 실시간 채팅 시스템 구현 (STOMP)
- 메시지 읽음 처리 및 페이징 처리
- 리뷰 기반 등급 자동 갱신 시스템 (비관적 락 적용)
- 커뮤니티 게시글 및 댓글 시스템 최적화

---

### 📱 김세준 (warcat12)
- 클라이언트 도메인 및 프로젝트 제안 기능 구현
- AI 추천 시스템 및 검색 필터 개선
- 실시간 알림 시스템 구현
- 테스트용 벌크 데이터 구축
- CodeRabbit 기반 코드 품질 개선 및 버그 수정
- 공통 UI 컴포넌트 및 UX 개선

---

## 📘 기획 및 컨셉

### 🔍 문제점
- 직무 중심 구조 → 세분화된 재능 표현 어려움
- 키워드 검색 기반 → 사용자 탐색 피로도 증가
- 신뢰도 판단 지표 부족
- 오프라인 협업 파트너 찾기 어려움

---

### 💡 해결 전략
- 재능 태그 기반 구조 도입
- AI + 규칙 기반 하이브리드 추천
- 지역 기반 필터링
- 리뷰 기반 자동 등급 시스템

---

## 🎯 핵심 기술 및 기능

### 1️⃣ Stateless 인증 & 성능 최적화
- JWT + OAuth2 인증 구조
- Redis UserContext 캐싱
- DB 조회 횟수 약 80% 감소

---

### 2️⃣ 하이브리드 AI 추천 시스템
- 텍스트 임베딩 기반 데이터 구조 설계
- 규칙 기반 스코어링 알고리즘

#### 📊 매칭 점수 구성
- 스킬 유사도 (36%) — Jaccard
- 예산 적합도 (26%)
- 지역 (20%)
- 근무 형태 (18%)

+ 추가 가중치: 사용자 평점

---

### 3️⃣ 실시간 시스템 & 동시성 제어
- WebSocket 기반 1:1 채팅 (STOMP)
- 메시지 읽음 처리 및 페이징
- 비관적 락 적용 (결제 / 등급 시스템)

---

### 4️⃣ UX 및 커뮤니티
- 클라이언트 ↔ 프리랜서 모드 즉시 전환
- 커뮤니티 게시판 + 좋아요 동기화
- 실시간 알림 시스템

---

## ⚙️ 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind |
| Backend | Spring Boot 3, Java 17, JPA |
| DB/Cache | MySQL, Redis |
| Infra | Docker |
| AI | Gemini API |
| External | Cloudinary, Toss Payments |
| DevOps | GitHub Actions, CodeRabbit |

---

## 🧭 협업 컨벤션

### 🌿 브랜치 전략

feat/#1-feature-name
fix/#2-bug-fix
docs/#3-readme


---

### 🚫 main 정책
- main 직접 push 금지
- PR 기반 merge 필수
- CodeRabbit + 팀원 리뷰 후 merge

---

## 🔐 환경 변수


DB_URL=
DB_USERNAME=
DB_PASSWORD=

REDIS_HOST=
REDIS_PORT=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GEMINI_API_KEY=
CLOUDINARY_URL=

JWT_SECRET=
JWT_EXPIRATION_MS=


---


## 🏗️ 시스템 아키텍처 (System Architecture)
  <img width="1728" height="1117" alt="image" src="https://github.com/user-attachments/assets/9051fdb3-760c-4e1a-987c-a50e52e5373a" />


### 📌 아키텍처 설명
- **Frontend (Next.js)**: 사용자 인터페이스 및 API 요청 처리
- **Security Layer**: JWT 기반 인증 및 Redis UserContext 캐싱
- **Backend (Spring Boot)**: 비즈니스 로직 및 추천 엔진 처리
- **Data Layer**: MySQL + Redis 기반 데이터 관리
- **External API**: Gemini API를 활용한 텍스트 임베딩

> ✔ Redis 기반 UserContext 캐싱으로 불필요한 DB 접근 최소화  
> ✔ Rule-based + AI Embedding 구조의 하이브리드 추천 시스템  
> ✔ WebSocket(STOMP) 기반 실시간 통신 처리

---

---

## 📍 향후 개선 방향 (Roadmap)

- 코사인 유사도 기반 추천 고도화
- 분산 락 도입 (Redis / Redisson)
- AWS 기반 클라우드 배포
- 무중단 배포 파이프라인 구축
- 악성 유저 탐지 시스템

---
