import { useEffect, useMemo, useState } from "react";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { apiFetch } from "../api";
import Nav from "../Nav";

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const TREND_MONTHS = 6; // 최근 6개월 추이 (백엔드 /api/statistics/trend 기본값과 동일)

const now = new Date();
const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const PIE_COLORS = [
  "#6d5bfa", "#f2994a", "#e5484d", "#3fb8af", "#12a875",
  "#f2c94c", "#bb6bd9", "#56ccf2", "#9698a6", "#eb5757",
];

const CHART_OPTIONS = { maintainAspectRatio: false, responsive: true };

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]); // [{yearMonth, income, expense, balance}]
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function loadStatistics() {
      try {
        // 이번 달 통계 (파이차트용) — data: {income, expense, balance, byCategory}
        const monthly = await apiFetch(`/api/statistics/monthly?yearMonth=${currentYearMonth}`);
        if (monthly) setStats(monthly.data);

        // 최근 N개월 추이 (라인차트용) — data: {trend: [{yearMonth, income, expense, balance}]}
        const trendBody = await apiFetch(`/api/statistics/trend?months=${TREND_MONTHS}`);
        if (trendBody) setTrend(trendBody.data.trend);
      } catch (err) {
        setMsg(err.message);
      }
    }
    loadStatistics();
  }, []);

  const pieData = useMemo(() => {
    if (!stats) return null;
    return {
      labels: stats.byCategory.map((c) => c.categoryName),
      datasets: [
        {
          data: stats.byCategory.map((c) => c.total),
          backgroundColor: stats.byCategory.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]),
        },
      ],
    };
  }, [stats]);

  const lineData = useMemo(() => {
    if (trend.length === 0) return null;
    return {
      labels: trend.map((t) => t.yearMonth),
      datasets: [
        { label: "수입", data: trend.map((t) => t.income), borderColor: "#12a875", backgroundColor: "#12a875", tension: 0.3 },
        { label: "지출", data: trend.map((t) => t.expense), borderColor: "#e5484d", backgroundColor: "#e5484d", tension: 0.3 },
        { label: "잔액", data: trend.map((t) => t.balance), borderColor: "#6d5bfa", backgroundColor: "#6d5bfa", tension: 0.3 },
      ],
    };
  }, [trend]);

  return (
    <div>
      <Nav />
      <div className="page">
        <div className="page-header">
          <h1>월별 통계</h1>
        </div>
        {msg && <p className="form-error">{msg}</p>}

        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-label">총수입</span>
            <span className="stat-value income">{stats ? `${stats.income.toLocaleString()}원` : "-"}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">총지출</span>
            <span className="stat-value expense">{stats ? `${stats.expense.toLocaleString()}원` : "-"}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">잔액</span>
            <span className="stat-value">{stats ? `${stats.balance.toLocaleString()}원` : "-"}</span>
          </div>
        </div>

        <div className="chart-grid">
          <div className="card">
            <div className="card-title">카테고리별 지출</div>
            {pieData && stats.byCategory.length > 0 ? (
              <div className="chart-box">
                <Pie data={pieData} options={CHART_OPTIONS} />
              </div>
            ) : (
              <div className="empty-state">이번 달 지출 내역이 없습니다.</div>
            )}
          </div>

          <div className="card">
            <div className="card-title">최근 {TREND_MONTHS}개월 추이</div>
            {lineData && (
              <div className="chart-box">
                <Line data={lineData} options={CHART_OPTIONS} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
