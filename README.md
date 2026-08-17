# DayStack

DayStack는 Todo가 아니라 Daily Log를 기록하는 Vue 3 앱입니다.
현재 초기 아키텍처는 `src/app/main.ts`에서 앱 셸을 조립하고, `src/app/services.ts`에서 서비스 객체를 만들고, `src/router/index.ts`에서 `/today`, `/day/:date`, `/archive`, `/review`, `/settings` 라우트를 연결하는 구조입니다.
전역 스타일 토큰은 `src/styles/tokens.css`에 있습니다.

## 배포

- Production: [https://day-stack-pearl.vercel.app](https://day-stack-pearl.vercel.app)
- Hosting: Vercel
- Build command: `npm run build`
- Output directory: `dist`
- SPA history fallback: `vercel.json`에서 Vue Router 경로를 `index.html`로 rewrite

### Task 9 검증 메모

- 로컬 `npm run test`: 19개 파일, 95개 테스트 통과
- 로컬 `npm run build`: 통과
- Production 루트 `/`: 정상
- Production 하위 경로 직접 접근(`/today`, `/archive`, `/review`, `/settings`, `/day/:date`): 정상
- `vercel.json` 반영 후 Vercel 재배포 완료

## 실행

- 개발 서버: `npm run dev`
- 프로덕션 빌드: `npm run build`
- 테스트: `npx vitest run` 또는 `npm test`

## 스크립트

- `dev`: Vite 개발 서버
- `build`: `vue-tsc -b && vite build`
- `test`: `vitest run`
- `preview`: Vite preview 서버

## 참고

- Vite 기본 데모 컴포넌트는 제거했습니다.
- 기록은 현재 브라우저의 `localStorage`에 저장되며, 서버나 계정 간 동기화는 제공하지 않습니다.
- `/today`, `/archive`, `/review`, `/settings`, `/day/:date`는 Vue Router history 모드로 동작합니다.
- 특정 사용자 접근과 계정 간 동기화는 Supabase Auth 및 DB를 연동하는 다음 단계에서 추가합니다.
