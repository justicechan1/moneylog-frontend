import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Transactions from "./pages/Transactions";
import Statistics from "./pages/Statistics";
import RequireAuth from "./RequireAuth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/transactions" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/transactions"
          element={
            <RequireAuth>
              <Transactions />
            </RequireAuth>
          }
        />
        <Route
          path="/statistics"
          element={
            <RequireAuth>
              <Statistics />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
