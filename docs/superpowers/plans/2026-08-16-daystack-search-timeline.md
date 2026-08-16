# DayStack 검색·날짜별 타임라인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 저장된 Daily Log를 검색하고 날짜 내림차순 타임라인에서 날짜별 기록으로 이동할 수 있는 `/archive` 화면을 구현한다.

**Architecture:** 검색 규칙은 Vue와 저장소에 의존하지 않는 `searchLogs` 순수 함수로 둔다. `ArchiveView`는 `useAppDailyLogStore` adapter의 `loadAll`, `logs`, `error`, `isLoading`만 사용하고, `SearchField`, `TimelineList`, `EmptyState`는 표시와 이벤트에 집중한다. `/archive` 라우트는 기존 placeholder를 새 화면으로 교체한다.

**Tech Stack:** Vue 3, TypeScript, Vite, Pinia, Vue Router, Tailwind CSS, Vitest, Vue Test Utils.

## Global Constraints

- 검색 대상 순서는 `done → learned → blocked → next`다.
- 빈 검색어는 모든 로그를 반환한다.
- 빈 검색어에서도 `matchedFields`는 비어 있지 않은 프롬프트를 `done → learned → blocked → next` 순서로 담고, `excerpt`는 첫 번째 비어 있지 않은 프롬프트에서 만든다.
- 결과는 `date` 내림차순으로 정렬한다.
- `excerpt`는 매칭된 첫 번째 필드의 내용을 trim하고 최대 120자로 줄인다. 120자를 넘기면 `…`을 덧붙인다.
- `ArchiveView`는 `useAppDailyLogStore` adapter만 사용한다. `localStorage`나 Repository 구현체를 화면에서 직접 import하지 않는다.
- 카드 그리드 대신 날짜·프롬프트명·발췌를 구분선 기반의 단일 세로 목록으로 표시한다.
- 화면에는 `header`, `nav`, `main`, 단일 `h1`을 유지한다.
- 검색 input에는 항상 visible label을 제공한다.
- 검색 결과 항목은 키보드 포커스와 44px 이상 클릭 영역을 갖는다.
- 큰 KPI 카드, 카드 그리드, 강한 그라디언트, 보라색 중심 스타일은 사용하지 않는다.
- `node_modules/`와 `dist/`는 커밋하지 않는다.

---

### Task 1: 검색 도메인 함수

**Files:**
- Create: `src/domain/search-logs.ts`
- Test: `src/domain/search-logs.spec.ts`

**Interfaces:**
- Consumes: `DailyLog[]`, `string`
- Produces:

```ts
export type SearchField = 'done' | 'learned' | 'blocked' | 'next'

export interface SearchResult {
  log: DailyLog
  matchedFields: SearchField[]
  excerpt: string
}

export function searchLogs(logs: DailyLog[], query: string): SearchResult[]
```

- [ ] **Step 1: Write the failing tests**

`src/domain/search-logs.spec.ts`에 다음 행동을 각각 테스트한다.

```ts
it('ignores case and searches all four prompt fields', () => {
  const results = searchLogs([logWith({ learned: 'Vue Router를 복습했다' })], 'vue router')

  expect(results).toHaveLength(1)
  expect(results[0]?.matchedFields).toEqual(['learned'])
})

it('returns every matching field in prompt order', () => {
  const results = searchLogs([
    logWith({ done: 'Vue 구현', next: 'Vue 테스트 보강' }),
  ], 'vue')

  expect(results[0]?.matchedFields).toEqual(['done', 'next'])
})

it('returns all logs sorted newest first when query is empty', () => {
  const results = searchLogs([logOn('2026-08-14'), logOn('2026-08-16'), logOn('2026-08-15')], '  ')

  expect(results.map(result => result.log.date)).toEqual([
    '2026-08-16',
    '2026-08-15',
    '2026-08-14',
  ])
})

it('returns no results when no field contains the query', () => {
  expect(searchLogs([logWith({ done: '문서 정리' })], '운동')).toEqual([])
})

it('trims the first matching field into a maximum 120-character excerpt', () => {
  const longText = 'a'.repeat(130)
  const results = searchLogs([logWith({ done: longText })], 'aaa')

  expect(results[0]?.excerpt).toBe(`${'a'.repeat(119)}…`)
})
```

테스트 fixture는 `DailyLog`의 날짜·네 필드·ISO timestamp를 모두 채우고, 테스트 간 객체를 공유하지 않는다.

- [ ] **Step 2: Run the focused tests and verify the expected failure**

Run: `npx vitest run src/domain/search-logs.spec.ts`

Expected: FAIL because `src/domain/search-logs.ts` and `searchLogs` do not exist yet.

- [ ] **Step 3: Implement the minimal pure function**

`src/domain/search-logs.ts`에서 필드 정의를 한 곳에 두고, 다음 순서로 구현한다.

```ts
const SEARCH_FIELDS: Array<{ key: SearchField; label: string }> = [
  { key: 'done', label: '오늘 한 일' },
  { key: 'learned', label: '배운 점' },
  { key: 'blocked', label: '막힌 점' },
  { key: 'next', label: '다음에 이어갈 일' },
]
```

검색어는 `query.trim().toLocaleLowerCase('ko-KR')`로 만들고, 빈 문자열이면 모든 로그를 결과로 만든다. 각 로그의 필드를 순서대로 검사해 매칭 필드를 수집하고, 첫 매칭 필드의 trim된 문자열을 최대 120자로 잘라 `excerpt`에 넣는다. 마지막에 `log.date.localeCompare` 기준 내림차순으로 정렬한다. 입력 배열은 mutate하지 않는다.

- [ ] **Step 4: Run the focused and full domain tests**

Run: `npx vitest run src/domain/search-logs.spec.ts src/domain`

Expected: all focused search tests and existing domain tests PASS.

- [ ] **Step 5: Commit the domain unit**

```powershell
git add src/domain/search-logs.ts src/domain/search-logs.spec.ts
git commit -m "feat: add daily log search function"
```

### Task 2: 검색 화면 구성 컴포넌트

**Files:**
- Create: `src/components/SearchField.vue`
- Create: `src/components/TimelineList.vue`
- Create: `src/components/EmptyState.vue`
- Test: `src/components/SearchField.spec.ts`
- Test: `src/components/TimelineList.spec.ts`
- Test: `src/components/EmptyState.spec.ts`

**Interfaces:**
- Consumes: `SearchResult[]`, `query`, `title`, `description`, optional clear event
- Produces: `update:modelValue` from `SearchField`, `select` with `DateKey` from `TimelineList`

- [ ] **Step 1: Write the failing component tests**

`SearchField.spec.ts`는 visible `label`과 input model update를 검증한다. `TimelineList.spec.ts`는 결과마다 날짜·일치 필드 라벨·발췌를 렌더링하고, 항목 링크가 `/day/:date`를 가리키며 44px target 클래스를 갖는지 검증한다.

`EmptyState.spec.ts`는 title/description을 렌더링하고 action button이 `action` 이벤트를 내보내는지 검증한다.

```ts
it('updates the model from the labelled search input', async () => {
  const wrapper = mount(SearchField, { props: { modelValue: '' } })

  await wrapper.get('input#archive-search').setValue('Vue')

  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Vue'])
  expect(wrapper.get('label[for="archive-search"]').text()).toContain('기록 검색')
})

it('renders a timeline link with prompt labels and excerpt', () => {
  const wrapper = mount(TimelineList, { props: { results: [resultFixture] } })

  expect(wrapper.get('a[href="/day/2026-08-16"]').text()).toContain('배운 점')
  expect(wrapper.text()).toContain('Vue Router를 복습했다')
  expect(wrapper.get('a').classes()).toContain('min-h-11')
})

it('emits an action when the empty state button is activated', async () => {
  const wrapper = mount(EmptyState, {
    props: { title: '검색 결과가 없습니다.', description: '검색어를 바꿔보세요.', actionLabel: '검색어 지우기' },
  })

  await wrapper.get('button').trigger('click')

  expect(wrapper.emitted('action')).toHaveLength(1)
})
```

- [ ] **Step 2: Run component tests and verify the expected failure**

Run: `npx vitest run src/components/SearchField.spec.ts src/components/TimelineList.spec.ts src/components/EmptyState.spec.ts`

Expected: FAIL because the new component files do not exist.

- [ ] **Step 3: Implement the minimal components**

`SearchField`는 `id="archive-search"`, visible `label`, `type="search"`, `autocomplete="off"`, clear button을 제공한다. clear button은 query가 있을 때만 보이고 `update:modelValue`에 빈 문자열을 보낸다.

`TimelineList`는 `SearchResult[]`를 `v-for`로 그리며 `RouterLink`의 `:to="\`/day/${result.log.date}\`"`를 사용한다. 매칭 필드 라벨은 도메인 필드 순서와 같은 한국어 라벨로 표시하고, 결과 항목은 `min-h-11` 이상의 클릭 영역을 갖는다. 카드 그림자와 grid layout은 사용하지 않는다.

`EmptyState`는 `title`, `description`, `actionLabel`, `@action`을 props/emits로 제공해 결과 없음일 때 검색어 초기화 같은 행동을 호출할 수 있게 한다.

- [ ] **Step 4: Run component tests and refactor only after green**

Run: `npx vitest run src/components/SearchField.spec.ts src/components/TimelineList.spec.ts`

Expected: PASS with no snapshot tests.

- [ ] **Step 5: Commit the components**

```powershell
git add src/components/SearchField.vue src/components/SearchField.spec.ts src/components/TimelineList.vue src/components/TimelineList.spec.ts src/components/EmptyState.vue src/components/EmptyState.spec.ts
git commit -m "feat: add search timeline components"
```

### Task 3: Archive 화면과 라우팅 연결

**Files:**
- Create: `src/views/ArchiveView.vue`
- Test: `src/views/ArchiveView.spec.ts`
- Modify: `src/router/index.ts`

**Interfaces:**
- Consumes: `useAppDailyLogStore()` with `loadAll()`, `logs`, `isLoading`, `error`; `searchLogs(logs, query)`
- Produces: `/archive` renders the connected timeline and links to `/day/:date`

- [ ] **Step 1: Write the failing view tests**

`ArchiveView.spec.ts`에서 app store를 fixture로 주입하고 다음을 검증한다.

```ts
it('loads all logs and shows the complete timeline for an empty query', async () => {
  const { wrapper, store } = await mountArchive({ logs: [newestLog, olderLog] })

  expect(store.loadAll).toHaveBeenCalledOnce()
  expect(wrapper.text()).toContain('전체 기록')
  expect(wrapper.get('a[href="/day/2026-08-16"]').exists()).toBe(true)
})

it('filters the timeline as the user types', async () => {
  const { wrapper } = await mountArchive({ logs: [logWith({ learned: 'Vue Router' }), olderLog] })

  await wrapper.get('#archive-search').setValue('router')

  expect(wrapper.text()).toContain('Vue Router')
  expect(wrapper.text()).not.toContain(olderLog.done)
})

it('clears the query from the empty-result state', async () => {
  const { wrapper } = await mountArchive({ logs: [olderLog] })

  await wrapper.get('#archive-search').setValue('없는 키워드')
  expect(wrapper.text()).toContain('검색 결과가 없습니다.')

  await wrapper.get('button').trigger('click')
  expect((wrapper.get('#archive-search').element as HTMLInputElement).value).toBe('')
  expect(wrapper.get('a[href="/day/2026-08-15"]').exists()).toBe(true)
})

it('shows the store error while preserving the search input', async () => {
  const { wrapper, store } = await mountArchive({ error: '기록을 불러오지 못했습니다.' })

  await wrapper.get('#archive-search').setValue('Vue')
  expect(wrapper.text()).toContain('기록을 불러오지 못했습니다.')
  expect((wrapper.get('#archive-search').element as HTMLInputElement).value).toBe('Vue')
  expect(store.loadAll).toHaveBeenCalledOnce()
})
```

- [ ] **Step 2: Run the view tests and verify the expected failure**

Run: `npx vitest run src/views/ArchiveView.spec.ts`

Expected: FAIL because `ArchiveView.vue` is not implemented and `/archive` still renders the placeholder.

- [ ] **Step 3: Implement ArchiveView and replace the route component**

`ArchiveView`는 `const query = ref('')`와 `computed(() => searchLogs(store.logs, query.value))`를 사용한다. `onMounted(() => void store.loadAll())`로 진입 시 한 번 로드한다. 렌더 순서는 `main → h1 → SearchField → status/error → TimelineList or EmptyState`로 두고 기존 `AppShell`의 `header/nav`를 유지한다.

상태 분기:

```ts
const hasQuery = computed(() => query.value.trim() !== '')
const hasLogs = computed(() => store.logs.length > 0)
const hasResults = computed(() => results.value.length > 0)
```

- 로딩 중: `기록을 불러오는 중입니다.`
- store error: `store.error`를 `role="alert"`로 표시하고 입력값은 유지
- 기록 없음: `아직 기록이 없습니다.`와 `/today` 시작 링크
- 기록 있음 + 빈 검색어: `전체 기록` + `키워드로 기록을 찾아보세요.` + 타임라인
- 검색 결과 없음: `검색 결과가 없습니다.` + `검색어를 지우고 다시 보기` 버튼
- 결과 있음: `TimelineList` 렌더

`src/router/index.ts`의 `/archive` route component를 `ArchiveView`로 바꾸고 기존 route name을 유지한다. `/today`, `/day/:date`, `/review`, `/settings`는 변경하지 않는다.

- [ ] **Step 4: Run focused, full tests, and build**

Run: `npx vitest run src/views/ArchiveView.spec.ts src/components src/domain`; then `npm run test`; then `npm run build`.

Expected: all tests PASS and Vite build exits 0.

- [ ] **Step 5: Commit the Archive feature**

```powershell
git add src/views/ArchiveView.vue src/views/ArchiveView.spec.ts src/router/index.ts
git commit -m "feat: add daily log archive timeline"
```

### Task 4: 최종 검증과 수동 UI 확인

**Files:**
- Modify: none unless verification finds a Task 6 regression

- [ ] **Step 1: Run the complete verification commands**

```powershell
npm run test
npm run build
```

- [ ] **Step 2: Check the local UI**

Run the Vite server on `127.0.0.1`, then verify `/archive` at 320px and desktop widths:

- empty query shows the complete timeline
- typing filters results without page reload
- clear action restores the full timeline
- result link opens `/day/YYYY-MM-DD`
- no horizontal overflow
- visible search label, keyboard focus, 44px result target, single `h1`

- [ ] **Step 3: Check the final diff**

```powershell
git diff --check HEAD~3..HEAD
git status -sb
```

Confirm `node_modules/` and `dist/` are absent from the diff.
