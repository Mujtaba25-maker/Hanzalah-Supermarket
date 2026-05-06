import { useMemo, useState } from "react";
import { FaUserCircle, FaUsers } from "react-icons/fa";
import Card from "../components/Card";
import Pagination from "../components/Pagination";

export default function Customers({ customers }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [page, setPage] = useState(1);
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
    <Card title="Customers" icon={FaUsers}>
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
            <tr>{["Customer", "Email", "Phone", "Orders Count"].map(item => <th key={item} className="px-4 py-3 font-black">{item}</th>)}</tr>
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
            </tr>)}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </Card>
  );
}
