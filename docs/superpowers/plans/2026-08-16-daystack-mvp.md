# DayStack MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 백엔드 없이 localStorage에 저장되는 Daily Log MVP를 만들고, 기록·검색·돌아보기 흐름을 Vercel 배포 가능한 Vue 앱으로 완성한다.

**Architecture:** View와 Component는 Pinia Store만 사용하고, Store는 `DailyLogRepository` 인터페이스만 사용한다. 1차 구현은 `LocalStorageDailyLogRepository`로 완료하며, 이후 Supabase Repository를 교체해도 도메인 타입·Store·화면 계약은 유지한다.

**Tech Stack:** Vue 3, TypeScript, Vite, Pinia, Vue Router, Tailwind CSS v4, Vitest, Vue Test Utils, jsdom, Vercel.

## Global Constraints

- DayStack은 Todo가 아니라 Daily Log 서비스다.
- Daily Log는 날짜당 하나만 저장한다.
- 필드는 `done`, `learned`, `blocked`, `next` 네 개이며 모두 선택 입력이다.
- 네 필드가 모두 비어 있으면 저장하지 않는다.
- 날짜는 UTC가 아닌 사용자의 로컬 `YYYY-MM-DD` 기준으로 처리한다.
- 첫 MVP에는 Auth, Supabase, 공유, 태그, 프로젝트, AI, 알림을 넣지 않는다.
- UI는 Quiet Journal 정서와 Timeline 탐색을 사용하고, 카드 그리드·진행률·배지·보라색 그라디언트를 사용하지 않는다.
- 사용자가 Vite 생성과 npm 설치를 직접 실행한다. 에이전트는 설치 명령을 실행하지 않는다.
- 구현·수정마다 TDD 순서를 지키고, 단계마다 테스트와 빌드 결과를 보고한다.

---

### Task 1: 프로젝트 기반 설정 확인

**Files:**
- Create: `src/app/main.ts`
- Create: `src/app/services.ts`
- Create: `src/router/index.ts`
- Create: `src/styles/tokens.css`
- Create: `vitest.config.ts`
- Modify: `vite.config.ts`
- Modify: `src/App.vue`

**Interfaces:**
- Produces `createAppServices(): { dailyLogRepository: DailyLogRepository }`와 Router 인스턴스.

- [ ] **Step 1: 사용자가 프로젝트 생성 및 설치를 실행한다**

```powershell
npm create vite@latest . -- --template vue-ts
npm install pinia vue-router
npm install tailwindcss @tailwindcss/vite
npm install -D vitest jsdom @vue/test-utils
```

- [ ] **Step 2: 테스트 실행 명령이 동작하는지 확인한다**

Run: `npx vitest run`
Expected: 테스트 탐색이 정상 종료된다.

- [ ] **Step 3: 앱 셸과 Vitest 환경을 구성한다**

`main.ts`에서 Pinia·Router·전역 토큰을 등록하고, `vitest.config.ts`에서 `environment: 'jsdom'`과 `src/**/*.spec.ts` 패턴을 설정한다.

- [ ] **Step 4: 기반 검증을 실행한다**

Run: `npm run build`
Expected: Vite production build succeeds.

---

### Task 2: DailyLog 도메인과 날짜/통계 순수 함수

**Files:**
- Create: `src/domain/date-key.ts`
- Create: `src/domain/daily-log.ts`
- Create: `src/domain/statistics.ts`
- Test: `src/domain/date-key.spec.ts`
- Test: `src/domain/daily-log.spec.ts`
- Test: `src/domain/statistics.spec.ts`

**Interfaces:**
- `DateKey = string & { readonly __brand: 'DateKey' }`
- `DailyLog`, `DailyLogInput`
- `isDateKey(value: string): boolean`
- `toLocalDateKey(date: Date): DateKey`
- `isMeaningfulLog(input: DailyLogInput): boolean`
- `calculateCurrentStreak(logDates: DateKey[], today: DateKey): number`
- `calculateLongestStreak(logDates: DateKey[]): number`
- `countLogsInMonth(logDates: DateKey[], month: string): number`

- [ ] **Step 1: 날짜와 로그 검증 실패 테스트를 작성한다**

```ts
it('YYYY-MM-DD 형식만 DateKey로 인정한다', () => {
  expect(isDateKey('2026-08-16')).toBe(true)
  expect(isDateKey('2026-8-16')).toBe(false)
})

it('네 필드가 모두 공백이면 의미 있는 로그가 아니다', () => {
  expect(isMeaningfulLog({ done: ' ', learned: '', blocked: '', next: '' })).toBe(false)
})
```

- [ ] **Step 2: 날짜/로그 순수 함수를 구현한다**

UTC 변환 없이 로컬 `getFullYear`, `getMonth`, `getDate`로 날짜 키를 생성하고, 문자열을 trim한 뒤 의미 있는 입력을 판단한다.

- [ ] **Step 3: 통계 실패 테스트를 작성한다**

연속된 날짜 3개, 중간에 하루가 빈 날짜, 오늘 미작성 상태, 월 경계가 포함된 케이스를 테스트한다.

- [ ] **Step 4: 통계 함수를 구현한다**

중복 날짜를 제거하고 정렬한 후 날짜 차이를 달력 기준으로 계산한다. 오늘 미작성 시 어제부터 역산하고, 월간 개수는 `YYYY-MM` 접두사로 센다.

- [ ] **Step 5: 도메인 테스트를 실행한다**

Run: `npx vitest run src/domain`
Expected: all domain tests pass.

---

### Task 3: 저장소 추상화와 localStorage 구현

**Files:**
- Create: `src/infrastructure/storage/key-value-storage.ts`
- Create: `src/infrastructure/storage/memory-storage.ts`
- Create: `src/infrastructure/storage/browser-local-storage.ts`
- Create: `src/infrastructure/repositories/daily-log-repository.ts`
- Create: `src/infrastructure/repositories/local-storage-daily-log-repository.ts`
- Test: `src/infrastructure/repositories/local-storage-daily-log-repository.spec.ts`

**Interfaces:**
- `KeyValueStorage.get<T>(key: string): T | null`
- `KeyValueStorage.set<T>(key: string, value: T): void`
- `DailyLogRepository.get(date: DateKey): Promise<DailyLog | null>`
- `DailyLogRepository.list(): Promise<DailyLog[]>`
- `DailyLogRepository.save(input: DailyLogInput & { date: DateKey }): Promise<DailyLog>`
- `DailyLogRepository.remove(date: DateKey): Promise<void>`
- `DailyLogRepository.exportSnapshot(): Promise<string>`
- `DailyLogRepository.importSnapshot(serialized: string): Promise<void>`

- [ ] **Step 1: 저장소 계약 테스트를 작성한다**

저장 후 조회, 수정, 삭제, 목록 정렬, 새로고침과 같은 재조회, 빈 입력 거부, `version: 1` 스냅샷, 잘못된 JSON이 기존 값을 보존하는 케이스를 작성한다.

- [ ] **Step 2: MemoryStorage와 BrowserLocalStorage를 구현한다**

테스트는 `MemoryStorage`만 사용하고, 브라우저 구현체는 `window.localStorage` 예외를 Repository까지 전달한다.

- [ ] **Step 3: LocalStorage Repository를 구현한다**

키 `daystack:data`, 구조 `{ version: 1, logs: Record<string, DailyLog> }`를 사용한다. 저장 시 `createdAt`은 기존 값 유지, `updatedAt`은 현재 ISO 시각으로 갱신한다.

- [ ] **Step 4: JSON 백업을 구현한다**

내보내기는 현재 snapshot 문자열을 반환하고, 가져오기는 JSON·버전·로그 필드를 모두 검증한 뒤에만 한 번에 저장한다. 검증 실패 시 기존 데이터는 변경하지 않는다.

- [ ] **Step 5: Repository 테스트를 실행한다**

Run: `npx vitest run src/infrastructure/repositories/local-storage-daily-log-repository.spec.ts`
Expected: all repository tests pass.

---

### Task 4: Pinia Store와 앱 서비스 조립

**Files:**
- Create: `src/stores/daily-log.store.ts`
- Modify: `src/app/services.ts`
- Test: `src/stores/daily-log.store.spec.ts`

**Interfaces:**
- State: `selectedDate`, `currentLog`, `logs`, `isLoading`, `isSaving`, `error`, `lastSavedAt`
- Actions: `loadDate(date)`, `saveCurrent(input)`, `removeDate(date)`, `loadAll()`, `importSnapshot(serialized)`

- [ ] **Step 1: Store 동작 테스트를 작성한다**

Repository mock을 주입해 날짜 로드 성공, 저장 성공, 네 필드 공백 저장 거부, 저장 오류 표시, 마지막 저장 시각 갱신을 검증한다.

- [ ] **Step 2: Store를 구현한다**

Store는 Repository만 의존하고 저장소 구현체를 직접 import하지 않는다. 저장 성공 후 `currentLog`, `logs`, `lastSavedAt`을 갱신한다.

- [ ] **Step 3: 서비스 조립을 구현한다**

앱 시작 시 `BrowserLocalStorage`와 `LocalStorageDailyLogRepository`를 한 번 생성해 Pinia Store에 주입한다.

- [ ] **Step 4: Store 테스트를 실행한다**

Run: `npx vitest run src/stores/daily-log.store.spec.ts`
Expected: all store tests pass.

---

### Task 5: 앱 셸과 오늘 기록 화면

**Files:**
- Create: `src/components/AppShell.vue`
- Create: `src/components/DesktopNav.vue`
- Create: `src/components/MobileNav.vue`
- Create: `src/components/DateNavigator.vue`
- Create: `src/components/PromptField.vue`
- Create: `src/components/LogComposer.vue`
- Create: `src/components/SaveStatus.vue`
- Create: `src/views/TodayView.vue`
- Create: `src/views/DailyLogView.vue`
- Test: `src/components/LogComposer.spec.ts`
- Test: `src/views/DailyLogView.spec.ts`

**Interfaces:**
- `LogComposer` emits `save` with `DailyLogInput`.
- `DateNavigator` emits `change` with `DateKey`.
- `PromptField` props: `id`, `label`, `modelValue`; emits `update:modelValue`.

- [ ] **Step 1: 핵심 입력 테스트를 작성한다**

네 textarea에 visible label이 있고, 입력값이 `save` payload에 포함되며, 네 필드가 모두 비어 있으면 저장 이벤트를 발생시키지 않는지 테스트한다.

- [ ] **Step 2: 문서형 기록 입력을 구현한다**

카드 4개가 아닌 번호·질문·textarea의 단일 흐름으로 구성한다. CTA 문구는 `기록 저장`으로 고정한다.

- [ ] **Step 3: 날짜 이동과 저장 상태를 연결한다**

저장/오류 상태는 `aria-live` 영역으로 표시하고, 저장 실패에도 입력값을 유지한다.

- [ ] **Step 4: 앱 셸 반응형을 구현한다**

데스크톱 좌측 내비게이션과 모바일 하단 내비게이션을 제공하고, 320px 이상에서 가로 스크롤이 발생하지 않도록 한다.

- [ ] **Step 5: 화면 테스트를 실행한다**

Run: `npx vitest run src/components src/views`
Expected: input and date navigation tests pass.

---

### Task 6: 찾기와 날짜별 타임라인

**Files:**
- Create: `src/components/SearchField.vue`
- Create: `src/components/TimelineList.vue`
- Create: `src/components/EmptyState.vue`
- Create: `src/views/ArchiveView.vue`
- Test: `src/views/ArchiveView.spec.ts`

**Interfaces:**
- `searchLogs(logs: DailyLog[], query: string): SearchResult[]`
- `SearchResult`: `{ log: DailyLog; matchedFields: Array<'done' | 'learned' | 'blocked' | 'next'>; excerpt: string }`

- [ ] **Step 1: 검색 순수 함수 테스트를 작성한다**

대소문자 무시, 네 필드 검색, 부분 문자열, 빈 검색어의 전체 목록, 결과 없음 케이스를 검증한다.

- [ ] **Step 2: 검색 함수를 구현한다**

필드 순서 `done → learned → blocked → next`로 일치 필드를 수집하고, 결과를 날짜 내림차순으로 반환한다.

- [ ] **Step 3: 타임라인 화면을 구현한다**

카드 그리드 대신 날짜·프롬프트명·발췌를 구분선으로 보여준다. 결과 선택 시 `/day/:date`로 이동한다.

- [ ] **Step 4: 검색 상태를 구현한다**

검색어가 없을 때 안내, 결과 없음일 때 검색어와 필터 초기화 행동을 표시한다.

- [ ] **Step 5: 검색 테스트를 실행한다**

Run: `npx vitest run src/views/ArchiveView.spec.ts`
Expected: all search tests pass.

---

### Task 7: 돌아보기 통계 화면

**Files:**
- Create: `src/components/StreakSummary.vue`
- Create: `src/components/MonthOverview.vue`
- Create: `src/views/ReviewView.vue`
- Test: `src/views/ReviewView.spec.ts`

**Interfaces:**
- `ReviewView` consumes `calculateCurrentStreak`, `calculateLongestStreak`, `countLogsInMonth` outputs.

- [ ] **Step 1: 통계 화면 테스트를 작성한다**

현재 연속, 최장 연속, 월간 기록일 수, 기록이 없는 상태, 월 변경 상태를 검증한다.

- [ ] **Step 2: 차분한 통계를 구현한다**

기록의 흐름을 보여주는 텍스트와 날짜 목록을 사용하고, 큰 KPI 카드·달성률·배지·실패 색상을 사용하지 않는다.

- [ ] **Step 3: 날짜 이동을 연결한다**

기록된 날짜를 클릭하면 해당 `/day/:date`로 이동한다.

- [ ] **Step 4: 돌아보기 테스트를 실행한다**

Run: `npx vitest run src/views/ReviewView.spec.ts`
Expected: all review tests pass.

---

### Task 8: 데이터 안전장치와 접근성 QA

**Files:**
- Create: `src/components/BackupControls.vue`
- Create: `src/views/SettingsView.vue`
- Modify: `src/router/index.ts`
- Modify: `src/components/EmptyState.vue`
- Test: `src/components/BackupControls.spec.ts`

**Interfaces:**
- `BackupControls` emits `import` with serialized JSON and `export` with no payload.

- [ ] **Step 1: 백업 테스트를 작성한다**

내보내기 호출, JSON 파일 가져오기, 잘못된 JSON 오류 표시, 가져오기 실패 시 기존 기록 유지 케이스를 검증한다.

- [ ] **Step 2: 백업 UI를 구현한다**

설정 화면에서 JSON 내보내기·가져오기·전체 삭제 전 확인을 제공한다. 저장 데이터가 브라우저에만 존재한다는 점을 명시한다.

- [ ] **Step 3: 접근성 검사를 수행한다**

visible label, landmark, h1, focus ring, keyboard navigation, `aria-live`, 44px target을 확인하고 수정한다.

- [ ] **Step 4: 전체 테스트와 빌드를 실행한다**

Run: `npx vitest run && npm run build`
Expected: all tests pass and production build succeeds.

---

### Task 9: Vercel Preview 배포 검증

**Files:**
- Create: `vercel.json`
- Modify: `README.md`

**Interfaces:**
- Vercel rewrite maps all non-asset paths to `/index.html` for Vue Router history mode.

- [ ] **Step 1: SPA rewrite를 추가한다**

`vercel.json`에서 `/((?!assets/).*)` 요청을 `/index.html`로 rewrite한다.

- [ ] **Step 2: 사용자에게 Vercel 연결과 배포를 맡긴다**

사용자가 Vercel 프로젝트를 연결하고 Preview 배포를 실행한다. 에이전트는 배포 명령이나 계정 작업을 실행하지 않는다.

- [ ] **Step 3: Preview acceptance test를 수행한다**

직접 `/today`, `/archive`, `/review`, `/day/2026-08-16` 접근, 새로고침, 모바일 viewport, localStorage 저장/복원을 확인한다.

- [ ] **Step 4: 결과를 기록한다**

배포 URL, 테스트한 경로, 실패한 경로, 다음 수정 항목을 `README.md`에 기록한다.

## 완료 기준

- `npm run build` 성공
- `npx vitest run` 전체 통과
- 가입 없이 오늘 기록 작성·수정·검색·돌아보기가 가능
- 새로고침 후 localStorage 기록 유지
- JSON 백업/복원 가능
- 모바일 320px에서 가로 스크롤 없음
- Vue Router 직접 URL 접근과 새로고침이 Vercel Preview에서 동작
- Supabase가 MVP 코드에 의존성으로 포함되지 않음
