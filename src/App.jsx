import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import Layout from "./components/Layout";
import { loadDashboardData } from "./lib/api";

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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = session?.user ? { ...session.user, notifications: data?.notifications || [] } : null;

  const refresh = async () => {
    if (!session) return;
    setLoading(true);
    try {
      setData(await loadDashboardData());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [session]);

  const handleLogin = nextSession => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setData(null);
    setError("");
  };

  if (!session) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Login onLogin={handleLogin} />
      </Suspense>
    );
  }

  return (
    <BrowserRouter>
      <Layout refresh={refresh} currentUser={currentUser} onLogout={handleLogout}>
        {loading && <div className="rounded-2xl border border-white/10 bg-[#151515] p-8 font-bold text-neutral-400 shadow-card">Loading dashboard data...</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-5 font-semibold text-red-700">{error}</div>}
        {data && !loading && (
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard data={data} />} />
            <Route path="/sales" element={<Sales data={data} refresh={refresh} />} />
            <Route path="/orders" element={<Orders orders={data.orders} products={data.products} refresh={refresh} />} />
            <Route path="/inventory" element={canAccess(currentUser, "inventory") ? <Inventory products={data.products} suppliers={data.suppliers} refresh={refresh} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/customers" element={<Customers customers={data.customersView} refresh={refresh} />} />
            <Route path="/suppliers" element={canAccess(currentUser, "suppliers") ? <Suppliers suppliers={data.suppliers} products={data.products} purchases={data.purchases} refresh={refresh} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/invoice" element={<Invoice sales={data.sales} orders={data.orders} customers={data.customers} />} />
            <Route path="/reports" element={canAccess(currentUser, "reports") ? <Reports data={data} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/settings" element={canAccess(currentUser, "settings") ? <Settings settings={data.settings} users={data.users} audits={data.audits} refresh={refresh} /> : <Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
        )}
      </Layout>
    </BrowserRouter>
  );
}

function PageLoader() {
  return <div className="rounded-2xl border border-white/10 bg-[#151515] p-8 font-bold text-neutral-400 shadow-card">Loading page...</div>;
}
