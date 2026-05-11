import { useMemo, useState } from "react";
import { FaBoxes, FaChartBar, FaDollarSign, FaPrint, FaReceipt } from "react-icons/fa";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card from "../components/Card";

import { money } from "../lib/format";
const tooltipStyle = {
  background: "#1f1f1f",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#fff"
};

export default function Reports({ data }) {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(data.sales[0]?.createdAt?.slice(0, 10) || today);
  const [to, setTo] = useState(today);

  const report = useMemo(() => {
    const inRange = date => {
      const key = String(date || "").slice(0, 10);
      return key >= from && key <= to;
    };
    const sales = data.sales.filter(sale => inRange(sale.createdAt));
    const purchases = data.purchases.filter(purchase => inRange(purchase.createdAt));
    const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const profit = sales.reduce((sum, sale) => sum + sale.profit, 0);
    const expense = revenue - profit;
    const purchaseSpend = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
    const lowStock = data.products.filter(product => product.stock <= product.minStock);
    const productMap = new Map();

    for (const sale of sales) {
      const row = productMap.get(sale.productName) || { name: sale.productName, units: 0, sales: 0, profit: 0 };
      row.units += sale.quantity;
      row.sales += sale.total;
      row.profit += sale.profit;
      productMap.set(sale.productName, row);
    }

    return {
      sales,
      purchases,
      revenue,
      profit,
      expense,
      purchaseSpend,
      lowStock,
      productRows: Array.from(productMap.values()).sort((a, b) => b.sales - a.sales)
    };
  }, [data, from, to]);

  const chartRows = [
    { name: "Sales", value: report.revenue },
    { name: "Expense", value: report.expense },
    { name: "Profit", value: report.profit },
    { name: "Purchases", value: report.purchaseSpend }
  ];

  return (
    <div className="grid gap-6">
      <Card
        title="Report Controls"
        icon={FaChartBar}
        action={<button className="btn-primary" onClick={() => window.print()} type="button"><FaPrint /> Print Report</button>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="label">From<input className="field" type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
          <label className="label">To<input className="field" type="date" value={to} onChange={event => setTo(event.target.value)} /></label>
        </div>
      </Card>

      <section className="print-area grid gap-6">
        <div className="hidden border-b border-black pb-3 text-black print:block">
          <h1 className="text-2xl font-black">Hanzala Supermarket Report</h1>
          <p>{from} to {to}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReportStat icon={FaDollarSign} label="Total Sales" value={money(report.revenue)} tone="teal" />
          <ReportStat icon={FaReceipt} label="Total Expense" value={money(report.expense)} tone="rose" />
          <ReportStat icon={FaChartBar} label="Total Profit" value={money(report.profit)} tone="amber" />
          <ReportStat icon={FaBoxes} label="Low Stock Items" value={report.lowStock.length} tone="white" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card title="Financial Overview" icon={FaChartBar}>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows}>
                  <CartesianGrid strokeDasharray="3 7" stroke="rgba(255,255,255,0.13)" vertical={false} />
                  <XAxis dataKey="name" stroke="#737373" tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} />
                  <YAxis stroke="#737373" tickLine={false} axisLine={false} />
                  <Tooltip formatter={value => money(value)} contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#ff2d83" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Report Summary" icon={FaReceipt}>
            <div className="grid gap-3 text-sm">
              <SummaryRow label="Sales Transactions" value={report.sales.length} />
              <SummaryRow label="Stock Purchases" value={report.purchases.length} />
              <SummaryRow label="Purchase Spend" value={money(report.purchaseSpend)} />
              <SummaryRow label="Average Sale" value={money(report.sales.length ? report.revenue / report.sales.length : 0)} />
              <SummaryRow label="Profit Margin" value={`${report.revenue ? Math.round((report.profit / report.revenue) * 100) : 0}%`} />
            </div>
          </Card>
        </div>

        <Card title="Top Product Performance" icon={FaBoxes}>
          <div className="overflow-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase">
                <tr>{["Product", "Units Sold", "Sales", "Profit"].map(item => <th key={item} className="px-4 py-3 font-black">{item}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {report.productRows.map(row => (
                  <tr key={row.name} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-black">{row.name}</td>
                    <td className="px-4 py-3">{row.units}</td>
                    <td className="px-4 py-3 font-black text-[#35f4df]">{money(row.sales)}</td>
                    <td className="px-4 py-3 font-black text-[#d9ff3f]">{money(row.profit)}</td>
                  </tr>
                ))}
                {!report.productRows.length && <tr><td className="px-4 py-6 text-neutral-400" colSpan="4">No sales in this date range.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Low Stock Report" icon={FaBoxes}>
          <div className="overflow-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase">
                <tr>{["SKU", "Product", "Stock", "Minimum", "Reorder Needed"].map(item => <th key={item} className="px-4 py-3 font-black">{item}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {report.lowStock.map(product => (
                  <tr key={product.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                    <td className="px-4 py-3 font-black">{product.name}</td>
                    <td className="px-4 py-3 text-red-300">{product.stock}</td>
                    <td className="px-4 py-3">{product.minStock}</td>
                    <td className="px-4 py-3 font-black text-[#ff2d83]">{Math.max(product.minStock - product.stock, 0)}</td>
                  </tr>
                ))}
                {!report.lowStock.length && <tr><td className="px-4 py-6 text-neutral-400" colSpan="5">No low stock items.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}

function ReportStat({ icon: Icon, label, value, tone }) {
  const colors = {
    teal: "text-[#35f4df]",
    rose: "text-[#ff2d83]",
    amber: "text-[#d9ff3f]",
    white: "text-white"
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-neutral-400">{label}</span>
        <Icon className={colors[tone]} />
      </div>
      <strong className={`mt-3 block text-2xl font-black ${colors[tone]}`}>{value}</strong>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
      <span className="font-bold text-neutral-400">{label}</span>
      <strong className="text-white">{value}</strong>
    </div>
  );
}

