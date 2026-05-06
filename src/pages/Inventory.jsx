import { useMemo, useState } from "react";
import { FaBoxOpen, FaEdit, FaPlus } from "react-icons/fa";
import Card from "../components/Card";
import Pagination from "../components/Pagination";
import { saveProduct } from "../lib/api";

const emptyProduct = { id: "", sku: "", barcode: "", name: "", category: "", supplierId: "", stock: 0, minStock: 0, cost: 0, price: 0 };
const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

export default function Inventory({ products, suppliers, refresh }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [page, setPage] = useState(1);
  const [modalProduct, setModalProduct] = useState(null);
  const pageSize = 6;

  const rows = useMemo(() => {
    const term = query.toLowerCase();
    return products
      .filter(product => [product.name, product.sku, product.barcode, product.category].some(value => String(value).toLowerCase().includes(term)))
      .sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey]), undefined, { numeric: true }));
  }, [products, query, sortKey]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const submit = async product => {
    await saveProduct(product);
    setModalProduct(null);
    await refresh();
  };

  return (
    <>
      <Card
        title="Products"
        icon={FaBoxOpen}
        action={<button onClick={() => setModalProduct(emptyProduct)} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-black text-white hover:bg-teal-700" type="button"><FaPlus /> Add Product</button>}
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input className="field sm:max-w-sm" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search inventory..." />
          <select className="field sm:max-w-52" value={sortKey} onChange={event => setSortKey(event.target.value)}>
            <option value="name">Sort by name</option>
            <option value="sku">Sort by SKU</option>
            <option value="stock">Sort by stock</option>
            <option value="price">Sort by price</option>
          </select>
        </div>
        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>{["SKU", "Barcode", "Product", "Category", "Stock", "Price", "Status", ""].map(item => <th key={item} className="px-4 py-3 font-black">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pageRows.map(product => {
                const low = product.stock <= product.minStock;
                return (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold">{product.sku}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">{product.barcode || product.sku}</td>
                    <td className="px-4 py-3 font-black">{product.name}</td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className={`px-4 py-3 font-black ${low ? "text-red-600" : "text-slate-900"}`}>{product.stock}</td>
                    <td className="px-4 py-3">{money(product.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${low ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{low ? "Low Stock" : "In Stock"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setModalProduct(product)} className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 font-bold text-slate-700 hover:bg-slate-200" type="button"><FaEdit /> Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </Card>
      {modalProduct && <ProductModal product={modalProduct} suppliers={suppliers} close={() => setModalProduct(null)} save={submit} />}
    </>
  );
}

function ProductModal({ product, suppliers, close, save }) {
  const [form, setForm] = useState(product);
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/50 p-4">
      <form className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-soft" onSubmit={event => { event.preventDefault(); save(form); }}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black">{form.id ? "Edit Product" : "Add Product"}</h2>
          <button onClick={close} className="rounded-lg bg-slate-100 px-3 py-2 font-black hover:bg-slate-200" type="button">x</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {["sku", "barcode", "name", "category"].map(field => <label key={field} className="label">{field.toUpperCase()}<input name={field} className="field" value={form[field] || ""} onChange={update} required={field !== "barcode"} /></label>)}
          <label className="label">Supplier<select name="supplierId" className="field" value={form.supplierId} onChange={update}><option value="">None</option>{suppliers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          {["stock", "minStock", "cost", "price"].map(field => <label key={field} className="label">{field}<input name={field} className="field" type="number" step="0.01" min="0" value={form[field]} onChange={update} /></label>)}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={close} className="rounded-xl bg-slate-100 px-4 py-2 font-black hover:bg-slate-200" type="button">Cancel</button>
          <button className="rounded-xl bg-teal-600 px-4 py-2 font-black text-white hover:bg-teal-700" type="submit">Save Product</button>
        </div>
      </form>
    </div>
  );
}
