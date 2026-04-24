# 통합 테스트 & 쿼리 카운트 가이드

백엔드 `src/test`에서 **N+1·과다 SELECT 회귀**를 줄이기 위해 JDBC 실행 횟수를 세는 도구가 있습니다. 클라이언트뿐 아니라 **프리랜서·포트폴리오** 등 다른 도메인에도 같은 패턴으로 확장할 수 있습니다.

## 구성 요소

| 위치 | 역할 |
|------|------|
| `com.devnear.test.support.QueryCountHolder` | 스레드 단위로 `SELECT` / 전체 JDBC 실행 횟수 카운트 |
| `com.devnear.test.support.QueryCountingDataSource` | `dataSource` 빈을 감싸 실행을 기록 |
| `com.devnear.test.support.QueryCountExtension` | 각 테스트 전후로 홀더 초기화·종료 시 `[쿼리카운트]` 한 줄 출력 |
| `com.devnear.test.config.QueryCountingTestConfiguration` | 위 래퍼를 `dataSource`에 적용하는 `@TestConfiguration` |

## 새 통합 테스트에 붙이기

```java
@SpringBootTest
@Transactional
@Import(QueryCountingTestConfiguration.class)
@ExtendWith(QueryCountExtension.class)
class FreelancerOrPortfolioIntegrationTest {
```

필요한 리포지토리·서비스만 `@Autowired` 하면 됩니다.

## 권장 패턴 (조회 구간만 측정)

1. 테스트 데이터 저장  
2. `repository.flush()` (또는 서비스가 보장하면 생략 가능)  
3. **`QueryCountHolder.reset()`** ← 여기부터 카운트  
4. 검증할 **조회 한 번** (리포지토리 또는 서비스)  
5. `assertThat(QueryCountHolder.selectExecutions()).isPositive().isLessThanOrEqualTo(N)`  
6. 비즈니스 검증 (목록 크기, DTO, `Hibernate.isInitialized` 등)

`reset()`이 없으면 **저장·삭제까지 합쳐진 숫자**라서 N+1 판단에는 부적합합니다.

### 참고 예시 클래스

- **리포지토리 + 연관 초기화**: `com.devnear.web.service.client.ClientSideFetchingIntegrationTest`  
- **서비스(API와 동일 경로)**: `com.devnear.web.service.client.ClientSideListServicesIntegrationTest`  
- **알림 + 구간별 reset**: `com.devnear.web.service.notification.NotificationServiceIntegrationTest`

## 다건(행 수 늘릴 때)

`ClientSideFetchingIntegrationTest`의 `MULTI_ROW_COUNT`처럼 상수로 건수를 두고, **SELECT 상한**은 한 번 로그로 확인한 뒤 여유 있게 잡습니다. N+1이면 행 수에 비례해 SELECT가 크게 늘어납니다.

## 실행

```bash
cd backend
./gradlew.bat test
# 한 클래스만
./gradlew.bat test --tests "com.devnear.web.service.freelancer.클래스명"
```

테스트가 스킵만 되면:

```bash
./gradlew.bat test --rerun-tasks
```

## 콘솔 출력

- `build.gradle`의 `testLogging`으로 **통과한 테스트의 표준 출력**에 `[쿼리카운트]`가 붙습니다.  
- `src/test/resources/logback-test.xml`, `application.yml`의 로깅 설정으로 **Spring 기본 INFO 잡음**을 줄였습니다.

## 한계 (알아 두기)

- **HTTP API가 브라우저에서 두 번 호출되는지**는 이 도구로는 보지 않습니다. (Network 탭·프론트 테스트 등)  
- **앱 전체·모든 화면**을 보증하지는 않습니다. **짜 둔 시나리오** 안에서의 회귀 방지에 가깝습니다.

## 테스트 전용 설정

- `src/test/resources/application.yml` — H2, JWT 더미, `default_batch_fetch_size` 등  
- `src/test/resources/logback-test.xml` — 초기 Spring Test 로그 WARN

프로덕션 `application.yml`과 다를 수 있으니, **테스트만의 동작**과 **실DB** 차이는 가끔 확인하면 좋습니다.
