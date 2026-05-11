import { useMemo, useState } from "react";
import { FaBoxes, FaPlus, FaTruck } from "react-icons/fa";
import Card from "../components/Card";
import Pagination from "../components/Pagination";
import { createContact, recordPurchase } from "../lib/api";

import { money } from "../lib/format";

export default function Suppliers({ suppliers, products, purchases, refresh }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const pageSize = 6;

  const productBySupplier = useMemo(() => {
    const map = new Map();
    for (const product of products) {
      const rows = map.get(product.supplierId) || [];
      rows.push(product);
      map.set(product.supplierId, rows);
    }
    return map;
  }, [products]);

  const rows = suppliers
    .filter(supplier => [supplier.name, supplier.email, supplier.phone, supplier.address].some(value => String(value || "").toLowerCase().includes(query.toLowerCase())))
    .sort((a, b) => a.name.localeCompare(b.name));
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat label="Suppliers" value={suppliers.length} />
        <MiniStat label="Linked Products" value={products.filter(product => product.supplierId).length} />
        <MiniStat label="Purchase Spend" value={money(purchases.reduce((sum, purchase) => sum + purchase.total, 0))} />
      </div>

      <Card
        title="Supplier Directory"
        icon={FaTruck}
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-muted" onClick={() => setShowPurchaseModal(true)} type="button"><FaBoxes /> Add Stock</button>
            <button className="btn-primary" onClick={() => setShowSupplierModal(true)} type="button"><FaPlus /> Add Supplier</button>
          </div>
        }
      >
        <div className="mb-4">
          <input className="field max-w-md" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search suppliers..." />
        </div>
        <div className="overflow-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs uppercase">
              <tr>{["Supplier", "Contact", "Address", "Products", "Stock Value"].map(item => <th key={item} className="px-4 py-3 font-black">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {pageRows.map(supplier => {
                const linkedProducts = productBySupplier.get(supplier.id) || [];
                const stockValue = linkedProducts.reduce((sum, product) => sum + product.stock * product.cost, 0);
                return (
                  <tr key={supplier.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <strong className="block text-white">{supplier.name}</strong>
                      <span className="text-xs font-bold text-neutral-500">{supplier.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block">{supplier.phone || "No phone"}</span>
                      <span className="text-neutral-400">{supplier.email || "No email"}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{supplier.address || "No address"}</td>
                    <td className="px-4 py-3 font-black">{linkedProducts.length}</td>
                    <td className="px-4 py-3 font-black text-[#35f4df]">{money(stockValue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </Card>

      <Card title="Recent Stock Purchases" icon={FaBoxes}>
        <div className="overflow-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase">
              <tr>{["Product", "Supplier", "Quantity", "Unit Cost", "Total"].map(item => <th key={item} className="px-4 py-3 font-black">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {purchases.slice().reverse().map(purchase => {
                const supplier = suppliers.find(item => item.id === purchase.supplierId);
                return (
                  <tr key={purchase.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-black">{purchase.productName}</td>
                    <td className="px-4 py-3">{supplier?.name || "Unknown supplier"}</td>
                    <td className="px-4 py-3">{purchase.quantity}</td>
                    <td className="px-4 py-3">{money(purchase.unitCost)}</td>
                    <td className="px-4 py-3 font-black text-[#ff8a3d]">{money(purchase.total)}</td>
                  </tr>
                );
              })}
              {!purchases.length && <tr><td className="px-4 py-6 text-neutral-400" colSpan="5">No stock purchases recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {showSupplierModal && <SupplierModal close={() => setShowSupplierModal(false)} refresh={refresh} />}
      {showPurchaseModal && <PurchaseModal close={() => setShowPurchaseModal(false)} products={products} suppliers={suppliers} refresh={refresh} />}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
      <span className="text-sm font-black text-neutral-400">{label}</span>
      <strong className="mt-2 block text-2xl font-black text-white">{value}</strong>
    </div>
  );
}

function SupplierModal({ close, refresh }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [message, setMessage] = useState("");
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async event => {
    event.preventDefault();
    try {
      await createContact({ ...form, type: "supplier" });
      await refresh();
      close();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/60 p-4">
      <form className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#151515] p-6 shadow-soft" onSubmit={submit}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Add Supplier</h2>
          <button onClick={close} className="btn-muted px-3" type="button">x</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label sm:col-span-2">Name<input className="field" name="name" value={form.name} onChange={update} required /></label>
          <label className="label">Phone<input className="field" name="phone" value={form.phone} onChange={update} /></label>
          <label className="label">Email<input className="field" name="email" type="email" value={form.email} onChange={update} /></label>
          <label className="label sm:col-span-2">Address<input className="field" name="address" value={form.address} onChange={update} /></label>
        </div>
        {message && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={close} className="btn-muted" type="button">Cancel</button>
          <button className="btn-primary" type="submit">Save Supplier</button>
        </div>
      </form>
    </div>
  );
}

function PurchaseModal({ close, products, suppliers, refresh }) {
  const firstProduct = products[0] || {};
  const [form, setForm] = useState({ productId: firstProduct.id || "", supplierId: firstProduct.supplierId || "", quantity: 1, unitCost: firstProduct.cost || 0 });
  const [message, setMessage] = useState("");
  const selectedProduct = products.find(product => product.id === form.productId) || firstProduct;
  const total = Number(form.quantity || 0) * Number(form.unitCost || 0);

  const update = event => {
    const { name, value } = event.target;
    setForm(current => {
      if (name === "productId") {
        const nextProduct = products.find(product => product.id === value) || {};
        return { ...current, productId: value, supplierId: nextProduct.supplierId || current.supplierId, unitCost: nextProduct.cost || current.unitCost };
      }
      return { ...current, [name]: value };
    });
  };

  const submit = async event => {
    event.preventDefault();
    try {
      await recordPurchase(form);
      await refresh();
      close();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/60 p-4">
      <form className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#151515] p-6 shadow-soft" onSubmit={submit}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Add Stock Purchase</h2>
          <button onClick={close} className="btn-muted px-3" type="button">x</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label sm:col-span-2">Product<select className="field" name="productId" value={form.productId} onChange={update}>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <label className="label sm:col-span-2">Supplier<select className="field" name="supplierId" value={form.supplierId} onChange={update}><option value="">No supplier</option>{suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
          <label className="label">Quantity<input className="field" name="quantity" type="number" min="1" value={form.quantity} onChange={update} required /></label>
          <label className="label">Unit Cost<input className="field" name="unitCost" type="number" step="0.01" min="0" value={form.unitCost} onChange={update} required /></label>
        </div>
        <div className="mt-4 rounded-xl bg-white/5 p-4">
          <span className="text-xs font-black uppercase text-neutral-500">{selectedProduct.name || "Product"} purchase total</span>
          <strong className="mt-1 block text-2xl font-black text-[#35f4df]">{money(total)}</strong>
        </div>
        {message && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={close} className="btn-muted" type="button">Cancel</button>
          <button className="btn-primary" type="submit">Save Purchase</button>
        </div>
      </form>
    </div>
  );
}

