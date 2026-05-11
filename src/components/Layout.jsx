import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { FaBell, FaBoxOpen, FaChartBar, FaChartLine, FaCog, FaFileInvoice, FaSearch, FaShoppingCart, FaStore, FaTruck, FaUsers } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight, FiRefreshCw } from "react-icons/fi";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: FaChartLine, roles: ["admin", "manager", "cashier"] },
  { to: "/sales", label: "Sales", icon: FaShoppingCart, roles: ["admin", "manager", "cashier"] },
  { to: "/orders", label: "Orders", icon: FaShoppingCart, roles: ["admin", "manager", "cashier"] },
  { to: "/inventory", label: "Inventory", icon: FaBoxOpen, roles: ["admin", "manager"] },
  { to: "/customers", label: "Customers", icon: FaUsers, roles: ["admin", "manager", "cashier"] },
  { to: "/suppliers", label: "Suppliers", icon: FaTruck, roles: ["admin", "manager"] },
  { to: "/invoice", label: "Invoice", icon: FaFileInvoice, roles: ["admin", "manager", "cashier"] },
  { to: "/reports", label: "Reports", icon: FaChartBar, roles: ["admin", "manager"] },
  { to: "/settings", label: "Settings", icon: FaCog, roles: ["admin"] }
];

const titles = {
  "/dashboard": ["Dashboard", "A real-time command center for store performance."],
  "/sales": ["Sales Analytics", "Trends, product performance, and category mix."],
  "/orders": ["Order Management", "Search, filter, sort, and review customer orders."],
  "/inventory": ["Inventory Management", "Track stock levels, pricing, SKUs, and alerts."],
  "/customers": ["Customer Management", "Review customers, contact details, and order activity."],
  "/suppliers": ["Suppliers", "Manage vendors, purchase stock, and supplier contacts."],
  "/invoice": ["Invoice", "Review paid sales, customer orders, and printable invoice records."],
  "/reports": ["Reports", "Review sales, profit, stock, and operations performance."],
  "/settings": ["Settings", "Store profile, preferences, and dashboard controls."]
};

export default function Layout({ children, refresh, currentUser, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const notifications = currentUser?.notifications || [];
  const [title, subtitle] = titles[location.pathname] || titles["/dashboard"];

  return (
    <div className="min-h-screen bg-[#181818] text-white lg:grid lg:grid-cols-[auto_minmax(0,1fr)]">
      <aside className={`${collapsed ? "lg:w-20" : "lg:w-64"} sticky top-0 z-20 bg-[#151515] p-4 text-white transition-all lg:h-screen`}>
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ff2d83] text-xl font-black text-white">
              <FaStore />
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <strong className="block truncate text-lg font-black">Hanzala</strong>
                <span className="block text-xs font-bold uppercase tracking-wide text-[#868686]">Supermarket</span>
              </div>
            )}
          </div>
          <button className="hidden rounded-lg bg-white/5 p-2 text-[#a6a6a6] hover:bg-white/10 lg:block" onClick={() => setCollapsed(value => !value)} type="button">
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
          {nav.filter(item => item.roles.includes(currentUser?.role)).map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={`${item.to}-${item.label}-${index}`}
                to={item.to}
                className={({ isActive }) =>
                  `flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-extrabold transition ${
                    isActive ? "bg-[#242424] text-white shadow-[inset_3px_0_0_#ff2d83]" : "text-[#c6c6c6] hover:bg-[#202020] hover:text-white"
                  } ${collapsed ? "lg:justify-center" : ""}`
                }
              >
                <Icon className="text-lg text-white/90" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-8 hidden border-t border-white/5 pt-5 lg:block">
          <button onClick={onLogout} className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-[#bdbdbd] hover:bg-[#202020]" type="button">
            <FaCog /> Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 border-b border-white/5 bg-[#1b1b1b]/95 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-black text-white lg:text-3xl">{title}</h1>
              <p className="mt-1 text-sm font-medium text-[#8d9bb0]">{subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative min-w-0 flex-1 sm:w-80 sm:flex-none">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#686868]" />
                <input className="h-11 w-full rounded-2xl border border-white/10 bg-[#151515] pl-11 pr-3 text-sm text-white outline-none focus:border-[#ff2d83] focus:ring-4 focus:ring-[#ff2d83]/10" placeholder="Search" />
              </label>
              <button onClick={refresh} className="grid h-11 w-11 place-items-center rounded-xl bg-[#242424] text-white hover:bg-[#303030]" type="button" title="Refresh data">
                <FiRefreshCw />
              </button>
              <div className="relative">
                <button onClick={() => setShowNotifications(value => !value)} className="relative grid h-11 w-11 place-items-center rounded-xl bg-[#242424] text-white hover:bg-[#303030]" type="button" title="Notifications">
                  <FaBell />
                  {notifications.length > 0 && <span className="absolute right-1.5 top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff2d83] px-1 text-[10px] font-black ring-2 ring-[#242424]">{notifications.length}</span>}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-14 z-30 w-80 rounded-2xl border border-white/10 bg-[#151515] p-3 shadow-soft">
                    <div className="mb-2 flex items-center justify-between">
                      <strong className="text-sm font-black">Notifications</strong>
                      <span className="text-xs font-bold text-neutral-500">{notifications.length} alert(s)</span>
                    </div>
                    <div className="max-h-80 space-y-2 overflow-auto">
                      {notifications.length ? notifications.map(note => (
                        <article key={note.id} className="rounded-xl bg-white/5 p-3">
                          <strong className="block text-sm text-white">{note.title}</strong>
                          <span className="text-xs font-semibold text-neutral-400">{note.message}</span>
                        </article>
                      )) : <p className="rounded-xl bg-white/5 p-3 text-sm font-bold text-neutral-400">No notifications right now.</p>}
                    </div>
                  </div>
                )}
              </div>
              <button className="flex h-11 items-center gap-2 rounded-xl bg-[#090b18] px-3 text-sm font-black text-white" type="button">
                <img className="h-8 w-8 rounded-full object-cover ring-2 ring-[#38f2e1]/40" src="/admin-profile.jpeg" alt={`${currentUser?.name || "Admin"} profile`} />
                <span className="hidden sm:inline">{currentUser?.role || "staff"}</span>
              </button>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
