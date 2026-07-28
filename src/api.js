// api.js — 모든 화면에서 import { apiFetch } from "./api" 로 사용
// 개발 서버(vite dev)에서는 로컬 백엔드로, 빌드된 운영 배포판에서는 같은 origin(nginx 리버스 프록시)으로 요청
export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

// 저장된 토큰을 자동으로 Authorization 헤더에 첨부하는 fetch 래퍼.
// 백엔드는 성공/에러 모두 공통 응답 형식으로 응답한다:
//   성공: { success:true,  message, data, (meta) }
//   에러: { success:false, code, message, data:null }
// 이 헬퍼는 응답 형식을 검사한 뒤 성공이면 응답 전체(body)를 반환한다.
// → 호출부는 body.data(실제 데이터), body.meta(페이지 정보)에 접근한다.
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("accessToken");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`; // 토큰 자동 첨부
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // 204(No Content)면 본문이 없으므로 그대로 null 반환
  if (res.status === 204) {
    return null;
  }

  // 응답 본문을 공통 응답 형식으로 파싱 (본문이 없을 수도 있으니 방어적으로 처리)
  const body = await res.json().catch(() => ({}));

  // 실패 판정: HTTP 상태가 실패거나, 응답의 success가 false인 경우
  if (!res.ok || body.success === false) {
    // 토큰 만료/미인증(401) 시 토큰 제거 후 로그인 화면으로 되돌리기
    if (res.status === 401) {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      return;
    }
    // 그 외 에러: 에러 응답 형식의 message/code를 활용
    throw new Error(body.message || `요청 실패 (${body.code || res.status})`);
  }

  // 성공: 응답 전체를 반환 → 호출부에서 body.data / body.meta 사용
  return body;
}

// CSV 내보내기 등 JSON이 아닌 파일 다운로드 응답을 처리하는 헬퍼.
// Authorization 헤더가 필요해 <a href> 직접 다운로드가 불가능하므로 fetch로 받아 Blob을 저장한다.
export async function downloadFile(path) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `다운로드 실패 (${res.status})`);
  }

  // Content-Disposition의 filename= 값을 사용, 없으면 기본값
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const filename = match ? decodeURIComponent(match[1]) : "transactions.csv";

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
