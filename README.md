# DayStack

DayStack는 Todo가 아니라 Daily Log를 기록하는 Vue 3 앱입니다.
현재 초기 아키텍처는 `src/app/main.ts`에서 앱 셸을 조립하고, `src/app/services.ts`에서 서비스 객체를 만들고, `src/router/index.ts`에서 `/today`, `/day/:date`, `/archive`, `/review`, `/settings` 라우트를 연결하는 구조입니다.
전역 스타일 토큰은 `src/styles/tokens.css`에 있습니다.

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
- 도메인, 저장소, 실제 Daily Log 기능은 다음 작업에서 추가합니다.
