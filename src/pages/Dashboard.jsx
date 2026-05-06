import { FaBoxOpen, FaChartLine, FaMoneyBillWave, FaReceipt, FaShoppingCart, FaUsers } from "react-icons/fa";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card from "../components/Card";
import StatCard from "../components/StatCard";

const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
const colors = ["#0f766e", "#2563eb", "#d97706", "#7c3aed"];

export default function Dashboard({ data }) {
  const activeOrders = data.orders.filter(order => order.status !== "delivered").length;
  const trendSales = data.analytics.salesTrend.reduce((sum, day) => sum + day.sales, 0);
  const trendProfit = data.analytics.salesTrend.reduce((sum, day) => sum + day.profit, 0);
  const categoryTotal = data.analytics.categorySales.reduce((sum, category) => sum + category.value, 0);

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
        <Card title="Sales Trends" icon={FaChartLine}>
          <div className="mb-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-teal-50 px-3 py-1 font-black text-teal-700">Trend sales: {money(trendSales)}</span>
            <span className="rounded-full bg-violet-50 px-3 py-1 font-black text-violet-700">Trend profit: {money(trendProfit)}</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.analytics.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip formatter={value => money(value)} />
                <Line type="monotone" dataKey="sales" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="profit" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Sales by Category" icon={FaShoppingCart}>
          {data.analytics.categorySales.length ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_180px]">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.analytics.categorySales} dataKey="value" nameKey="name" outerRadius={105}>
                      {data.analytics.categorySales.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                    </Pie>
                    <Tooltip formatter={value => money(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 self-center">
                {data.analytics.categorySales.map((category, index) => (
                  <div key={category.name} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-black text-slate-700">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                        {category.name}
                      </span>
                      <span className="text-sm font-black text-slate-950">{Math.round((category.value / categoryTotal) * 100)}%</span>
                    </div>
                    <strong className="mt-1 block text-sm text-slate-500">{money(category.value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500">No category sales yet.</div>
          )}
        </Card>
      </div>

      <Card title="Top Selling Products" icon={FaBoxOpen}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.analytics.topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="units" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
