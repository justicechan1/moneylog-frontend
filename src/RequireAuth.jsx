import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// 미로그인 시 로그인 화면으로 되돌리는 보호 라우트
export default function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
