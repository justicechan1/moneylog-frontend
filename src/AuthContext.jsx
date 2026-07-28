import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

// 로그인 상태(accessToken)를 앱 전역에서 공유하기 위한 Provider.
// localStorage가 실제 저장소이고, 이 컨텍스트는 그 값을 React 상태로 미러링해
// 로그인/로그아웃 시 모든 컴포넌트가 즉시 리렌더링되도록 한다.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("accessToken"));

  const login = useCallback((accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    setToken(accessToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다");
  }
  return ctx;
}
