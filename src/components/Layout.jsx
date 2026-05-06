import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { FaBell, FaBoxOpen, FaChartLine, FaCog, FaSearch, FaShoppingCart, FaStore, FaUsers } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight, FiRefreshCw } from "react-icons/fi";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: FaChartLine },
  { to: "/sales", label: "Sales", icon: FaShoppingCart },
  { to: "/orders", label: "Orders", icon: FaShoppingCart },
  { to: "/inventory", label: "Inventory", icon: FaBoxOpen },
  { to: "/customers", label: "Customers", icon: FaUsers },
  { to: "/settings", label: "Settings", icon: FaCog }
];

const titles = {
  "/dashboard": ["Dashboard", "A real-time command center for store performance."],
  "/sales": ["Sales Analytics", "Trends, product performance, and category mix."],
  "/orders": ["Order Management", "Search, filter, sort, and review customer orders."],
  "/inventory": ["Inventory Management", "Track stock levels, pricing, SKUs, and alerts."],
  "/customers": ["Customer Management", "Review customers, contact details, and order activity."],
  "/settings": ["Settings", "Store profile, preferences, and dashboard controls."]
};

export default function Layout({ children, refresh }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [title, subtitle] = titles[location.pathname] || titles["/dashboard"];

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[auto_minmax(0,1fr)]">
      <aside className={`${collapsed ? "lg:w-20" : "lg:w-72"} sticky top-0 z-20 bg-slate-950 p-4 text-white transition-all lg:h-screen`}>
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-400 text-xl font-black text-slate-950">
              <FaStore />
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <strong className="block truncate text-lg font-black">Hanzalah Supermarket</strong>
                <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Store Admin</span>
              </div>
            )}
          </div>
          <button className="hidden rounded-lg bg-white/10 p-2 text-slate-300 hover:bg-white/15 lg:block" onClick={() => setCollapsed(value => !value)} type="button">
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        <nav className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-1">
          {nav.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-extrabold transition ${
                    isActive ? "bg-teal-500 text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                  } ${collapsed ? "lg:justify-center" : ""}`
                }
              >
                <Icon className="text-lg" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur lg:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-950 lg:text-3xl">{title}</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative min-w-0 flex-1 sm:w-80 sm:flex-none">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" placeholder="Search dashboard..." />
              </label>
              <button onClick={refresh} className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200" type="button" title="Refresh data">
                <FiRefreshCw />
              </button>
              <button className="relative grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200" type="button" title="Notifications">
                <FaBell />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
              <button className="flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-black text-white" type="button">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-400 text-xs text-slate-950">AM</span>
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
