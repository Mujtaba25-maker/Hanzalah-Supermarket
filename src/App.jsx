import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Settings from "./pages/Settings";
import { loadDashboardData } from "./lib/api";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
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
  }, []);

  return (
    <BrowserRouter>
      <Layout refresh={refresh}>
        {loading && <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-500 shadow-card">Loading dashboard data...</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-5 font-semibold text-red-700">{error}</div>}
        {data && !loading && (
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard data={data} />} />
            <Route path="/sales" element={<Sales data={data} refresh={refresh} />} />
            <Route path="/orders" element={<Orders orders={data.orders} products={data.products} refresh={refresh} />} />
            <Route path="/inventory" element={<Inventory products={data.products} suppliers={data.suppliers} refresh={refresh} />} />
            <Route path="/customers" element={<Customers customers={data.customersView} />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        )}
      </Layout>
    </BrowserRouter>
  );
}
