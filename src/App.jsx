import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Layout from "./components/Layout";
import { loadDashboardData, logout } from "./lib/api";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Orders = lazy(() => import("./pages/Orders"));
const Customers = lazy(() => import("./pages/Customers"));
const Sales = lazy(() => import("./pages/Sales"));
const Settings = lazy(() => import("./pages/Settings"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Invoice = lazy(() => import("./pages/Invoice"));
const Login = lazy(() => import("./pages/Login"));
const Reports = lazy(() => import("./pages/Reports"));

const SESSION_KEY = "hanzalah-session";
const THEME_KEY = "hanzalah-theme";
const roleAccess = {
  dashboard: ["admin", "manager", "cashier"],
  sales: ["admin", "manager", "cashier"],
  orders: ["admin", "manager", "cashier"],
  inventory: ["admin", "manager"],
  customers: ["admin", "manager", "cashier"],
  suppliers: ["admin", "manager"],
  invoice: ["admin", "manager", "cashier"],
  reports: ["admin", "manager"],
  settings: ["admin"]
};

function canAccess(user, area) {
  return roleAccess[area]?.includes(user?.role);
}

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  });
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const requestRef = useRef(0);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = session?.user ? { ...(data?.currentUser || session.user), notifications: data?.notifications || [] } : null;

  const refresh = async () => {
    if (!session) return;
    const requestId = ++requestRef.current;
    setRefreshing(true);
    const showFullLoader = !data;
    setLoading(showFullLoader);
    try {
      const nextData = await loadDashboardData();
      if (requestId !== requestRef.current) return;
      setData(nextData);
      setError("");
    } catch (err) {
      if (requestId !== requestRef.current) return;
      if (err.message === "SESSION_EXPIRED") {
        handleLogout(true);
        return;
      }
      setError(err.message);
    } finally {
      if (requestId === requestRef.current) { setLoading(false); setRefreshing(false); }
    }
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    refresh();
  }, [session]);

  const handleLogin = nextSession => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const handleLogout = async (expired = false) => {
    if (expired !== true) {
      try { await logout(); } catch (err) { setError(err.message); return; }
    }
    requestRef.current += 1;
    setRefreshing(false);
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setData(null);
    setError("");
  };

  const toggleTheme = () => setTheme(value => (value === "dark" ? "light" : "dark"));

  if (!session) {
    return (
      <Suspense fallback={<PageLoader theme={theme} />}>
        <Login onLogin={handleLogin} />
      </Suspense>
    );
  }

  return (
    <BrowserRouter>
      <Layout refreshing={refreshing} refresh={refresh} currentUser={currentUser} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme}>
        {data?.settings?.demo && <p className="mb-4 rounded-xl border border-pink-400/30 bg-pink-500/10 p-3 text-sm font-bold">DEMO DATA · Sample records for portfolio demonstration.</p>}
        {loading && !data && <div className="rounded-2xl border border-white/10 bg-[#151515] p-8 font-bold text-neutral-400 shadow-card">Loading dashboard data...</div>}
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-5 font-semibold text-red-700">{data ? "Refresh failed. Displaying the last successfully loaded data. " : "Data could not be loaded. "}{error} <button className="btn-muted" onClick={refresh}>Retry</button></div>}
        {data && (
          <Suspense fallback={<PageLoader theme={theme} />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard data={data} currentUser={currentUser} theme={theme} />} />
              <Route path="/sales" element={<Sales data={data} refresh={refresh} />} />
              <Route path="/orders" element={<Orders orders={data.orders} products={data.products} refresh={refresh} />} />
              <Route path="/inventory" element={canAccess(currentUser, "inventory") ? <Inventory products={data.products} suppliers={data.suppliers} refresh={refresh} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/customers" element={<Customers customers={data.customersView} refresh={refresh} />} />
              <Route path="/suppliers" element={canAccess(currentUser, "suppliers") ? <Suppliers suppliers={data.suppliers} products={data.products} purchases={data.purchases} refresh={refresh} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/invoice" element={<Invoice sales={data.sales} orders={data.orders} customers={data.customers} settings={data.settings} />} />
              <Route path="/reports" element={canAccess(currentUser, "reports") ? <Reports data={data} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/settings" element={canAccess(currentUser, "settings") ? <Settings settings={data.settings} users={data.users} audits={data.audits} refresh={refresh} /> : <Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        )}
      </Layout>
    </BrowserRouter>
  );
}

function PageLoader({ theme = "dark" }) {
  const light = theme === "light";
  return <div className={`rounded-2xl border p-8 font-bold shadow-card ${light ? "border-slate-200 bg-white text-slate-500" : "border-white/10 bg-[#151515] text-neutral-400"}`}>Loading page...</div>;
}
