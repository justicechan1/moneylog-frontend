import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Nav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="navbar">
      <div className="navbar-inner">
        <Link to="/transactions" className="navbar-brand">
          <span className="dot" />
          머니로그
        </Link>
        <div className="navbar-links">
          <Link
            to="/transactions"
            className={`navlink${pathname === "/transactions" ? " active" : ""}`}
          >
            거래내역
          </Link>
          <Link
            to="/statistics"
            className={`navlink${pathname === "/statistics" ? " active" : ""}`}
          >
            월별 통계
          </Link>
          <button type="button" className="btn btn-secondary" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
