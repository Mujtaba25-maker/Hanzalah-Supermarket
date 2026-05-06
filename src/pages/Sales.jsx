import { useMemo, useState } from "react";
import { FaChartPie, FaShoppingBag } from "react-icons/fa";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card from "../components/Card";
import { findProductByBarcode, recordSale } from "../lib/api";

const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
const colors = ["#0f766e", "#2563eb", "#d97706", "#7c3aed"];

export default function Sales({ data, refresh }) {
  const categoryTotal = data.analytics.categorySales.reduce((sum, category) => sum + category.value, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Sell Product" icon={FaShoppingBag}>
        <SaleForm data={data} refresh={refresh} />
      </Card>
      <Card title="Recent Sales" icon={FaShoppingBag}>
        <div className="max-h-[360px] space-y-3 overflow-auto pr-1">
          {data.sales.length ? data.sales.slice().reverse().map(sale => (
            <article key={sale.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div>
                <strong className="block text-sm font-black text-slate-950">{sale.productName}</strong>
                <span className="text-sm font-medium text-slate-500">{sale.quantity} sold - {sale.paymentMethod}</span>
              </div>
              <span className="font-black text-teal-700">{money(sale.total)}</span>
            </article>
          )) : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-slate-500">No sales yet.</div>}
        </div>
      </Card>
      <Card title="Daily Sales Trend" icon={FaShoppingBag} className="xl:col-span-2">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.analytics.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={value => money(value)} />
              <Line type="monotone" dataKey="sales" stroke="#0f766e" strokeWidth={3} />
              <Line type="monotone" dataKey="profit" stroke="#7c3aed" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Top Selling Products" icon={FaShoppingBag}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.analytics.topProducts}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="units" fill="#0f766e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Sales by Category" icon={FaChartPie}>
        {data.analytics.categorySales.length ? (
          <>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.analytics.categorySales} dataKey="value" nameKey="name" outerRadius={95}>
                    {data.analytics.categorySales.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip formatter={value => money(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid gap-2">
              {data.analytics.categorySales.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 font-black text-slate-700">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                    {category.name}
                  </span>
                  <span className="font-black text-slate-950">{money(category.value)} ({Math.round((category.value / categoryTotal) * 100)}%)</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500">No category sales yet.</div>
        )}
      </Card>
    </div>
  );
}

function SaleForm({ data, refresh }) {
  const firstProduct = data.products[0] || {};
  const [productId, setProductId] = useState(firstProduct.id || "");
  const [customerId, setCustomerId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [barcode, setBarcode] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const product = useMemo(() => data.products.find(item => item.id === productId) || firstProduct, [data.products, firstProduct, productId]);
  const saleTotal = Number(quantity || 0) * Number(product.price || 0);
  const projectedProfit = Number(quantity || 0) * (Number(product.price || 0) - Number(product.cost || 0));
  const canSell = product.id && Number(quantity) > 0 && Number(quantity) <= Number(product.stock);

  const scanBarcode = async event => {
    event.preventDefault();
    if (!barcode.trim()) return;
    setMessage("");
    try {
      const scannedProduct = await findProductByBarcode(barcode.trim());
      setProductId(scannedProduct.id);
      setQuantity(1);
      setMessage(`${scannedProduct.name} selected from barcode.`);
      setBarcode("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await recordSale({
        productId,
        customerId,
        quantity,
        unitPrice: product.price,
        paymentMethod
      });
      setQuantity(1);
      setMessage("Sale recorded successfully.");
      await refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
        <label className="label text-teal-900">
          Scan Barcode
          <div className="flex gap-2">
            <input className="field bg-white" value={barcode} onChange={event => setBarcode(event.target.value)} onKeyDown={event => { if (event.key === "Enter") scanBarcode(event); }} placeholder="Focus here and scan product barcode" />
            <button onClick={scanBarcode} className="rounded-xl bg-teal-600 px-4 font-black text-white hover:bg-teal-700" type="button">Scan</button>
          </div>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="label sm:col-span-2">
          Product
          <select className="field" value={productId} onChange={event => setProductId(event.target.value)} required>
            {data.products.map(item => <option key={item.id} value={item.id}>{item.name} - {item.stock} in stock - {item.barcode || item.sku}</option>)}
          </select>
        </label>
        <label className="label">
          Customer
          <select className="field" value={customerId} onChange={event => setCustomerId(event.target.value)}>
            <option value="">Walk-in Customer</option>
            {data.customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </label>
        <label className="label">
          Payment
          <select className="field" value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}>
            <option>Cash</option>
            <option>Card</option>
            <option>Bank Transfer</option>
            <option>Credit</option>
          </select>
        </label>
        <label className="label">
          Quantity
          <input className="field" type="number" min="1" max={product.stock || 1} value={quantity} onChange={event => setQuantity(event.target.value)} required />
        </label>
        <label className="label">
          Unit Price
          <input className="field" type="number" value={product.price || 0} readOnly />
        </label>
      </div>

      <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-4">
        <Summary label="Available Stock" value={product.stock ?? 0} />
        <Summary label="Sale Total" value={money(saleTotal)} />
        <Summary label="Expense" value={money(saleTotal - projectedProfit)} />
        <Summary label="Profit" value={money(projectedProfit)} />
      </div>

      {Number(quantity) > Number(product.stock) && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">Quantity is greater than available stock.</p>}
      {message && <p className={`rounded-xl p-3 text-sm font-bold ${message.includes("success") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</p>}

      <button disabled={!canSell || saving} className="h-11 rounded-xl bg-teal-600 px-4 font-black text-white shadow-lg shadow-teal-600/15 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50" type="submit">
        {saving ? "Saving Sale..." : "Complete Sale"}
      </button>
    </form>
  );
}

function Summary({ label, value }) {
  return (
    <div>
      <span className="text-xs font-black uppercase text-slate-500">{label}</span>
      <strong className="mt-1 block text-xl font-black text-slate-950">{value}</strong>
    </div>
  );
}
