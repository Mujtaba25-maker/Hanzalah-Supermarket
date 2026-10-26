import { useMemo, useState } from "react";
import { FaChartPie, FaShoppingBag } from "react-icons/fa";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import BarcodeScanner from "../components/BarcodeScanner";
import Card from "../components/Card";
import { findProductByBarcode, recordRefund, recordSale } from "../lib/api";

import { money } from "../lib/format";
const colors = ["#ff7a1a", "#35f4df", "#d9ff3f", "#ff2d83", "#8b5cf6"];
const tooltipStyle = {
  background: "#1f1f1f",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#fff"
};

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
      <Card title="Returns & Refunds" icon={FaShoppingBag} className="xl:col-span-2">
        <RefundForm sales={data.sales} refunds={data.refunds || []} refresh={refresh} />
      </Card>
      <Card title="Sales history · all time" icon={FaShoppingBag} className="xl:col-span-2">
        {data.sales.length || data.refunds.length ? <div className="h-80">
          <ResponsiveContainer minWidth={0} initialDimension={{ width: 300, height: 288 }} width="100%" height="100%">
            <LineChart data={data.analytics.salesTrend}>
              <CartesianGrid strokeDasharray="3 7" stroke="rgba(255,255,255,0.13)" vertical={false} />
              <XAxis minTickGap={40} tick={{fontSize: 11}} dataKey="label" stroke="#737373" tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} />
              <YAxis stroke="#737373" tickLine={false} axisLine={false} />
              <Tooltip formatter={value => money(value)} contentStyle={tooltipStyle} />
              <Legend />
              <Line name="Net sales" type="monotone" dataKey="sales" stroke="#35f4df" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#35f4df" }} />
              {data.currentUser?.role !== "cashier" && <Line name="Gross profit" type="monotone" dataKey="profit" stroke="#ff2d83" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#ff2d83" }} />}
            </LineChart>
          </ResponsiveContainer>
        </div> : <p className="rounded-xl border border-dashed border-white/10 p-6 text-neutral-400">No sales or refunds recorded yet.</p>}
      </Card>
      <Card title="Top selling products · all time" icon={FaShoppingBag}>
        {data.analytics.topProducts.length ? <div className="h-72">
          <ResponsiveContainer minWidth={0} initialDimension={{ width: 300, height: 288 }} width="100%" height="100%">
            <BarChart data={data.analytics.topProducts}>
              <CartesianGrid strokeDasharray="3 7" stroke="rgba(255,255,255,0.13)" vertical={false} />
              <XAxis dataKey="name" stroke="#737373" tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} />
              <YAxis stroke="#737373" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="units" fill="#ff7a1a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div> : <p className="rounded-xl border border-dashed border-white/10 p-6 text-neutral-400">No product sales recorded yet.</p>}
      </Card>
      <Card title="Sales by Category" icon={FaChartPie}>
        {data.analytics.categorySales.length ? (
          <>
            <div className="h-72">
              <ResponsiveContainer minWidth={0} initialDimension={{ width: 300, height: 288 }} width="100%" height="100%">
                <PieChart>
                  <Pie data={data.analytics.categorySales} dataKey="value" nameKey="name" outerRadius={95}>
                    {data.analytics.categorySales.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip formatter={value => money(value)} contentStyle={tooltipStyle} />
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

function RefundForm({ sales, refunds, refresh }) {
  const latestSale = sales.slice().reverse()[0] || {};
  const [saleId, setSaleId] = useState(latestSale.id || "");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Customer return");
  const [message, setMessage] = useState("");
  const sale = sales.find(item => item.id === saleId) || latestSale;
  const refundTotal = Number(quantity || 0) * Number(sale.unitPrice || 0);

  const submit = async event => {
    event.preventDefault();
    try {
      await recordRefund({ saleId, quantity, reason });
      setQuantity(1);
      setMessage("Refund recorded and stock restored.");
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <form className="grid gap-4" onSubmit={submit}>
        <label className="label">Sale<select className="field" value={saleId} onChange={event => setSaleId(event.target.value)} required>{sales.slice().reverse().map(item => <option key={item.id} value={item.id}>{item.productName} - {money(item.total)} - {item.createdAt?.slice(0, 10)}</option>)}</select></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">Quantity<input className="field" type="number" min="1" max={sale.quantity || 1} value={quantity} onChange={event => setQuantity(event.target.value)} /></label>
          <label className="label">Refund Total<input className="field" value={money(refundTotal)} readOnly /></label>
        </div>
        <label className="label">Reason<input className="field" value={reason} onChange={event => setReason(event.target.value)} /></label>
        {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p>}
        <button className="btn-primary w-fit" disabled={!saleId} type="submit">Record Refund</button>
      </form>
      <div className="max-h-80 space-y-2 overflow-auto">
        {refunds.slice().reverse().map(refund => (
          <article key={refund.id} className="rounded-xl bg-white/5 p-3">
            <strong className="block text-sm">{refund.productName}</strong>
            <span className="text-xs font-bold text-neutral-400">{refund.quantity} returned - {money(refund.total)} - {refund.reason}</span>
          </article>
        ))}
        {!refunds.length && <p className="rounded-xl bg-white/5 p-4 text-sm font-bold text-neutral-400">No refunds recorded yet.</p>}
      </div>
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

  const handleBarcode = async code => {
    if (!code.trim()) return;
    setMessage("");
    try {
      const scannedProduct = await findProductByBarcode(code.trim());
      setProductId(scannedProduct.id);
      setQuantity(1);
      setMessage(`${scannedProduct.name} selected from barcode.`);
      setBarcode("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const scanBarcode = event => {
    event.preventDefault();
    handleBarcode(barcode);
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
      <BarcodeScanner
        label="Scan Product Barcode"
        value={barcode}
        onChange={setBarcode}
        onManualSubmit={scanBarcode}
        onDetected={handleBarcode}
        buttonLabel="Select"
      />
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
        {data.currentUser?.role !== "cashier" && <Summary label="Cost of goods sold" value={money(saleTotal - projectedProfit)} />}
        {data.currentUser?.role !== "cashier" && <Summary label="Gross profit" value={money(projectedProfit)} />}
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

