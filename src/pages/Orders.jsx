import { useMemo, useState } from "react";
import { FaFilter, FaPlus, FaShoppingCart } from "react-icons/fa";
import Card from "../components/Card";
import Pagination from "../components/Pagination";
import { createOrder, findProductByBarcode } from "../lib/api";

const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

export default function Orders({ orders, products, refresh }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState("date");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const pageSize = 6;

  const rows = useMemo(() => {
    const term = query.toLowerCase();
    return orders
      .filter(order => status === "all" || order.status === status)
      .filter(order => [order.id, order.customer, order.status].some(value => String(value).toLowerCase().includes(term)))
      .sort((a, b) => String(b[sortKey]).localeCompare(String(a[sortKey]), undefined, { numeric: true }));
  }, [orders, query, status, sortKey]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
    <Card
      title="Orders"
      icon={FaShoppingCart}
      action={<button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-black text-white hover:bg-teal-700" type="button"><FaPlus /> Add Order</button>}
    >
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
        <input className="field" placeholder="Search orders..." value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} />
        <label className="relative">
          <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select className="field pl-9" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </label>
        <select className="field" value={sortKey} onChange={event => setSortKey(event.target.value)}>
          <option value="date">Sort by date</option>
          <option value="total">Sort by total</option>
          <option value="customer">Sort by customer</option>
        </select>
      </div>
      <div className="overflow-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>{["Order ID", "Customer", "Status", "Total", "Date"].map(item => <th key={item} className="px-4 py-3 font-black">{item}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {pageRows.map(order => <tr key={order.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-black">{order.id}</td>
              <td className="px-4 py-3">{order.customer}</td>
              <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
              <td className="px-4 py-3 font-black">{money(order.total)}</td>
              <td className="px-4 py-3 text-slate-500">{order.date}</td>
            </tr>)}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </Card>
    {showModal && <OrderModal close={() => setShowModal(false)} products={products} refresh={refresh} />}
    </>
  );
}

function OrderModal({ close, products, refresh }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ customer: "", status: "pending", total: "", date: today });
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const computedTotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  const addProduct = product => {
    setItems(current => {
      const existing = current.find(item => item.productId === product.id);
      if (existing) {
        return current.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode || product.sku,
          quantity: 1,
          price: product.price
        }
      ];
    });
  };

  const scanBarcode = async event => {
    event.preventDefault();
    if (!barcode.trim()) return;
    setMessage("");
    try {
      const product = await findProductByBarcode(barcode.trim());
      addProduct(product);
      setBarcode("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateItemQuantity = (productId, quantity) => {
    const nextQuantity = Math.max(1, Number(quantity) || 1);
    setItems(current => current.map(item => item.productId === productId ? { ...item, quantity: nextQuantity } : item));
  };

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await createOrder({
        ...form,
        total: computedTotal || form.total,
        items
      });
      await refresh();
      close();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/50 p-4">
      <form className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-soft" onSubmit={submit}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">Add Order</h2>
          <button onClick={close} className="rounded-lg bg-slate-100 px-3 py-2 font-black hover:bg-slate-200" type="button">x</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label sm:col-span-2">Customer<input name="customer" className="field" value={form.customer} onChange={update} required /></label>
          <label className="label">Status<select name="status" className="field" value={form.status} onChange={update}><option value="pending">Pending</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select></label>
          <label className="label">Total<input name="total" className="field" type="number" step="0.01" min="0" value={computedTotal ? computedTotal.toFixed(2) : form.total} onChange={update} readOnly={items.length > 0} required /></label>
          <label className="label sm:col-span-2">Date<input name="date" className="field" type="date" value={form.date} onChange={update} required /></label>
        </div>
        <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4">
          <label className="label text-teal-900">
            Scan Product Barcode
            <div className="flex gap-2">
              <input className="field bg-white" value={barcode} onChange={event => setBarcode(event.target.value)} onKeyDown={event => { if (event.key === "Enter") scanBarcode(event); }} placeholder="Focus here and scan product barcode" />
              <button onClick={scanBarcode} className="rounded-xl bg-teal-600 px-4 font-black text-white hover:bg-teal-700" type="button">Add</button>
            </div>
          </label>
          <select className="field mt-3 bg-white" onChange={event => { const product = products.find(item => item.id === event.target.value); if (product) addProduct(product); event.target.value = ""; }} defaultValue="">
            <option value="">Or choose product manually</option>
            {products.map(product => <option key={product.id} value={product.id}>{product.name} - {product.barcode || product.sku}</option>)}
          </select>
        </div>
        {items.length > 0 && (
          <div className="mt-4 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-3 py-2">Item</th><th className="px-3 py-2">Barcode</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Total</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map(item => (
                  <tr key={item.productId}>
                    <td className="px-3 py-2 font-black">{item.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">{item.barcode}</td>
                    <td className="px-3 py-2"><input className="field h-9 w-20" type="number" min="1" value={item.quantity} onChange={event => updateItemQuantity(item.productId, event.target.value)} /></td>
                    <td className="px-3 py-2 font-black">{money(item.quantity * item.price)}</td>
                    <td className="px-3 py-2 text-right"><button className="rounded-lg bg-red-50 px-3 py-2 font-bold text-red-700 hover:bg-red-100" onClick={() => setItems(current => current.filter(row => row.productId !== item.productId))} type="button">Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {message && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={close} className="rounded-xl bg-slate-100 px-4 py-2 font-black hover:bg-slate-200" type="button">Cancel</button>
          <button disabled={saving} className="rounded-xl bg-teal-600 px-4 py-2 font-black text-white hover:bg-teal-700 disabled:opacity-50" type="submit">{saving ? "Saving..." : "Save Order"}</button>
        </div>
      </form>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    shipped: "bg-blue-50 text-blue-700",
    delivered: "bg-emerald-50 text-emerald-700"
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${styles[status]}`}>{status}</span>;
}
