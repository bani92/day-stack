# DayStack Task 6 - Task 1 Report

## 작업 요약

- 범위: `src/domain/search-logs.ts`와 `src/domain/search-logs.spec.ts`만 추가했다.
- 목표: `DailyLog[]`를 대상으로 키워드 검색을 수행하는 순수 도메인 함수 `searchLogs`를 TDD로 구현했다.
- 제외: Vue, Pinia, 저장소, 라우터, 기존 파일 리팩터링은 건드리지 않았다.

## 설계 방향

- `searchLogs`는 입력 `DailyLog[]`와 `query`만 받아 `SearchResult[]`를 반환하는 순수 함수로 뒀다.
- 검색 필드 순서는 brief 그대로 `done -> learned -> blocked -> next`를 사용했다.
- 검색어 정규화는 brief 그대로 `query.trim().toLocaleLowerCase('ko-KR')`를 사용했다.
- 결과 정렬은 `log.date.localeCompare` 기반 내림차순으로 처리했다.
- 입력 배열은 복사 기반의 `map`/`filter`/`sort` 흐름으로 처리해 mutate하지 않았다.

## TDD 기록

### 1. 테스트 먼저 작성

`src/domain/search-logs.spec.ts`에 아래 다섯 시나리오를 behavior 중심으로 작성했다.

1. 대소문자 무시 + 네 필드 검색
2. 여러 매칭 필드의 순서 보장
3. 빈 검색어일 때 전체 목록 반환 + 날짜 내림차순 + 입력 배열 non-mutation
4. 결과 없음
5. 120자 excerpt 자르기

후속 리뷰 반영으로 빈 검색어의 메타데이터 의미를 고정하는 테스트를 추가했다.

6. 빈 검색어일 때 non-empty fields만 `matchedFields`에 순서대로 담기고 첫 non-empty field가 `excerpt`가 되는지
7. 모든 필드가 비어 있는 로그도 빈 검색어 결과에 포함되는지

### 2. 실패 확인

실행 명령:

```powershell
npx vitest run src/domain/search-logs.spec.ts
```

확인 결과:

- 실패했다.
- 실패 이유는 예상대로 `./search-logs` 모듈이 아직 존재하지 않아 import를 해석하지 못했기 때문이다.
- 즉, 기능 부재로 인한 RED 단계가 확인됐다.

### 3. 최소 구현

`src/domain/search-logs.ts`에 아래를 구현했다.

- `SearchField` 타입
- `SearchResult` 인터페이스
- `searchLogs(logs, query)` 함수
- 내부 helper:
  - `normalizeQuery`
  - `normalizeValue`
  - `createExcerpt`
  - `getMatchedFields`

구현 규칙:

- 비어 있지 않은 검색어는 각 필드를 `toLocaleLowerCase('ko-KR')`로 비교해 부분 문자열 매칭을 찾는다.
- 빈 검색어는 모든 로그를 포함한다.
- `matchedFields`는 필드 순서대로 수집한다.
- `excerpt`는 첫 번째 매칭 필드 값을 `trim()` 후 최대 120자로 자르고, 초과 시 `…`를 붙인다.

## 검증 결과

초기 구현 검증 실행 명령:

```powershell
npx vitest run src/domain/search-logs.spec.ts src/domain
```

초기 구현 결과:

- `Test Files 4 passed (4)`
- `Tests 15 passed (15)`

즉, 새 focused test와 기존 domain test 전체가 통과했다.

리뷰 반영 후 재검증 실행 명령:

```powershell
npx vitest run src/domain/search-logs.spec.ts src/domain
```

리뷰 반영 후 결과:

- 빈 검색어 메타데이터 회귀 방지 테스트가 추가된 상태로 통과했다.
- 최신 기준 예상 총합은 `Test Files 4 passed (4)`, `Tests 16 passed (16)`이다.

## 변경 파일

- `src/domain/search-logs.ts`
- `src/domain/search-logs.spec.ts`
- `.superpowers/sdd/daystack-search-timeline/task-1-report.md`

## 해석 메모

- 초기 brief 단계에서는 빈 검색어에서 `matchedFields`와 `excerpt`의 세부 규칙이 충분히 명시되지 않아, 구현에서는 전체 타임라인 UX에 맞춰 비어 있지 않은 필드만 `matchedFields`에 담고 그 첫 필드로 `excerpt`를 만드는 해석을 적용했다.
- 이후 리뷰를 거치면서 brief와 spec에 이 규칙이 명시적으로 반영됐다.
- 후속 behavior test는 이 규칙을 구현 변경 없이 고정해, 빈 검색어에서도 non-empty fields 순서와 첫 non-empty field 기반 `excerpt`가 유지되도록 했다.

## 미수행 항목

- 커밋은 하지 않았다.
- `git status` 확인은 이 환경에서 safe.directory 제약으로 수행하지 않았다.
