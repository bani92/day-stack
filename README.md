# DayStack

DayStack는 Todo가 아니라 Daily Log를 기록하는 Vue 3 앱입니다.
현재 아키텍처는 `src/app/main.ts`에서 앱 셸을 조립하고, `src/app/services.ts`에서 서비스 객체를 만들고, `src/router/index.ts`에서 `/login`, `/today`, `/day/:date`, `/archive`, `/review`, `/settings` 라우트를 연결하는 구조입니다.
전역 스타일 토큰은 `src/styles/tokens.css`에 있습니다.

## 배포

- Production: [https://day-stack-pearl.vercel.app](https://day-stack-pearl.vercel.app)
- Hosting: Vercel
- Build command: `npm run build`
- Output directory: `dist`
- SPA history fallback: `vercel.json`에서 Vue Router 경로를 `index.html`로 rewrite

### Task 9 검증 메모

- 로컬 `npm run test`: 22개 파일, 109개 테스트 통과
- 로컬 `npm run build`: 통과
- Production 루트 `/`: 정상
- Production 하위 경로 직접 접근(`/today`, `/archive`, `/review`, `/settings`, `/day/:date`): 정상
- Production 비로그인 접근: `/login`으로 이동
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
- 로그인한 사용자의 기록은 Supabase `daily_logs` 테이블에 저장됩니다.
- Supabase Auth는 초대된 계정만 로그인할 수 있도록 설정되어 있으며, RLS가 `user_id` 기준으로 본인 기록만 허용합니다.
- JSON 내보내기·가져오기는 현재 로그인한 사용자의 기록을 대상으로 합니다.
- 환경변수가 없는 테스트·초기 환경에서는 localStorage 저장소가 fallback으로 사용됩니다.
- `/today`, `/archive`, `/review`, `/settings`, `/day/:date`는 Vue Router history 모드로 동작합니다.
- Supabase 환경변수는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 사용합니다.
