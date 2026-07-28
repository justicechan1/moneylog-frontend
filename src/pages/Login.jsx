import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../api";
import { useAuth } from "../AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // 성공/에러 모두 공통 응답 형식으로 응답: {success, message, data, (code)}
      const body = await res.json();

      if (!res.ok || body.success === false) {
        // 에러 응답 형식: {success:false, code, message, data:null}
        throw new Error(body.message || "로그인 실패");
      }

      // 토큰은 응답의 data 안에 있음: body.data.accessToken
      login(body.data.accessToken); // 전역 로그인 상태 갱신 + localStorage 저장
      navigate("/transactions");
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>머니로그</h1>
        <p className="auth-subtitle">계속하려면 로그인하세요</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {msg && <p className="form-error">{msg}</p>}
          <button type="submit" className="btn btn-primary btn-block">로그인</button>
        </form>
        <p className="auth-footer">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
