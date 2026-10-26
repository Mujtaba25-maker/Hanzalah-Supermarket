import { NavLink, useLocation } from "react-router-dom";
import { useRef, useState } from "react";
import { FaBell, FaBoxOpen, FaChartBar, FaChartLine, FaCog, FaFileInvoice, FaMoon, FaShoppingCart, FaStore, FaSun, FaTruck, FaUsers } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight, FiRefreshCw } from "react-icons/fi";


const nav = [
  { to: "/dashboard", label: "Dashboard", icon: FaChartLine, roles: ["admin", "manager", "cashier"] },
  { to: "/sales", label: "Sales", icon: FaShoppingCart, roles: ["admin", "manager", "cashier"] },
  { to: "/orders", label: "Orders", icon: FaShoppingCart, roles: ["admin", "manager", "cashier"] },
  { to: "/inventory", label: "Inventory", icon: FaBoxOpen, roles: ["admin", "manager"] },
  { to: "/customers", label: "Customers", icon: FaUsers, roles: ["admin", "manager", "cashier"] },
  { to: "/suppliers", label: "Suppliers", icon: FaTruck, roles: ["admin", "manager"] },
  { to: "/invoice", label: "Invoices", icon: FaFileInvoice, roles: ["admin", "manager", "cashier"] },
  { to: "/reports", label: "Reports", icon: FaChartBar, roles: ["admin", "manager"] },
  { to: "/settings", label: "Settings", icon: FaCog, roles: ["admin"] }
];

const titles = {
  "/dashboard": ["Dashboard", "A real-time command center for store performance."],
  "/sales": ["Sales & Checkout", "Scan products, record sales, and review transactions."],
  "/orders": ["Order Management", "Search, filter, sort, and review customer orders."],
  "/inventory": ["Inventory Management", "Track stock levels, pricing, SKUs, and alerts."],
  "/customers": ["Customer Management", "Review customers, contact details, and order activity."],
  "/suppliers": ["Suppliers", "Manage vendors, purchase stock, and supplier contacts."],
  "/invoice": ["Invoice", "Review paid sales, customer orders, and printable invoice records."],
  "/reports": ["Reports", "Review sales, profit, stock, and operations performance."],
  "/settings": ["Settings", "Store profile, preferences, and dashboard controls."]
};

export default function Layout({ children, refreshing, refresh, currentUser, onLogout, theme = "dark", onToggleTheme }) {
  const drawerRef = useRef(null);
  const menuButtonRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const notifications = currentUser?.notifications || [];
  const [title, subtitle] = titles[location.pathname] || titles["/dashboard"];
  const light = theme === "light";
  const styles = light ? lightStyles : darkStyles;
  const profileLabel = currentUser?.role === "admin" ? "Owner / Admin" : currentUser?.role || "Staff";

  return (
    <div className={`theme-${theme} min-h-screen transition-colors lg:grid lg:grid-cols-[auto_minmax(0,1fr)] ${styles.shell}`}>
      <aside aria-label="Desktop navigation" className={`hidden lg:block ${collapsed ? "lg:w-20" : "lg:w-64"} sticky top-0 z-20 p-4 transition-all lg:h-screen ${styles.sidebar}`}>
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className={collapsed ? "hidden" : "flex min-w-0 items-center gap-3"}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ff2d83] text-xl font-black text-white">
              <FaStore />
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <strong className={`block truncate text-lg font-black ${styles.heading}`}>Hanzala</strong>
                <span className={`block text-xs font-bold uppercase ${styles.subtle}`}>Supermarket</span>
              </div>
            )}
          </div>
          <button aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} className={`hidden rounded-lg p-3 lg:block ${styles.iconButton}`} onClick={() => setCollapsed(value => !value)} type="button">
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
          {nav.filter(item => item.roles.includes(currentUser?.role)).map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={`${item.to}-${item.label}-${index}`}
                aria-label={item.label}
                title={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-extrabold transition ${isActive ? styles.navActive : styles.navIdle} ${collapsed ? "lg:justify-center" : ""}`
                }
              >
                <Icon className={`text-lg ${styles.navIcon}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div className={`mt-8 hidden border-t pt-5 lg:block ${styles.sidebarDivider}`}>
          <button aria-label="Log out" onClick={onLogout} className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold ${styles.logout}`} type="button">
            <FaCog /> {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
      <dialog ref={drawerRef} aria-label="Main navigation" className={"mobile-drawer " + styles.sidebar} onClose={() => menuButtonRef.current?.focus()}>
        <div className="flex items-center justify-between mb-6"><strong>Hanzala Supermarket</strong><button className="btn-muted" onClick={() => drawerRef.current.close()}>Close</button></div>
        <nav className="grid gap-2">{nav.filter(item => item.roles.includes(currentUser?.role)).map(item => <NavLink key={item.to} to={item.to} onClick={() => drawerRef.current.close()} className={({isActive}) => "flex h-12 items-center gap-3 rounded-xl px-3 font-bold " + (isActive ? styles.navActive : styles.navIdle)}><item.icon/>{item.label}</NavLink>)}</nav>
        <button onClick={onLogout} className="btn-muted mt-6 w-full">Log out</button>
      </dialog>

      <div className="min-w-0">
        <header className={`sticky top-0 z-10 border-b px-4 py-4 backdrop-blur lg:px-8 ${styles.header}`}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <button ref={menuButtonRef} aria-label="Open navigation" aria-haspopup="dialog" className="btn-muted h-11 lg:hidden" onClick={() => drawerRef.current.showModal()}>☰</button>
              <div><h1 className={`text-2xl font-black lg:text-3xl ${styles.heading}`}>{title}</h1>
              <p className={`mt-1 text-sm font-medium ${styles.subtle}`}>{subtitle}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button disabled={refreshing} aria-label={refreshing ? "Refreshing data" : "Refresh data"} onClick={refresh} className={`grid h-11 w-11 place-items-center rounded-xl ${styles.iconButton}`} type="button" title="Refresh data">
                <FiRefreshCw />
              </button>
              <div className="static xl:relative">
                <button aria-expanded={showNotifications} aria-label="Notifications" onClick={() => setShowNotifications(value => !value)} className={`relative grid h-11 w-11 place-items-center rounded-xl ${styles.iconButton}`} type="button" title="Notifications">
                  <FaBell />
                  {notifications.length > 0 && <span className={styles.badge}>{notifications.length}</span>}
                </button>
                {showNotifications && (
                  <div className={`absolute left-4 right-4 top-full z-30 w-auto xl:left-auto xl:right-0 xl:top-14 xl:w-80 rounded-2xl border p-3 shadow-soft ${styles.notifications}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <strong className={`text-sm font-black ${styles.heading}`}>Notifications</strong>
                      <span className={`text-xs font-bold ${styles.subtle}`}>{notifications.length} alert(s)</span>
                    </div>
                    <div className="max-h-80 space-y-2 overflow-auto">
                      {notifications.length ? notifications.map(note => (
                        <article key={note.id} className={styles.notificationItem}>
                          <strong className={`block text-sm ${styles.heading}`}>{note.title}</strong>
                          <span className={`text-xs font-semibold ${styles.subtle}`}>{note.message}</span>
                        </article>
                      )) : <p className={`${styles.notificationItem} text-sm font-bold ${styles.subtle}`}>No notifications right now.</p>}
                    </div>
                  </div>
                )}
              </div>
              <details className="relative ml-auto min-w-0">
                <summary className={"flex min-h-11 max-w-[200px] cursor-pointer list-none items-center gap-2 rounded-xl px-3 " + styles.profile}>
                  <span className="min-w-0"><strong className="block truncate text-sm">{currentUser?.name || currentUser?.username}</strong><span className={"block text-[11px] capitalize " + styles.subtle}>{profileLabel}</span></span><span aria-hidden="true">⌄</span>
                </summary>
                <div className={"absolute right-0 top-14 z-30 w-48 rounded-xl border p-2 shadow-soft " + styles.notifications}><button className="btn-muted w-full" type="button" onClick={onLogout}>Log out</button></div>
              </details>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      <button className={styles.themeToggle} onClick={onToggleTheme} type="button" title={light ? "Switch to dark mode" : "Switch to white mode"} aria-label={light ? "Switch to dark mode" : "Switch to white mode"}>
        {light ? <FaMoon /> : <FaSun />}
      </button>
    </div>
  );
}

const darkStyles = {
  shell: "bg-[#181818] text-white",
  sidebar: "bg-[#151515] text-white",
  header: "border-white/5 bg-[#1b1b1b]/95",
  heading: "text-white",
  subtle: "text-[#a9b4c5]",
  navActive: "bg-[#242424] text-white shadow-[inset_3px_0_0_#ff2d83]",
  navIdle: "text-[#c6c6c6] hover:bg-[#202020] hover:text-white",
  navIcon: "text-white/90",
  iconButton: "bg-[#242424] text-white hover:bg-[#303030]",
  searchIcon: "text-[#686868]",
  searchInput: "h-11 w-full rounded-2xl border border-white/10 bg-[#151515] pl-11 pr-3 text-sm text-white outline-none focus:border-[#ff2d83] focus:ring-4 focus:ring-[#ff2d83]/10",
  badge: "absolute right-1.5 top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff2d83] px-1 text-[10px] font-black text-white ring-2 ring-[#242424]",
  notifications: "border-white/10 bg-[#151515]",
  notificationItem: "rounded-xl bg-white/5 p-3",
  profile: "bg-[#090b18] text-white",
  sidebarDivider: "border-white/5",
  logout: "text-[#bdbdbd] hover:bg-[#202020]",
  themeToggle: "fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-[#151515] text-xl text-[#d9ff3f] shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:bg-[#242424]"
};

const lightStyles = {
  shell: "bg-[#f7f7f8] text-slate-950",
  sidebar: "border-r border-slate-200 bg-white text-slate-950",
  header: "border-slate-200 bg-white/95",
  heading: "text-slate-950",
  subtle: "text-slate-500",
  navActive: "bg-slate-100 text-slate-950 shadow-[inset_3px_0_0_#2563eb]",
  navIdle: "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
  navIcon: "text-slate-600",
  iconButton: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  searchIcon: "text-slate-400",
  searchInput: "h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
  badge: "absolute right-1.5 top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white ring-2 ring-white",
  notifications: "border-slate-200 bg-white",
  notificationItem: "rounded-xl bg-slate-50 p-3",
  profile: "border border-slate-200 bg-white text-slate-800",
  sidebarDivider: "border-slate-200",
  logout: "text-slate-600 hover:bg-slate-50",
  themeToggle: "fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full border border-slate-200 bg-white text-xl text-slate-800 shadow-[0_18px_50px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-50"
};
