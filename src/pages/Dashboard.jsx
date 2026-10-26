import { useState } from "react";
import { Link } from "react-router-dom";
import { FaBoxOpen, FaCashRegister, FaChartLine, FaExclamationTriangle, FaFileInvoice, FaMoneyBillWave, FaReceipt, FaShoppingCart, FaUserPlus, FaUsers } from "react-icons/fa";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "../lib/format";
import { buildAnalytics, displayName, PERIODS, TIMEZONE } from "../lib/analytics.mjs";
const colors = ["#ff7a1a", "#35f4df", "#d9ff3f", "#ff2d83", "#8b5cf6"];

export default function Dashboard({ data, currentUser, theme = "dark" }) {
  const [period, setPeriod] = useState("month");
  const styles = getStyles(theme === "light");
  const role = currentUser.role;
  const cashier = role === "cashier", manager = role === "manager";
  const analytics = buildAnalytics(data, period);
  const today = buildAnalytics(data, "today");
  const activeOrders = data.orders.filter(row => row.status !== "delivered").length;
  const pending = data.orders.filter(row => row.status === "pending").length;
  const lowStock = data.products.filter(row => row.stock <= row.minStock).sort((a,b) => a.stock-b.stock);
  const categoryTotal = analytics.categorySales.reduce((sum, row) => sum + row.value, 0);
  const actions = cashier ? [
    ["Start a sale", "Scan or choose a product", "/sales", FaCashRegister],
    ["Customer lookup", "Find or add a customer", "/customers", FaUserPlus],
    ["Receipts", "Review and print your receipts", "/invoice", FaReceipt],
    ["New order", "Create a customer order", "/orders", FaShoppingCart]
  ] : manager ? [
    ["Review inventory", "Check stock and pricing", "/inventory", FaBoxOpen],
    ["Manage orders", "Review pending deliveries", "/orders", FaShoppingCart],
    ["Suppliers", "Purchase and replenish stock", "/suppliers", FaUsers],
    ["Operations reports", "Review sales and stock", "/reports", FaChartLine]
  ] : [
    ["Store reports", "Review financial performance", "/reports", FaChartLine],
    ["Inventory", "Manage products and stock", "/inventory", FaBoxOpen],
    ["Team & settings", "Manage staff access", "/settings", FaUsers],
    ["Start a sale", "Open the checkout", "/sales", FaCashRegister]
  ];
  const metrics = cashier ? [
    ["Your net sales", money(analytics.totals.revenue), "Selected period · after refunds", FaCashRegister],
    ["Your transactions", analytics.sales.length, "Selected period · recorded sales", FaReceipt],
    ["Your refunds", money(analytics.totals.refunds), "Selected period · returned sales", FaShoppingCart]
  ] : manager ? [
    ["Low stock products", lowStock.length, "Current stock · needs reorder", FaBoxOpen],
    ["Active orders", activeOrders, "Current orders · " + pending + " pending", FaShoppingCart],
    ["Suppliers", data.suppliers.length, "Current supplier records", FaUsers]
  ] : [
    ["Net sales", money(analytics.totals.revenue), "Selected period · after refunds", FaChartLine],
    ["Cost of goods sold", analytics.totals.cogs === null ? "Unavailable" : money(analytics.totals.cogs), "Selected period · after returns", FaReceipt],
    ["Gross profit", analytics.totals.grossProfit === null ? "Unavailable" : money(analytics.totals.grossProfit), "Net sales minus cost of goods sold", FaMoneyBillWave]
  ];
  const recent = analytics.sales.slice().sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,8);
  return (
    <div className={"space-y-6 " + styles.page}>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className={styles.panel}>
          <p className={"text-xs font-black uppercase tracking-widest " + styles.eyebrow}>{cashier ? "Cashier workspace" : manager ? "Manager workspace" : "Owner / Admin workspace"}</p>
          <h2 className={"mt-3 text-2xl font-black sm:text-3xl " + styles.heading}>{cashier ? "Ready for your next customer" : manager ? "Keep your store moving" : "Your store at a glance"}</h2>
          <p className={"mt-2 text-sm " + styles.muted}>{cashier ? "Your sales and receipts, with quick access to scanning and checkout." : manager ? "Prioritize stock, suppliers and customer orders." : "Monitor store performance and manage your team."}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MiniSummary label={cashier ? "Your sales today" : "Store sales today"} value={money(today.totals.revenue)} detail="After refunds · Kabul time" tone={styles.valueBlue} styles={styles} />
            <MiniSummary label="Transactions today" value={today.sales.length} detail={cashier ? "Recorded by you" : "Across all staff"} tone={styles.valueGreen} styles={styles} />
            <MiniSummary label={cashier ? "Your active orders" : "Needs attention"} value={cashier ? activeOrders : pending + lowStock.length} detail={cashier ? "Created by you" : "Pending orders + stock alerts"} tone={styles.valueRose} styles={styles} />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 2xl:grid-cols-4">
            {actions.map(([title,note,href,Icon], index) => <Link key={href} to={href} className={styles.actionCard}><Icon className="text-xl" style={{color: colors[index]}} /><strong className="mt-3 block text-sm">{title}</strong><span className={"mt-1 block text-xs " + styles.muted}>{note}</span></Link>)}
          </div>
        </div>
        <DashboardCard title={cashier ? "Checkout essentials" : "Attention queue"} icon={FaExclamationTriangle} styles={styles}>
          <div className="space-y-3">
            <Link to="/orders" className={styles.queueItem}><span><strong>Pending orders</strong><span className={"block text-xs mt-1 " + styles.muted}>{cashier ? "Your customer orders" : "Review delivery status"}</span></span><span className={styles.queueValue}>{pending}</span></Link>
            <Link to={cashier ? "/sales" : "/inventory"} className={styles.queueItem}><span><strong>Low stock products</strong><span className={"block text-xs mt-1 " + styles.muted}>{cashier ? "Check availability before selling" : "Review and replenish"}</span></span><span className={styles.queueValue}>{lowStock.length}</span></Link>
            <div className={styles.warningBox}><strong className="text-sm">Stock watch</strong>{lowStock.length ? lowStock.slice(0,4).map(row => <div key={row.id} className="mt-3 flex justify-between gap-3 text-sm"><span className="min-w-0 break-words">{displayName(row.name)}</span><span className="shrink-0">{row.stock} left</span></div>) : <p className={"mt-3 text-sm " + styles.muted}>All products are above their reorder levels.</p>}</div>
          </div>
        </DashboardCard>
      </section>
      <section className={styles.panel}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-lg font-black">{cashier ? "Your performance" : manager ? "Operations overview" : "Store performance"}</h2><p className={"mt-1 text-xs " + styles.muted}>One period for sales totals, charts and transactions · {TIMEZONE}</p></div>
          <label className={"grid gap-2 text-xs font-bold " + styles.muted}>Reporting period<select className={styles.select} value={period} onChange={event => setPeriod(event.target.value)}>{Object.entries(PERIODS).map(([key,label]) => <option value={key} key={key}>{label}</option>)}</select></label>
        </div>
        <p className={"mt-3 text-xs " + styles.muted}>{analytics.bounds.start || "First recorded activity"} — {analytics.bounds.end} (inclusive){manager ? " · Stock and order counts show the current state." : ""}</p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([title,value,detail,icon]) => <MetricCard key={title} title={title} value={value} detail={detail} icon={icon} tone={styles.metricRose} styles={styles} />)}</div>
      {!cashier && <p className={"text-xs " + styles.muted}>Operating expenses are not tracked. Gross profit excludes overhead and taxes. Purchases are stock spending, separate from cost of goods sold.</p>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <DashboardCard title={cashier ? "Your sales trend" : "Sales trend"} icon={FaChartLine} styles={styles}>
          <p className={"mb-3 text-sm " + styles.muted}>Net sales: {money(analytics.totals.revenue)}{!cashier && analytics.totals.grossProfit !== null ? " · Gross profit: " + money(analytics.totals.grossProfit) : ""}</p>
          {analytics.sales.length || analytics.refunds.length ? <div className="h-72 min-w-0"><ResponsiveContainer minWidth={0} initialDimension={{ width: 300, height: 288 }} width="100%" height="100%"><LineChart data={analytics.salesTrend} margin={{right:12}}><CartesianGrid strokeDasharray="3 7" stroke={styles.chartGrid} vertical={false}/><XAxis dataKey="label" minTickGap={40} tick={{fontSize:11}} stroke={styles.axis}/><YAxis width={48} tick={{fontSize:11}} tickFormatter={value => Intl.NumberFormat("en",{notation:"compact"}).format(value)} stroke={styles.axis}/><Tooltip formatter={value => money(value)} contentStyle={styles.tooltip}/><Legend/><Line name="Net sales" dataKey="sales" stroke={styles.lineSales} strokeWidth={3} dot={analytics.salesTrend.length < 3} isAnimationActive={false}/>{!cashier && analytics.totals.grossProfit !== null && <Line name="Gross profit" dataKey="profit" stroke={styles.lineProfit} strokeWidth={2} dot={false} isAnimationActive={false}/>}</LineChart></ResponsiveContainer></div> : <div className={styles.emptyState}>No sales or refunds in this period. Choose another period or record a sale.</div>}
        </DashboardCard>
        <DashboardCard title="Category sales" icon={FaShoppingCart} styles={styles}>
          <p className={"text-xs mb-3 " + styles.muted}>Recorded sales before refunds · selected period</p>
          {categoryTotal > 0 ? <><div className="h-52"><ResponsiveContainer minWidth={0} initialDimension={{ width: 300, height: 288 }} width="100%" height="100%"><PieChart><Pie data={analytics.categorySales} dataKey="value" nameKey="name" innerRadius={54} outerRadius={80} isAnimationActive={false}>{analytics.categorySales.map((row,i) => <Cell key={row.name} fill={colors[i%colors.length]}/>)}</Pie><Tooltip formatter={value => money(value)} contentStyle={styles.tooltip}/></PieChart></ResponsiveContainer></div><div className="grid gap-2">{analytics.categorySales.map((row,i) => <div key={row.name} className={styles.categoryItem}><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{background:colors[i%colors.length]}}/>{row.name}<span className="float-right text-sm">{Math.round(row.value/categoryTotal*100)}%</span></div>)}</div></> : <div className={styles.emptyState}>No category sales in this period.</div>}
        </DashboardCard>
      </div>
      <DashboardCard title={cashier ? "Your recent transactions" : "Recent transactions"} icon={FaReceipt} styles={styles}>
        <div className="overflow-x-auto"><table className={"w-full min-w-[620px] text-left text-sm " + styles.tableText}><thead className={styles.tableHead}><tr>{["Customer", "Product", "Payment", "Date · Kabul", "Cashier"].map(label => <th className="px-3 py-3" key={label}>{label}</th>)}</tr></thead><tbody className={styles.tableBody}>{recent.map(sale => <tr key={sale.id} className={styles.tableRow}><td className="p-3">{data.customers.find(row => row.id === sale.customerId)?.name || sale.customerName || "Walk-in customer"}</td><td className="p-3">{displayName(sale.productName)}</td><td className="p-3 font-bold">{money(sale.total)}</td><td className="p-3 whitespace-nowrap">{formatSaleDate(sale)}</td><td className="p-3">{sale.cashierName || "Unassigned legacy sale"}</td></tr>)}{!recent.length && <tr><td colSpan="5" className={"py-8 px-3 " + styles.muted}>No transactions in this period.</td></tr>}</tbody></table></div>
      </DashboardCard>
      <DashboardCard title="Top selling products" icon={FaBoxOpen} styles={styles}>
        <p className={"mb-3 text-xs " + styles.muted}>Units sold before returns · selected period</p>
        {analytics.topProducts.length ? <div className="h-72 min-w-0"><ResponsiveContainer minWidth={0} initialDimension={{ width: 300, height: 288 }} width="100%" height="100%"><BarChart layout="vertical" data={analytics.topProducts}><CartesianGrid stroke={styles.chartGrid} horizontal={false}/><XAxis type="number" allowDecimals={false} stroke={styles.axis}/><YAxis dataKey="name" type="category" width={105} tick={{fontSize:11}} stroke={styles.axis}/><Tooltip contentStyle={styles.tooltip}/><Bar name="Units sold" dataKey="units" fill={styles.barFill} radius={[0,5,5,0]} isAnimationActive={false}/></BarChart></ResponsiveContainer></div> : <div className={styles.emptyState}>No product sales in this period.</div>}
      </DashboardCard>
    </div>
  );
}

function DashboardCard({ title, icon: Icon, action, children, styles }) {
  return (
    <section className={styles.card}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
    <div className={styles.summaryBox + " grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 sm:block"}>
      <span className={`text-xs font-black uppercase ${styles.muted}`}>{label}</span>
      <strong className={`block text-xl font-black sm:mt-2 sm:text-2xl ${tone}`}>{value}</strong>
      <p className={`col-span-2 mt-1 text-xs font-bold ${styles.muted}`}>{detail}</p>
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
      select: "h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
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
    tableHead: "bg-[#202020] text-neutral-400",
    tableBody: "divide-y divide-white/10",
    tableRow: "hover:bg-white/5",
    tableText: "text-neutral-200",
    statusPill: "rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300",
    metricPill: "mt-3 inline-flex rounded-full bg-[#1f1f1f] px-2.5 py-1 text-xs font-black text-[#6df2a8]",
    salesPill: "rounded-full bg-teal-50 px-3 py-1 font-black text-teal-300",
    profitPill: "rounded-full bg-pink-500/10 px-3 py-1 font-black text-pink-300",
    select: "h-11 rounded-xl border border-white/10 bg-[#101010] px-3 text-xs font-bold text-neutral-200 outline-none transition hover:border-pink-400/40 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10",
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
    axis: "#a3a3a3",
    lineSales: "#35f4df",
    lineProfit: "#ff2d83",
    barFill: "#ff7a1a"
  };
}

function formatSaleDate(sale) {
  const date = new Date(sale.createdAt || sale.date);
  if (Number.isNaN(date.getTime())) return sale.date || "-";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: TIMEZONE });
}
