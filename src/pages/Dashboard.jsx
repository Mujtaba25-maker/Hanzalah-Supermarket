import { Link } from "react-router-dom";
import { FaBoxOpen, FaCashRegister, FaChartLine, FaExclamationTriangle, FaFileInvoice, FaMoneyBillWave, FaReceipt, FaShoppingCart, FaUserPlus, FaUsers } from "react-icons/fa";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "../lib/format";

const colors = ["#ff7a1a", "#35f4df", "#d9ff3f", "#ff2d83", "#8b5cf6"];

export default function Dashboard({ data, theme = "dark" }) {
  const isLight = theme === "light";
  const styles = getStyles(isLight);
  const activeOrders = data.orders.filter(order => order.status !== "delivered").length;
  const pendingOrders = data.orders.filter(order => order.status === "pending").length;
  const trendSales = data.analytics.salesTrend.reduce((sum, day) => sum + day.sales, 0);
  const trendProfit = data.analytics.salesTrend.reduce((sum, day) => sum + day.profit, 0);
  const categoryTotal = data.analytics.categorySales.reduce((sum, category) => sum + category.value, 0);
  const todayKey = toDateKey(new Date());
  const todaysSales = data.sales.filter(sale => toDateKey(new Date(sale.createdAt || sale.date)) === todayKey);
  const todayRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
  const todayProfit = todaysSales.reduce((sum, sale) => sum + sale.profit, 0);
  const recentTransactions = data.sales.slice().reverse().slice(0, 6);
  const lowStockItems = (data.summary.lowStockItems || []).slice(0, 4);
  const quickActions = [
    { title: "New Sale", note: "Scan or choose product", icon: FaCashRegister, href: "/sales", color: isLight ? "bg-blue-600 text-white" : "bg-[#ff2d83] text-white" },
    { title: "New Order", note: "Create customer order", icon: FaFileInvoice, href: "/orders", color: isLight ? "bg-emerald-600 text-white" : "bg-[#ff7a1a] text-[#101010]" },
    { title: "Add Customer", note: "Save buyer details", icon: FaUserPlus, href: "/customers", color: isLight ? "bg-amber-500 text-slate-950" : "bg-[#35f4df] text-[#101010]" },
    { title: "Print Invoice", note: "Open receipt center", icon: FaReceipt, href: "/invoice", color: isLight ? "bg-rose-600 text-white" : "bg-[#d9ff3f] text-[#101010]" }
  ];
  const attentionItems = [
    { label: "Pending orders", value: pendingOrders, hint: "Need update or delivery", href: "/orders" },
    { label: "Low stock items", value: data.summary.lowStock, hint: "Check before selling", href: "/inventory" },
    { label: "Active orders", value: activeOrders, hint: "Still not delivered", href: "/orders" }
  ];
  const metrics = [
    { title: "Total Sales", value: money(data.summary.totalSales ?? data.summary.salesRevenue), detail: "Revenue", icon: FaChartLine, tone: styles.metricBlue },
    { title: "Total Expense", value: money(data.summary.totalExpense), detail: "Cost of goods sold", icon: FaReceipt, tone: styles.metricRose },
    { title: "Total Profit", value: money(data.summary.totalProfit ?? data.summary.profit), detail: "Sales minus expense", icon: FaMoneyBillWave, tone: styles.metricGreen },
    { title: "Active Orders", value: activeOrders, detail: `${pendingOrders} pending`, icon: FaShoppingCart, tone: styles.metricBlue },
    { title: "Total Customers", value: data.customersView.length, detail: "Customer records", icon: FaUsers, tone: styles.metricAmber },
    { title: "Low Stock Items", value: data.summary.lowStock, detail: "Needs reorder", icon: FaBoxOpen, tone: styles.metricRose }
  ];

  return (
    <div className={`space-y-6 rounded-[1.75rem] p-4 transition-colors sm:p-6 ${styles.page}`}>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className={styles.panel}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={`text-sm font-black uppercase ${styles.eyebrow}`}>Cashier workspace</p>
              <h1 className={`mt-2 text-2xl font-black sm:text-3xl ${styles.heading}`}>Today at a glance</h1>
              <p className={`mt-2 max-w-2xl text-sm font-semibold ${styles.muted}`}>Fast access to sales, orders, customers, and invoices from one place.</p>
            </div>
            <Link to="/sales" className={styles.primaryButton}>
              <FaCashRegister />
              Start Sale
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MiniSummary label="Today sales" value={money(todayRevenue)} detail={`${todaysSales.length} transaction(s)`} tone={styles.valueBlue} styles={styles} />
            <MiniSummary label="Today profit" value={money(todayProfit)} detail="Live from backend sales" tone={styles.valueGreen} styles={styles} />
            <MiniSummary label="Needs attention" value={pendingOrders + data.summary.lowStock} detail="Orders and low stock" tone={styles.valueRose} styles={styles} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Link key={action.title} to={action.href} className={styles.actionCard}>
                  <span className={`grid h-11 w-11 place-items-center rounded-2xl text-lg ${action.color}`}>
                    <Icon />
                  </span>
                  <strong className={`mt-4 block text-sm font-black ${styles.heading}`}>{action.title}</strong>
                  <span className={`mt-1 block text-xs font-bold ${styles.muted}`}>{action.note}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <DashboardCard title="Attention Queue" icon={FaExclamationTriangle} styles={styles}>
          <div className="grid gap-3">
            {attentionItems.map(item => (
              <Link key={item.label} to={item.href} className={styles.queueItem}>
                <span>
                  <strong className={`block text-sm font-black ${styles.heading}`}>{item.label}</strong>
                  <span className={`mt-1 block text-xs font-bold ${styles.muted}`}>{item.hint}</span>
                </span>
                <span className={styles.queueValue}>{item.value}</span>
              </Link>
            ))}
            {lowStockItems.length > 0 && (
              <div className={styles.warningBox}>
                <strong className={`text-sm font-black ${styles.warningText}`}>Lowest stock</strong>
                <div className="mt-3 grid gap-2">
                  {lowStockItems.map(product => (
                    <div key={product.id} className="flex items-center justify-between gap-3 text-xs font-bold">
                      <span className={`truncate ${styles.bodyText}`}>{product.name}</span>
                      <span className={styles.stockPill}>{product.stock} left</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DashboardCard>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(metric => <MetricCard key={metric.title} {...metric} styles={styles} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        <DashboardCard title="Order Summary" icon={FaChartLine} styles={styles} action={<FilterSelect options={["Last Month", "This Week", "This Year"]} styles={styles} />}>
          <div className="mb-4 flex flex-wrap gap-3 text-sm">
            <span className={styles.salesPill}>Selected period: {money(trendSales)}</span>
            <span className={styles.profitPill}>Profit: {money(trendProfit)}</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.analytics.salesTrend}>
                <CartesianGrid strokeDasharray="3 7" stroke={styles.chartGrid} vertical={false} />
                <XAxis dataKey="label" stroke={styles.axis} tickLine={false} axisLine={{ stroke: styles.chartGrid }} />
                <YAxis stroke={styles.axis} tickLine={false} axisLine={false} />
                <Tooltip formatter={value => money(value)} contentStyle={styles.tooltip} />
                <Line type="monotone" dataKey="sales" stroke={styles.lineSales} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: styles.lineSales }} />
                <Line type="monotone" dataKey="profit" stroke={styles.lineProfit} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: styles.lineProfit }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        <DashboardCard title="Top Categories" icon={FaShoppingCart} styles={styles} action={<FilterSelect options={["Last Month", "This Week"]} styles={styles} />}>
          {data.analytics.categorySales.length ? (
            <div className="grid gap-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.analytics.categorySales} dataKey="value" nameKey="name" innerRadius={58} outerRadius={104} paddingAngle={2}>
                      {data.analytics.categorySales.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                    </Pie>
                    <Tooltip formatter={value => money(value)} contentStyle={styles.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.analytics.categorySales.map((category, index) => (
                  <div key={category.name} className={styles.categoryItem}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className={`flex items-center gap-2 font-black ${styles.bodyText}`}>
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                        {category.name}
                      </span>
                      <span className={`font-black ${styles.heading}`}>{Math.round((category.value / categoryTotal) * 100)}%</span>
                    </div>
                    <strong className={`mt-1 block text-xs ${styles.muted}`}>{money(category.value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>No category sales yet.</div>
          )}
        </DashboardCard>
      </div>

      <DashboardCard title="Recent Transactions" icon={FaReceipt} styles={styles} action={<FilterSelect options={["Last Month", "This Week"]} styles={styles} />}>
        <div className="overflow-auto">
          <table className={`w-full min-w-[640px] text-left text-sm ${styles.tableText}`}>
            <thead className={`text-xs uppercase ${styles.tableHead}`}>
              <tr>{["Customer Name", "Total Payment", "Date", "Status"].map(item => <th key={item} className="px-4 py-3 font-black">{item}</th>)}</tr>
            </thead>
            <tbody className={styles.tableBody}>
              {recentTransactions.map(sale => (
                <tr key={sale.id} className={styles.tableRow}>
                  <td className={`px-4 py-3 font-bold ${styles.heading}`}>{sale.customerName || "Walk-in Customer"}</td>
                  <td className={`px-4 py-3 font-black ${styles.bodyText}`}>{money(sale.total)}</td>
                  <td className={`px-4 py-3 ${styles.muted}`}>{formatSaleDate(sale)}</td>
                  <td className="px-4 py-3"><span className={styles.statusPill}>Completed</span></td>
                </tr>
              ))}
              {!recentTransactions.length && (
                <tr>
                  <td className={`px-4 py-6 ${styles.muted}`} colSpan="4">No recent transactions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      <DashboardCard title="Top Selling Products" icon={FaBoxOpen} styles={styles}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.analytics.topProducts}>
              <CartesianGrid strokeDasharray="3 7" stroke={styles.chartGrid} vertical={false} />
              <XAxis dataKey="name" stroke={styles.axis} tickLine={false} axisLine={{ stroke: styles.chartGrid }} />
              <YAxis stroke={styles.axis} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={styles.tooltip} />
              <Bar dataKey="units" fill={styles.barFill} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>
    </div>
  );
}

function DashboardCard({ title, icon: Icon, action, children, styles }) {
  return (
    <section className={styles.card}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={styles.cardIcon} />}
          <h2 className={`text-lg font-black ${styles.heading}`}>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MiniSummary({ label, value, detail, tone, styles }) {
  return (
    <div className={styles.summaryBox}>
      <span className={`text-xs font-black uppercase ${styles.muted}`}>{label}</span>
      <strong className={`mt-2 block text-2xl font-black ${tone}`}>{value}</strong>
      <p className={`mt-1 text-xs font-bold ${styles.muted}`}>{detail}</p>
    </div>
  );
}

function MetricCard({ title, value, detail, icon: Icon, tone, styles }) {
  return (
    <article className={styles.metricCard}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm font-bold ${styles.muted}`}>{title}</p>
          <strong className={`mt-2 block text-3xl font-black ${styles.heading}`}>{value}</strong>
          <span className={styles.metricPill}>{detail}</span>
        </div>
        <span className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${tone}`}>
          <Icon />
        </span>
      </div>
    </article>
  );
}

function FilterSelect({ options, styles }) {
  return (
    <select className={styles.select}>
      {options.map(option => <option key={option}>{option}</option>)}
    </select>
  );
}

function getStyles(isLight) {
  if (isLight) {
    return {
      page: "bg-slate-50 text-slate-950",
      panel: "rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:p-6",
      card: "rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)]",
      metricCard: "rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,0.1)]",
      actionCard: "group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/70",
      summaryBox: "rounded-2xl border border-slate-200 bg-slate-50 p-4",
      queueItem: "flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50",
      queueValue: "grid h-11 min-w-11 place-items-center rounded-2xl bg-white px-3 text-lg font-black text-rose-700 shadow-sm",
      warningBox: "rounded-2xl border border-rose-100 bg-rose-50 p-4",
      stockPill: "rounded-full bg-white px-2 py-1 text-rose-700 shadow-sm",
      categoryItem: "rounded-xl border border-slate-100 bg-slate-50 p-3",
      emptyState: "rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500",
      tableHead: "bg-slate-50 text-slate-500",
      tableBody: "divide-y divide-slate-100",
      tableRow: "hover:bg-slate-50",
      tableText: "text-slate-700",
      statusPill: "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700",
      metricPill: "mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600",
      salesPill: "rounded-full bg-blue-50 px-3 py-1 font-black text-blue-700",
      profitPill: "rounded-full bg-emerald-50 px-3 py-1 font-black text-emerald-700",
      select: "h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
      primaryButton: "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700",
      heading: "text-slate-950",
      bodyText: "text-slate-700",
      muted: "text-slate-500",
      eyebrow: "text-blue-700",
      cardIcon: "text-blue-700",
      warningText: "text-rose-800",
      valueBlue: "text-blue-700",
      valueGreen: "text-emerald-700",
      valueRose: "text-rose-700",
      metricBlue: "text-blue-700 bg-blue-50",
      metricGreen: "text-emerald-700 bg-emerald-50",
      metricAmber: "text-amber-700 bg-amber-50",
      metricRose: "text-rose-700 bg-rose-50",
      tooltip: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, color: "#111827", boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)" },
      chartGrid: "#e5e7eb",
      axis: "#64748b",
      lineSales: "#2563eb",
      lineProfit: "#10b981",
      barFill: "#2563eb"
    };
  }

  return {
    page: "bg-[#101114] text-neutral-100",
    panel: "rounded-3xl border border-white/10 bg-[#151515] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] sm:p-6",
    card: "rounded-3xl border border-white/10 bg-[#151515] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]",
    metricCard: "rounded-3xl border border-white/5 bg-[#151515] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:border-[#ff2d83]/30",
    actionCard: "group rounded-2xl border border-white/10 bg-[#101010] p-4 transition hover:-translate-y-0.5 hover:border-pink-400/40 hover:bg-[#1d1d1d]",
    summaryBox: "rounded-2xl border border-white/10 bg-white/5 p-4",
    queueItem: "flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-4 transition hover:bg-white/10",
    queueValue: "grid h-11 min-w-11 place-items-center rounded-2xl bg-[#1f1f1f] px-3 text-lg font-black text-[#ff2d83]",
    warningBox: "rounded-2xl border border-pink-400/20 bg-pink-500/10 p-4",
    stockPill: "rounded-full bg-black/20 px-2 py-1 text-pink-100",
    categoryItem: "rounded-xl bg-white/5 p-3",
    emptyState: "rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-neutral-400",
    tableHead: "bg-[#202020] text-neutral-500",
    tableBody: "divide-y divide-white/10",
    tableRow: "hover:bg-white/5",
    tableText: "text-neutral-200",
    statusPill: "rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300",
    metricPill: "mt-3 inline-flex rounded-full bg-[#1f1f1f] px-2.5 py-1 text-xs font-black text-[#6df2a8]",
    salesPill: "rounded-full bg-teal-50 px-3 py-1 font-black text-teal-300",
    profitPill: "rounded-full bg-pink-500/10 px-3 py-1 font-black text-pink-300",
    select: "h-9 rounded-xl border border-white/10 bg-[#101010] px-3 text-xs font-bold text-neutral-200 outline-none transition hover:border-pink-400/40 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10",
    primaryButton: "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff2d83] px-4 text-sm font-black text-white shadow-lg shadow-pink-500/15 transition hover:bg-[#ff4b95]",
    heading: "text-white",
    bodyText: "text-neutral-200",
    muted: "text-neutral-400",
    eyebrow: "text-[#35f4df]",
    cardIcon: "text-[#ff2d83]",
    warningText: "text-pink-200",
    valueBlue: "text-[#35f4df]",
    valueGreen: "text-[#d9ff3f]",
    valueRose: "text-[#ff2d83]",
    metricBlue: "text-[#ff8a3d] bg-white/5",
    metricGreen: "text-[#38f2e1] bg-white/5",
    metricAmber: "text-[#d4ff36] bg-white/5",
    metricRose: "text-[#ff2d83] bg-white/5",
    tooltip: { background: "#1f1f1f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" },
    chartGrid: "rgba(255,255,255,0.13)",
    axis: "#737373",
    lineSales: "#35f4df",
    lineProfit: "#ff2d83",
    barFill: "#ff7a1a"
  };
}

function toDateKey(date) {
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSaleDate(sale) {
  const date = new Date(sale.createdAt || sale.date);
  if (Number.isNaN(date.getTime())) return sale.date || "-";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}