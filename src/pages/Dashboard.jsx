import { Link } from "react-router-dom";
import { FaBoxOpen, FaChartLine, FaFileInvoice, FaMoneyBillWave, FaPlus, FaReceipt, FaShoppingCart, FaTruck, FaUserPlus, FaUsers } from "react-icons/fa";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card from "../components/Card";
import StatCard from "../components/StatCard";

import { money } from "../lib/format";
const colors = ["#ff7a1a", "#35f4df", "#d9ff3f", "#ff2d83", "#8b5cf6"];
const tooltipStyle = {
  background: "#1f1f1f",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#fff"
};

export default function Dashboard({ data }) {
  const activeOrders = data.orders.filter(order => order.status !== "delivered").length;
  const trendSales = data.analytics.salesTrend.reduce((sum, day) => sum + day.sales, 0);
  const trendProfit = data.analytics.salesTrend.reduce((sum, day) => sum + day.profit, 0);
  const categoryTotal = data.analytics.categorySales.reduce((sum, category) => sum + category.value, 0);
  const recentTransactions = data.sales.slice().reverse().slice(0, 5);
  const quickActions = [
    { title: "Add New Item", icon: FaShoppingCart, href: "/inventory" },
    { title: "Add New Customer", icon: FaUserPlus, href: "/customers" },
    { title: "Add New Supplier", icon: FaTruck, href: "/suppliers" },
    { title: "Add New Order", icon: FaFileInvoice, href: "/orders" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total Sales" value={money(data.summary.totalSales ?? data.summary.salesRevenue)} change="Revenue" icon={FaChartLine} tone="teal" />
        <StatCard title="Total Expense" value={money(data.summary.totalExpense)} change="Cost of goods sold" icon={FaReceipt} tone="rose" />
        <StatCard title="Total Profit" value={money(data.summary.totalProfit ?? data.summary.profit)} change="Sales minus expense" icon={FaMoneyBillWave} tone="blue" />
        <StatCard title="Active Orders" value={activeOrders} change="6 awaiting action" icon={FaShoppingCart} tone="blue" />
        <StatCard title="Total Customers" value={data.customersView.length} change="+4 new customers" icon={FaUsers} tone="amber" />
        <StatCard title="Low Stock Items" value={data.summary.lowStock} change="Needs reorder" icon={FaBoxOpen} tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        <Card
          title="Order Summary"
          icon={FaChartLine}
          action={<select className="field h-9 w-36 text-xs"><option>Last Month</option><option>This Week</option><option>This Year</option></select>}
        >
          <div className="mb-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-teal-50 px-3 py-1 font-black text-teal-300">Selected period: {money(trendSales)}</span>
            <span className="rounded-full bg-pink-500/10 px-3 py-1 font-black text-pink-300">Profit: {money(trendProfit)}</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.analytics.salesTrend}>
                <CartesianGrid strokeDasharray="3 7" stroke="rgba(255,255,255,0.13)" vertical={false} />
                <XAxis dataKey="label" stroke="#737373" tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} />
                <YAxis stroke="#737373" tickLine={false} axisLine={false} />
                <Tooltip formatter={value => money(value)} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="sales" stroke="#35f4df" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#35f4df" }} />
                <Line type="monotone" dataKey="profit" stroke="#ff2d83" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#ff2d83" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card
          title="Top Categories"
          icon={FaShoppingCart}
          action={<select className="field h-9 w-32 text-xs"><option>Last Month</option><option>This Week</option></select>}
        >
          {data.analytics.categorySales.length ? (
            <div className="grid gap-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.analytics.categorySales} dataKey="value" nameKey="name" innerRadius={58} outerRadius={104} paddingAngle={2}>
                      {data.analytics.categorySales.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                    </Pie>
                    <Tooltip formatter={value => money(value)} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.analytics.categorySales.map((category, index) => (
                  <div key={category.name} className="rounded-xl bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-black text-neutral-200">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                        {category.name}
                      </span>
                      <span className="font-black text-white">{Math.round((category.value / categoryTotal) * 100)}%</span>
                    </div>
                    <strong className="mt-1 block text-xs text-neutral-400">{money(category.value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500">No category sales yet.</div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]">
        <div className="grid gap-4 sm:grid-cols-2">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.href} className="group rounded-2xl border border-white/10 bg-[#151515] p-5 transition hover:-translate-y-0.5 hover:border-pink-400/40 hover:bg-[#1d1d1d]">
                <span className="block text-sm font-black text-white">{action.title}</span>
                <div className="mt-5 flex items-end justify-between">
                  <Icon className="text-4xl text-[#ff2d83]" />
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white transition group-hover:bg-[#ff2d83]"><FaPlus /></span>
                </div>
              </Link>
            );
          })}
        </div>
        <Card
          title="Recent Transactions"
          icon={FaReceipt}
          action={<select className="field h-9 w-32 text-xs"><option>Last Month</option><option>This Week</option></select>}
        >
          <div className="overflow-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase">
                <tr>{["Customer Name", "Total Payment", "Date", "Status"].map(item => <th key={item} className="px-4 py-3 font-black">{item}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentTransactions.map(sale => (
                  <tr key={sale.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-bold">{sale.customerName || "Walk-in Customer"}</td>
                    <td className="px-4 py-3 font-black text-neutral-300">{money(sale.total)}</td>
                    <td className="px-4 py-3 text-neutral-400">{sale.date}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">Completed</span></td>
                  </tr>
                ))}
                {!recentTransactions.length && (
                  <tr>
                    <td className="px-4 py-6 text-neutral-400" colSpan="4">No recent transactions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title="Top Selling Products" icon={FaBoxOpen}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.analytics.topProducts}>
              <CartesianGrid strokeDasharray="3 7" stroke="rgba(255,255,255,0.13)" vertical={false} />
              <XAxis dataKey="name" stroke="#737373" tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} />
              <YAxis stroke="#737373" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="units" fill="#ff7a1a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

