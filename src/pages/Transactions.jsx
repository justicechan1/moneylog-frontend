import { useEffect, useState } from "react";
import { apiFetch, downloadFile } from "../api";
import Nav from "../Nav";

const PAGE_SIZE = 10;

const now = new Date();
const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const EMPTY_FORM = {
  type: "EXPENSE",
  amount: "",
  categoryId: "",
  description: "",
  transactionDate: "",
};

const EMPTY_FILTERS = {
  keyword: "",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
  type: "",
  categoryId: "",
};

// 값이 있는 필드만 쿼리스트링에 담는다 (빈 문자열은 서버가 필터 없음으로 취급하도록 생략)
function buildQuery(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) qs.set(key, value);
  });
  return qs.toString();
}

export default function Transactions() {
  const [mode, setMode] = useState("monthly"); // "monthly" | "search"
  const [yearMonth, setYearMonth] = useState(currentYearMonth);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [list, setList] = useState([]);
  const [pageMeta, setPageMeta] = useState(null);
  const [page, setPage] = useState(0);

  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState("");
  const [listMsg, setListMsg] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  async function loadCategories() {
    const body = await apiFetch("/api/categories");
    if (body) setCategories(body.data);
  }

  async function loadMonthly(targetPage) {
    setListMsg("");
    try {
      const qs = buildQuery({ yearMonth, page: targetPage, size: PAGE_SIZE });
      const body = await apiFetch(`/api/transactions?${qs}`);
      if (!body) return;
      setList(body.data.transactions);
      setPageMeta(body.meta?.pagination ?? null);
      setPage(targetPage);
    } catch (err) {
      setListMsg(err.message);
    }
  }

  async function loadSearch(targetPage) {
    setListMsg("");
    try {
      const qs = buildQuery({ ...filters, page: targetPage, size: PAGE_SIZE });
      const body = await apiFetch(`/api/transactions/search?${qs}`);
      if (!body) return;
      setList(body.data.transactions);
      setPageMeta(body.meta?.pagination ?? null);
      setPage(targetPage);
    } catch (err) {
      setListMsg(err.message);
    }
  }

  function refresh(targetPage = page) {
    if (mode === "search") loadSearch(targetPage);
    else loadMonthly(targetPage);
  }

  useEffect(() => {
    loadCategories();
    loadMonthly(0);
  }, []);

  useEffect(() => {
    if (mode === "monthly") loadMonthly(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearMonth]);

  // 선택한 타입(수입/지출)에 해당하는 카테고리만 드롭다운에 노출
  const categoryOptions = categories.filter((c) => c.type === form.type);
  const filterCategoryOptions = filters.type
    ? categories.filter((c) => c.type === filters.type)
    : categories;

  function updateField(field, value) {
    setForm((prev) => {
      // 타입이 바뀌면 이전에 선택된 카테고리(다른 타입 소속)를 초기화
      if (field === "type") {
        return { ...prev, type: value, categoryId: "" };
      }
      return { ...prev, [field]: value };
    });
  }

  function updateFilter(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        categoryId: Number(form.categoryId),
      };
      if (editingId) {
        await apiFetch(`/api/transactions/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/transactions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      refresh(); // 등록/수정 후 현재 목록 갱신
    } catch (err) {
      setMsg(err.message);
    }
  }

  function handleEdit(t) {
    setEditingId(t.id);
    setForm({
      type: t.type,
      amount: String(t.amount),
      categoryId: String(t.categoryId),
      description: t.description ?? "",
      transactionDate: t.transactionDate,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleDelete(id) {
    if (!window.confirm("이 거래내역을 삭제할까요?")) return;
    setListMsg("");
    try {
      await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
      refresh();
    } catch (err) {
      setListMsg(err.message);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setMode("search");
    loadSearch(0);
  }

  function handleResetSearch() {
    setFilters(EMPTY_FILTERS);
    setMode("monthly");
    loadMonthly(0);
  }

  async function handleExportCsv() {
    setListMsg("");
    try {
      const qs = mode === "search" ? buildQuery(filters) : "";
      await downloadFile(`/api/transactions/export${qs ? `?${qs}` : ""}`);
    } catch (err) {
      setListMsg(err.message);
    }
  }

  return (
    <div>
      <Nav />
      <div className="page">
        <div className="page-header">
          <h1>거래내역</h1>
        </div>

        <div className="card">
          <div className="card-title">{editingId ? "거래 수정" : "새 거래 등록"}</div>
          <form onSubmit={handleSubmit}>
            <div className="field-row">
              <div className="field">
                <label>타입</label>
                <select value={form.type} onChange={(e) => updateField("type", e.target.value)}>
                  <option value="EXPENSE">지출</option>
                  <option value="INCOME">수입</option>
                </select>
              </div>
              <div className="field">
                <label>금액(원)</label>
                <input
                  type="number"
                  placeholder="0"
                  min="1"
                  value={form.amount}
                  onChange={(e) => updateField("amount", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>카테고리</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => updateField("categoryId", e.target.value)}
                  required
                >
                  <option value="" disabled>선택</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flexGrow: 2 }}>
                <label>내용</label>
                <input
                  type="text"
                  placeholder="내용(선택)"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>
              <div className="field">
                <label>날짜</label>
                <input
                  type="date"
                  value={form.transactionDate}
                  onChange={(e) => updateField("transactionDate", e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">{editingId ? "수정 완료" : "등록"}</button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>취소</button>
              )}
            </div>
            {msg && <p className="form-error" style={{ marginTop: 12 }}>{msg}</p>}
          </form>
        </div>

        <div className="card">
          <div className="card-title">검색</div>
          <form onSubmit={handleSearchSubmit}>
            <div className="field-row">
              <div className="field" style={{ flexGrow: 2 }}>
                <label>키워드</label>
                <input
                  type="text"
                  placeholder="내용 검색"
                  value={filters.keyword}
                  onChange={(e) => updateFilter("keyword", e.target.value)}
                />
              </div>
              <div className="field">
                <label>시작일</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilter("startDate", e.target.value)}
                />
              </div>
              <div className="field">
                <label>종료일</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilter("endDate", e.target.value)}
                />
              </div>
              <div className="field">
                <label>최소 금액</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => updateFilter("minAmount", e.target.value)}
                />
              </div>
              <div className="field">
                <label>최대 금액</label>
                <input
                  type="number"
                  placeholder="제한 없음"
                  value={filters.maxAmount}
                  onChange={(e) => updateFilter("maxAmount", e.target.value)}
                />
              </div>
              <div className="field">
                <label>타입</label>
                <select
                  value={filters.type}
                  onChange={(e) => updateFilter("type", e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="EXPENSE">지출</option>
                  <option value="INCOME">수입</option>
                </select>
              </div>
              <div className="field">
                <label>카테고리</label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => updateFilter("categoryId", e.target.value)}
                >
                  <option value="">전체</option>
                  {filterCategoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">검색</button>
              <button type="button" className="btn btn-secondary" onClick={handleResetSearch}>초기화</button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="page-header">
            <div className="card-title" style={{ marginBottom: 0 }}>
              {mode === "search" ? "검색 결과" : "월별 목록"}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {mode === "monthly" && (
                <input
                  type="month"
                  value={yearMonth}
                  onChange={(e) => setYearMonth(e.target.value)}
                />
              )}
              <button type="button" className="btn btn-secondary" onClick={handleExportCsv}>
                CSV 내보내기
              </button>
            </div>
          </div>

          {pageMeta && (
            <p className="meta-line" style={{ marginBottom: 12 }}>
              총 {pageMeta.totalItems}건 · {pageMeta.page + 1}/{Math.max(pageMeta.totalPages, 1)}쪽
            </p>
          )}
          {listMsg && <p className="form-error" style={{ marginBottom: 12 }}>{listMsg}</p>}

          {list.length === 0 ? (
            <div className="empty-state">거래내역이 없습니다.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>타입</th>
                    <th>카테고리</th>
                    <th>금액</th>
                    <th>내용</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((t) => (
                    <tr key={t.id}>
                      <td>{t.transactionDate}</td>
                      <td>
                        <span className={`badge ${t.type === "INCOME" ? "badge-income" : "badge-expense"}`}>
                          {t.type === "INCOME" ? "수입" : "지출"}
                        </span>
                      </td>
                      <td>{t.categoryName}</td>
                      <td className="amount">{t.amount.toLocaleString()}원</td>
                      <td>{t.description ?? ""}</td>
                      <td>
                        <div className="table-actions">
                          <button type="button" className="btn-link" onClick={() => handleEdit(t)}>수정</button>
                          <button type="button" className="btn-link btn-link-danger" onClick={() => handleDelete(t.id)}>삭제</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pageMeta && pageMeta.totalPages > 1 && (
            <div className="pagination-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!pageMeta.hasPrev}
                onClick={() => refresh(page - 1)}
              >
                이전
              </button>
              <span className="meta-line">{page + 1} / {pageMeta.totalPages}</span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!pageMeta.hasNext}
                onClick={() => refresh(page + 1)}
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
