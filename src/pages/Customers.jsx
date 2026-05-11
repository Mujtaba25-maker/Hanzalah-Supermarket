import { useMemo, useState } from "react";
import { FaEdit, FaPlus, FaUserCircle, FaUsers } from "react-icons/fa";
import Card from "../components/Card";
import Pagination from "../components/Pagination";
import { createContact, updateContact } from "../lib/api";

const emptyCustomer = { id: "", name: "", email: "", phone: "", address: "", type: "customer" };

export default function Customers({ customers, refresh }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [page, setPage] = useState(1);
  const [modalCustomer, setModalCustomer] = useState(null);
  const pageSize = 6;

  const rows = useMemo(() => {
    const term = query.toLowerCase();
    return customers
      .filter(customer => [customer.name, customer.email, customer.phone].some(value => String(value).toLowerCase().includes(term)))
      .sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey]), undefined, { numeric: true }));
  }, [customers, query, sortKey]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
    <Card
      title="Customers"
      icon={FaUsers}
      action={<button className="btn-primary" onClick={() => setModalCustomer(emptyCustomer)} type="button"><FaPlus /> Add Customer</button>}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px]">
        <input className="field" placeholder="Search customers..." value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} />
        <select className="field" value={sortKey} onChange={event => setSortKey(event.target.value)}>
          <option value="name">Sort by name</option>
          <option value="orders">Sort by orders</option>
          <option value="email">Sort by email</option>
        </select>
      </div>
      <div className="overflow-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>{["Customer", "Email", "Phone", "Orders Count", ""].map(item => <th key={item} className="px-4 py-3 font-black">{item}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {pageRows.map(customer => <tr key={customer.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <FaUserCircle className="text-3xl text-slate-400" />
                  <span className="font-black">{customer.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">{customer.email}</td>
              <td className="px-4 py-3">{customer.phone || "No phone"}</td>
              <td className="px-4 py-3 font-black">{customer.orders}</td>
              <td className="px-4 py-3 text-right">
                {!String(customer.id).startsWith("extra") && <button className="btn-muted px-3" onClick={() => setModalCustomer({ ...customer, type: "customer" })} type="button"><FaEdit /> Edit</button>}
              </td>
            </tr>)}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </Card>
    {modalCustomer && <CustomerModal customer={modalCustomer} close={() => setModalCustomer(null)} refresh={refresh} />}
    </>
  );
}

function CustomerModal({ customer, close, refresh }) {
  const [form, setForm] = useState(customer);
  const [message, setMessage] = useState("");
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async event => {
    event.preventDefault();
    try {
      if (form.id) await updateContact(form.id, { ...form, type: "customer" });
      else await createContact({ ...form, type: "customer" });
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
          <h2 className="text-xl font-black">{form.id ? "Edit Customer" : "Add Customer"}</h2>
          <button className="btn-muted px-3" onClick={close} type="button">x</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label sm:col-span-2">Name<input className="field" name="name" value={form.name} onChange={update} required /></label>
          <label className="label">Email<input className="field" name="email" type="email" value={form.email || ""} onChange={update} /></label>
          <label className="label">Phone<input className="field" name="phone" value={form.phone || ""} onChange={update} /></label>
          <label className="label sm:col-span-2">Address<input className="field" name="address" value={form.address || ""} onChange={update} /></label>
        </div>
        {message && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-muted" onClick={close} type="button">Cancel</button>
          <button className="btn-primary" type="submit">Save Customer</button>
        </div>
      </form>
    </div>
  );
}
