# DayStack 아키텍처·로드맵

## 1. 결정된 기술 스택

- Vue 3 + TypeScript + Vite
- Pinia
- Vue Router
- Tailwind CSS v4 + 소량의 일반 CSS
- Vitest + Vue Test Utils + jsdom
- 주 저장소: Supabase Postgres + Supabase Auth + RLS
- 테스트·환경변수 미설정 fallback: localStorage
- 배포: Vercel

UI 컴포넌트 라이브러리는 추가하지 않는다. 신규 프로젝트에서 PrimeVue나 Element Plus를 넣으면 DayStack의 문서형 디자인과 초기 구조가 불필요하게 커진다.

## 2. 핵심 경계

```text
Vue View / Component
        ↓
Pinia Store
        ↓
DailyLogRepository
        ↓
SupabaseDailyLogRepository (Production)
LocalStorageDailyLogRepository (fallback/test)

Supabase Auth session
        ↓
Router auth guard + RLS (user_id = auth.uid())
```

`domain`은 Vue, Pinia, localStorage, Supabase를 import하지 않는다. View와 Component는 저장소 구현체를 직접 호출하지 않는다. 저장소 차이는 `infrastructure` 내부에만 둔다.

## 3. 권장 디렉터리

```text
src/
├─ app/
│  ├─ main.ts
│  └─ services.ts
├─ domain/
│  ├─ daily-log.ts
│  ├─ date-key.ts
│  └─ statistics.ts
├─ infrastructure/
│  ├─ auth/
│  │  ├─ auth-gateway.ts
│  │  └─ auth-gateway.spec.ts
│  ├─ supabase/
│  │  └─ client.ts
│  ├─ storage/
│  │  ├─ key-value-storage.ts
│  │  ├─ browser-local-storage.ts
│  │  └─ memory-storage.ts
│  └─ repositories/
│     ├─ daily-log-repository.ts
│     ├─ local-storage-daily-log-repository.ts
│     └─ supabase-daily-log-repository.ts
├─ stores/
│  └─ daily-log.store.ts
├─ router/
│  └─ index.ts
├─ views/
│  ├─ TodayView.vue
│  ├─ ArchiveView.vue
│  ├─ DailyLogView.vue
│  └─ ReviewView.vue
├─ components/
│  ├─ AppShell.vue
│  ├─ DesktopNav.vue
│  ├─ MobileNav.vue
│  ├─ DateNavigator.vue
│  ├─ LogComposer.vue
│  ├─ PromptField.vue
│  ├─ SaveStatus.vue
│  ├─ TimelineList.vue
│  ├─ SearchField.vue
│  ├─ StreakSummary.vue
│  └─ EmptyState.vue
└─ tests/
```

## 4. 핵심 타입과 인터페이스

```ts
export type DateKey = string & { readonly __brand: 'DateKey' };

export type DailyLog = {
  date: DateKey;
  done: string;
  learned: string;
  blocked: string;
  next: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyLogInput = Pick<DailyLog, 'done' | 'learned' | 'blocked' | 'next'>;

export interface DailyLogRepository {
  get(date: DateKey): Promise<DailyLog | null>;
  list(): Promise<DailyLog[]>;
  save(input: DailyLogInput & { date: DateKey }): Promise<DailyLog>;
  remove(date: DateKey): Promise<void>;
  exportSnapshot(): Promise<string>;
  importSnapshot(serialized: string): Promise<void>;
}
```

Pinia Store는 `selectedDate`, `currentLog`, `logs`, `isLoading`, `isSaving`, `error`, `lastSavedAt`만 관리한다. Store에서 `localStorage.setItem`이나 Supabase client를 직접 호출하지 않는다.

## 5. 라우팅

```text
/                  → /today
/today             → 오늘 기록
/day/:date         → 특정 날짜 기록
/archive           → 찾기/검색
/review            → 돌아보기
/settings          → JSON 백업·복원 및 사용자 데이터 관리
```

`/login`은 공개 경로이고 나머지 기록 경로는 Supabase session이 없으면 `/login`으로 이동한다. `/day/:date`는 `YYYY-MM-DD` 형식이 아니면 `/today`로 되돌린다.

## 6. 사용자 실행 명령

아래 명령은 사용자가 직접 실행한다. 에이전트는 실행하지 않는다.

```powershell
npm create vite@latest . -- --template vue-ts
npm install pinia vue-router
npm install tailwindcss @tailwindcss/vite
npm install -D vitest jsdom @vue/test-utils
npm install @supabase/supabase-js
```

## 7. 단계별 로드맵

### 0단계: 프로젝트 기반

사용자가 Vite 생성과 설치를 완료한 뒤, 에이전트가 Tailwind·Vitest·alias·기본 앱 셸을 정리한다.

완료 기준: `npm run build`, `npx vitest run`, Tailwind 적용 화면이 모두 동작한다.

### 1단계: Daily Log 도메인과 localStorage

TDD 순서로 DateKey/로그 검증, 통계 함수, MemoryStorage, Repository 계약 테스트를 작성한 뒤 LocalStorage Repository와 Pinia Store를 구현한다.

완료 기준: 저장·재조회·수정·삭제·검색·연속/월간 통계가 테스트로 검증된다.

### 2단계: 핵심 화면

오늘 기록, 과거 날짜 읽기/수정, 찾기, 돌아보기, 반응형 내비게이션, 빈 상태·오류 상태를 구현한다.

완료 기준: 사용자가 가입 없이 오늘 기록을 저장하고, 검색과 돌아보기로 다시 접근한다.

### 3단계: 데이터 안전장치와 QA

JSON 내보내기/가져오기, 초기화 전 확인, 저장소 오류 대응, 접근성 점검, 모바일 브라우저 검증을 진행한다.

완료 기준: 데이터 복원과 저장 실패 시 입력 보존이 확인된다.

### 4단계: Vercel 배포

Vercel에 Preview를 배포하고 SPA history fallback, 직접 URL 접근, 새로고침, 모바일 화면을 확인한 뒤 Production에 배포한다.

상태: 완료. Production URL은 `https://day-stack-pearl.vercel.app`이다.

### 5단계: Supabase 전환

사용자가 Supabase 프로젝트·환경변수·DB migration을 준비했고, Auth·RLS·Repository adapter·로그인 가드·JSON 백업 연동을 추가했다.

상태: 완료. 실제 로그인, 기록 저장, Supabase Table Editor 저장 결과를 확인했다.

## 8. 역할 분담

### 사용자

- Vite 프로젝트 생성과 npm 설치
- Node/npm 환경 준비
- Supabase 프로젝트와 Vercel 프로젝트 생성
- 환경변수와 DB migration 실행
- 각 화면과 제품 방향 승인
- 실제 사용성 테스트 및 배포 승인

### 에이전트

- 기획·UX 문서 작성 및 갱신
- 타입·Repository·Pinia Store 구현
- TDD 기반 Vue 화면 구현
- 테스트·빌드·로컬 서버 검증
- Vercel SPA 설정 작성
- 단계별 변경 파일과 검증 결과 보고
