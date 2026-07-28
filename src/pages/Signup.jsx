import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../api";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname }),
      });

      // 성공/에러 모두 공통 응답 형식으로 응답: {success, message, data, (code)}
      const body = await res.json();

      if (!res.ok || body.success === false) {
        // 에러 응답 형식: {success:false, code, message, data:null}
        throw new Error(body.message || "회원가입 실패");
      }

      // 회원가입은 토큰을 내려주지 않으므로 로그인 화면으로 이동
      navigate("/login");
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>회원가입</h1>
        <p className="auth-subtitle">머니로그를 시작해보세요</p>
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
            placeholder="비밀번호 (8자 이상)"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
          {msg && <p className="form-error">{msg}</p>}
          <button type="submit" className="btn btn-primary btn-block">회원가입</button>
        </form>
        <p className="auth-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
