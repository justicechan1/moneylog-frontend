# moneylog-frontend

가계부 서비스 프론트엔드입니다. [moneylog 백엔드](https://github.com/justicechan1/moneylog-backend)와 함께 동작합니다.

## 기술 스택

- React 19, Vite
- react-router-dom
- chart.js / react-chartjs-2

## 페이지 구성

- `/login`, `/signup` — 로그인 / 회원가입
- `/transactions` — 거래내역 등록·조회·검색·CSV 내보내기 (인증 필요)
- `/statistics` — 월별/트렌드 통계 (인증 필요)

## 로컬 개발

```bash
npm install
npm run dev
```

기본적으로 `http://localhost:8080`(백엔드 로컬 서버)로 API 요청을 보냅니다 (`src/api.js`의 `VITE_API_BASE` 기본값).

## 빌드 & 배포

```bash
npm run build
```

운영 빌드는 `.env.production`(`VITE_API_BASE=`)에 따라 **상대 경로**로 API를 호출합니다 — nginx가 같은 origin에서 정적 파일을 서빙하면서 `/api/*` 요청만 백엔드로 리버스 프록시하기 때문입니다 (`nginx.conf` 참고).

`main` 브랜치에 push하면 GitHub Actions가 `Dockerfile`(Node 빌드 → nginx 서빙)로 이미지를 만들어 GHCR에 올리고, 백엔드와 같은 EC2에 SSH로 접속해 `docker compose pull frontend && up -d`로 재기동합니다.
